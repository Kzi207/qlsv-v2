import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
