export interface ScheduleEvent {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  classId: string;
  day: number | string; // Day of week (2-8)
  startPeriod: number | string;
  endPeriod: number | string;
  type: 'offline' | 'online' | 'hybrid' | 'exam' | 'cancelled';
  date?: string; // Optional specific date (YYYY-MM-DD)
}
