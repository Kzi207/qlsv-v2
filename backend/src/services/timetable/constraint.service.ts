import {
  TClass,
  TLecturer,
  TRoom,
  TSchedule,
  TSubject,
  TTimeSlot,
  TTeachingAssignment
} from './types';

export class ConstraintService {
  constructor(
    private lecturers: Map<string, TLecturer>,
    private subjects: Map<string, TSubject>,
    private classes: Map<string, TClass>,
    private rooms: Map<string, TRoom>,
    private timeslots: Map<string, TTimeSlot>,
    private assignments: TTeachingAssignment[]
  ) {}

  /**
   * Lấy danh sách ID các giảng viên có thể dạy một môn học
   */
  public getEligibleLecturersForSubject(subjectId: string): string[] {
    return this.assignments
      .filter(a => a.subject_id === subjectId)
      .map(a => a.lecturer_id);
  }

  /**
   * Kiểm tra xem việc gán (classId, lecturerId, roomId, timeslotId) có hợp lệ không (HARD CONSTRAINTS)
   */
  public isValid(
    currentSchedules: (TSchedule & { lecturer_id: string })[],
    classId: string,
    lecturerId: string,
    roomId: string,
    timeslotId: string
  ): boolean {
    const cls = this.classes.get(classId)!;
    const room = this.rooms.get(roomId)!;
    const slot = this.timeslots.get(timeslotId)!;
    const subject = this.subjects.get(cls.subject_id)!;
    const lecturer = this.lecturers.get(lecturerId)!;

    // Hard Constraint: Sức chứa và loại phòng
    if (room.capacity < cls.size) return false;
    if (room.type !== subject.type) return false;

    // Hard Constraint: Lớp phải đủ số tiết
    const slotLength = slot.end_time - slot.start_time + 1;
    if (slotLength < subject.credits) return false;

    // Hard Constraint: Giảng viên phải được phân công dạy môn này
    const eligibleLecturers = this.getEligibleLecturersForSubject(cls.subject_id);
    if (!eligibleLecturers.includes(lecturerId)) return false;

    // Kiểm tra tổng số giờ dạy của giảng viên trong tuần không vượt quá max_hours_per_week
    let currentHours = 0;
    for (const schedule of currentSchedules) {
      if (schedule.lecturer_id === lecturerId) {
        const sSlot = this.timeslots.get(schedule.timeslot_id)!;
        currentHours += (sSlot.end_time - sSlot.start_time + 1);
      }
    }
    if (currentHours + slotLength > lecturer.max_hours_per_week) return false;

    // Kiểm tra xung đột với các lịch đã xếp
    for (const schedule of currentSchedules) {
      if (schedule.timeslot_id === timeslotId) {
        const scheduledClass = this.classes.get(schedule.class_id)!;

        // Hard Constraint 1: Giảng viên không dạy 2 lớp cùng lúc
        if (schedule.lecturer_id === lecturerId) return false;

        // Hard Constraint 2: Phòng không chứa 2 lớp cùng lúc
        if (schedule.room_id === roomId) return false;

        // Hard Constraint 3: Sinh viên (student_group) không học 2 môn cùng lúc
        if (scheduledClass.student_group_id === cls.student_group_id) return false;
      }
    }

    return true;
  }

  /**
   * Tính điểm tối ưu cho một thời khóa biểu (SOFT CONSTRAINTS)
   */
  public calculateScore(schedules: (TSchedule & { lecturer_id: string })[]): number {
    let score = 1000;

    const lecturerSchedules: Record<string, typeof schedules> = {};
    const studentGroupSchedules: Record<string, typeof schedules> = {};

    for (const s of schedules) {
      const cls = this.classes.get(s.class_id)!;
      
      if (!lecturerSchedules[s.lecturer_id]) {
        lecturerSchedules[s.lecturer_id] = [];
      }
      lecturerSchedules[s.lecturer_id]!.push(s);

      if (!studentGroupSchedules[cls.student_group_id]) {
        studentGroupSchedules[cls.student_group_id] = [];
      }
      studentGroupSchedules[cls.student_group_id]!.push(s);

      const slot = this.timeslots.get(s.timeslot_id)!;
      // Soft Constraint 3: Ưu tiên học buổi sáng (tiết 1-5)
      if (slot.start_time <= 5) {
        score += 10;
      }
    }

    // Soft Constraint 1: Tránh dạy liên tục cho GV
    for (const [lecturerId, scheds] of Object.entries(lecturerSchedules)) {
      const days = new Set(scheds.map(s => this.timeslots.get(s.timeslot_id)!.day_of_week));
      if (days.size > 4) {
        score -= (days.size - 4) * 20; 
      }
    }

    // Soft Constraint 2: Tránh sinh viên học dồn 1 ngày (Quá 2 ca 1 ngày)
    for (const [groupId, scheds] of Object.entries(studentGroupSchedules)) {
      const dayCounts: Record<number, number> = {};
      for (const s of scheds) {
        const day = this.timeslots.get(s.timeslot_id)!.day_of_week;
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
      for (const count of Object.values(dayCounts)) {
        if (count > 2) { 
          score -= (count - 2) * 30;
        }
      }
    }

    return score;
  }
}
