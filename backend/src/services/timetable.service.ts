import { Prisma } from '../generated/client_final';
import prisma from '../utils/prisma';

// Các Interface định nghĩa cấu trúc dữ liệu đầu vào cho Thuật toán
export interface TClass {
  id: string; // name in your current Prisma schema
  size: number;
}

export interface TCourse {
  id: number;
  name: string;
  teacherId: number;
  sessions: number; // Số buổi cần học trong tuần
}

export interface TTeacher {
  id: number;
  // availability?: number[]; // Mảng ID các slot rảnh (tùy chọn mở rộng)
}

export interface TRoom {
  id: number;
  name: string;
  capacity: number;
}

export interface TTimeSlot {
  id: number;     // Ví dụ: 1 đến 50
  day: number;    // 2 (Thứ 2) -> 7 (Thứ 7)
  period: number; // 1 (Tiết 1-3), 2 (Tiết 4-6), 3 (Tiết 7-9), v.v.
}

export interface ClassCourseRequirement {
  classId: string;
  courseId: number;
}

export interface ScheduleResult {
  classId: string;
  courseId: number;
  teacherId: number;
  roomId: number;
  slotId: number;
}

/**
 * Kiểm tra xung đột lịch học cho một danh sách các tiết học
 */
export const checkConflicts = async (events: any[]) => {
  const allConflicts: any[] = [];

  for (const event of events) {
    const { room, teacher, classId, day, startPeriod, endPeriod, id } = event;
    if (!room || !teacher || !classId || !day || !startPeriod || !endPeriod) continue;

    const standardizedRoom = room.trim().toUpperCase();

    // Truy vấn xung đột từ Database
    const conflicts: any[] = await prisma.$queryRaw`
      SELECT id, room, teacher, classId, subject 
      FROM timetable 
      WHERE day = ${parseInt(day as any)} 
      AND (
        (startPeriod <= ${parseInt(startPeriod as any)} AND endPeriod >= ${parseInt(startPeriod as any)})
        OR (startPeriod <= ${parseInt(endPeriod as any)} AND endPeriod >= ${parseInt(endPeriod as any)})
        OR (${parseInt(startPeriod as any)} <= startPeriod AND ${parseInt(endPeriod as any)} >= startPeriod)
      )
      ${id ? (Prisma as any).sql`AND id != ${id}` : (Prisma as any).empty}
    `;

    for (const conflict of conflicts) {
      if (conflict.room.trim().toUpperCase() === standardizedRoom) {
        allConflicts.push({ event, type: 'ROOM', message: `Phòng ${conflict.room} đã có lịch dạy môn ${conflict.subject}` });
      } else if (conflict.teacher.trim().toLowerCase() === teacher.trim().toLowerCase()) {
        allConflicts.push({ event, type: 'TEACHER', message: `Giảng viên ${conflict.teacher} đã có lịch dạy vào thời gian này` });
      } else if (conflict.classId === classId) {
        allConflicts.push({ event, type: 'CLASS', message: `Lớp ${conflict.classId} đã có lịch học vào thời gian này` });
      }
    }
  }

  return allConflicts;
};

/**
 * Tạo hàng loạt lịch học sau khi đã kiểm tra xung đột
 */
export const bulkCreateSchedules = async (events: any[]) => {
  const results = [];
  for (const event of events) {
    const created = await (prisma as any).timetable.create({
      data: {
        subject: event.subject,
        teacher: event.teacher,
        room: event.room.trim().toUpperCase(),
        day: parseInt(event.day as any),
        startPeriod: parseInt(event.startPeriod as any),
        endPeriod: parseInt(event.endPeriod as any),
        classId: event.classId,
        semesterId: event.semesterId,
        type: event.type || 'offline',
        startDate: event.startDate ? new Date(event.startDate) : new Date(),
        updatedAt: new Date()
      }
    });
    results.push(created);
  }
  return results;
};

export class TimetableSolver {
  private classes: Map<string, TClass> = new Map();
  private courses: Map<number, TCourse> = new Map();
  private rooms: TRoom[] = [];
  private timeSlots: TTimeSlot[] = [];
  
  // Trạng thái (State) trong quá trình chạy thuật toán
  private schedules: ScheduleResult[] = [];
  private unscheduled: { classId: string; courseId: number; reason: string }[] = [];

  constructor(
    classes: TClass[],
    courses: TCourse[],
    rooms: TRoom[],
    timeSlots: TTimeSlot[]
  ) {
    classes.forEach(c => this.classes.set(c.id, c));
    courses.forEach(c => this.courses.set(c.id, c));
    this.rooms = rooms.sort((a, b) => a.capacity - b.capacity); // Sort phòng từ nhỏ tới lớn để tiết kiệm sức chứa
    this.timeSlots = timeSlots;
  }

  /**
   * Chạy thuật toán Greedy Heuristic để xếp thời khóa biểu
   * @param requirements Danh sách các môn mà từng lớp cần học
   */
  public generate(requirements: ClassCourseRequirement[]): { success: boolean; schedules: ScheduleResult[]; unscheduled: any[] } {
    this.schedules = [];
    this.unscheduled = [];

    // Lặp qua từng yêu cầu (Lớp X cần học Môn Y)
    for (const req of requirements) {
      const cls = this.classes.get(req.classId);
      const course = this.courses.get(req.courseId);

      if (!cls || !course) {
        this.unscheduled.push({ ...req, reason: 'Invalid Class or Course ID' });
        continue;
      }

      // Một môn có thể cần học nhiều buổi (sessions) trong tuần
      let sessionsAssigned = 0;

      for (let i = 0; i < course.sessions; i++) {
        let assigned = false;

        // Thử tìm (Slot + Room) phù hợp
        for (const slot of this.timeSlots) {
          for (const room of this.rooms) {
            // Ràng buộc 1: Sức chứa phòng >= Sĩ số lớp
            if (room.capacity < cls.size) continue;

            // Ràng buộc 2, 3, 4: Không trùng lặp
            if (this.isValidAssignment(req.classId, course.teacherId, room.id, slot.id)) {
              this.schedules.push({
                classId: req.classId,
                courseId: req.courseId,
                teacherId: course.teacherId,
                roomId: room.id,
                slotId: slot.id
              });
              assigned = true;
              sessionsAssigned++;
              break; // Thoát vòng lặp Room, đi tới session tiếp theo hoặc môn tiếp theo
            }
          }
          if (assigned) break; // Thoát vòng lặp Slot nếu đã tìm được
        }

        // Nếu duyệt qua tất cả Slot và Room mà không gán được
        if (!assigned) {
          this.unscheduled.push({
            classId: req.classId,
            courseId: req.courseId,
            reason: `Cannot find available slot/room for session ${i + 1}/${course.sessions}`
          });
        }
      }
    }

    return {
      success: this.unscheduled.length === 0,
      schedules: this.schedules,
      unscheduled: this.unscheduled
    };
  }

  /**
   * Kiểm tra các Hard Constraints
   */
  private isValidAssignment(classId: string, teacherId: number, roomId: number, slotId: number): boolean {
    for (const s of this.schedules) {
      // Cùng một thời điểm (slot)
      if (s.slotId === slotId) {
        // 1. Không trùng lớp (1 lớp không học 2 môn cùng lúc)
        if (s.classId === classId) return false;
        
        // 2. Không trùng giáo viên (1 GV không dạy 2 lớp cùng lúc)
        if (s.teacherId === teacherId) return false;
        
        // 3. Không trùng phòng (1 phòng chỉ học 1 lớp)
        if (s.roomId === roomId) return false;
      }
    }
    return true;
  }
}
