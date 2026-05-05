import { ConstraintService } from './constraint.service';
import { ScheduleResult, TClass, TLecturer, TRoom, TSchedule, TSubject, TTimeSlot, TTeachingAssignment } from './types';

// Mở rộng TSchedule để bao gồm lecturer_id đã được gán
export type TAssignedSchedule = TSchedule & { lecturer_id: string };

export class SchedulerService {
  private constraintService: ConstraintService;

  private lecturersMap = new Map<string, TLecturer>();
  private subjectsMap = new Map<string, TSubject>();
  private classesMap = new Map<string, TClass>();
  private roomsMap = new Map<string, TRoom>();
  private timeslotsMap = new Map<string, TTimeSlot>();

  constructor(
    private lecturers: TLecturer[],
    private subjects: TSubject[],
    private classes: TClass[],
    private rooms: TRoom[],
    private timeslots: TTimeSlot[],
    private assignments: TTeachingAssignment[]
  ) {
    this.lecturers.forEach(l => this.lecturersMap.set(l.id, l));
    this.subjects.forEach(s => this.subjectsMap.set(s.id, s));
    this.classes.forEach(c => this.classesMap.set(c.id, c));
    this.rooms.forEach(r => this.roomsMap.set(r.id, r));
    this.timeslots.forEach(t => this.timeslotsMap.set(t.id, t));

    this.constraintService = new ConstraintService(
      this.lecturersMap,
      this.subjectsMap,
      this.classesMap,
      this.roomsMap,
      this.timeslotsMap,
      this.assignments
    );
  }

  public generate(): ScheduleResult & { schedules: TAssignedSchedule[] } {
    const sortedClasses = [...this.classes].sort((a, b) => {
      if (b.size !== a.size) return b.size - a.size;
      const subA = this.subjectsMap.get(a.subject_id)!;
      const subB = this.subjectsMap.get(b.subject_id)!;
      return subB.credits - subA.credits;
    });

    const schedules: TAssignedSchedule[] = [];
    const conflicts: TClass[] = [];

    for (const cls of sortedClasses) {
      const bestAssignment = this.findBestFit(cls, schedules);

      if (bestAssignment) {
        schedules.push(bestAssignment);
      } else {
        conflicts.push(cls);
      }
    }

    const score = this.constraintService.calculateScore(schedules);

    return {
      success: conflicts.length === 0,
      schedules,
      conflicts,
      score
    };
  }

  private findBestFit(cls: TClass, currentSchedules: TAssignedSchedule[]): TAssignedSchedule | null {
    let bestSchedule: TAssignedSchedule | null = null;
    let maxScore = -Infinity;

    // Lấy danh sách giảng viên có thể dạy lớp này (nếu đã fix cứng thì chỉ lấy 1 người, nếu null thì lấy tất cả theo phân công)
    const possibleLecturers = cls.lecturer_id 
      ? [cls.lecturer_id] 
      : this.constraintService.getEligibleLecturersForSubject(cls.subject_id);

    if (possibleLecturers.length === 0) return null; // Không có giảng viên nào dạy môn này

    for (const lecturerId of possibleLecturers) {
      for (const slot of this.timeslots) {
        for (const room of this.rooms) {
          
          if (this.constraintService.isValid(currentSchedules, cls.id, lecturerId, room.id, slot.id)) {
            
            const tempSchedules: TAssignedSchedule[] = [...currentSchedules, {
              class_id: cls.id,
              lecturer_id: lecturerId,
              room_id: room.id,
              timeslot_id: slot.id
            }];

            const score = this.constraintService.calculateScore(tempSchedules);
            
            if (score > maxScore) {
              maxScore = score;
              bestSchedule = {
                class_id: cls.id,
                lecturer_id: lecturerId,
                room_id: room.id,
                timeslot_id: slot.id
              };
            }
          }
        }
      }
    }

    return bestSchedule;
  }
}
