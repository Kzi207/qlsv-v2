export type RoomType = 'theory' | 'lab';

export interface TLecturer {
  id: string;
  name: string;
  specialization: string;
  max_hours_per_week: number;
}

export interface TSubject {
  id: string;
  name: string;
  credits: number; // số tiết cần học liên tục
  type: RoomType;
}

export interface TTeachingAssignment {
  id: string;
  lecturer_id: string;
  subject_id: string;
}

export interface TClass {
  id: string;
  subject_id: string;
  lecturer_id?: string; // Có thể null để thuật toán tự xếp
  student_group_id: string; // id của lớp sinh viên (VD: CNTT1)
  size: number;
}

export interface TRoom {
  id: string;
  name: string;
  capacity: number;
  type: RoomType;
}

export interface TTimeSlot {
  id: string;
  day_of_week: number; // 2 to 8 (Chủ nhật)
  start_time: number; // tiết bắt đầu (1-12)
  end_time: number;   // tiết kết thúc
}

export interface TSchedule {
  id?: string;
  class_id: string;
  room_id: string;
  timeslot_id: string;
}

export interface ScheduleResult {
  success: boolean;
  schedules: TSchedule[];
  conflicts: TClass[]; // Danh sách các lớp không xếp được
  score: number; // Điểm tối ưu soft constraints
}
