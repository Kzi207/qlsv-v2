import { SchedulerService } from './scheduler.service';
import { TClass, TLecturer, TRoom, TSubject, TTimeSlot, TTeachingAssignment } from './types';

// ================= DEMO DATA =================

const lecturers: TLecturer[] = [
  { id: 'L1', name: 'ThS. Nguyễn Văn A', specialization: 'IT', max_hours_per_week: 15 }, // Chỉ dạy tối đa 15 tiết/tuần
  { id: 'L2', name: 'TS. Trần Thị B', specialization: 'Math', max_hours_per_week: 20 },
  { id: 'L3', name: 'PGS. TS. Lê C', specialization: 'AI', max_hours_per_week: 10 },
];

const subjects: TSubject[] = [
  { id: 'S1', name: 'Lập trình C++', credits: 3, type: 'lab' },
  { id: 'S2', name: 'Toán Rời Rạc', credits: 2, type: 'theory' },
  { id: 'S3', name: 'Cấu trúc dữ liệu', credits: 3, type: 'theory' },
  { id: 'S4', name: 'Trí tuệ nhân tạo', credits: 3, type: 'theory' },
];

// Phân công giảng dạy (Giảng viên có thể dạy nhiều môn, 1 môn có thể nhiều giảng viên dạy)
const teaching_assignments: TTeachingAssignment[] = [
  { id: 'A1', lecturer_id: 'L1', subject_id: 'S1' }, // ThS A dạy C++
  { id: 'A2', lecturer_id: 'L1', subject_id: 'S3' }, // ThS A cũng dạy CTDL
  { id: 'A3', lecturer_id: 'L2', subject_id: 'S2' }, // TS B dạy Toán RR
  { id: 'A4', lecturer_id: 'L3', subject_id: 'S4' }, // PGS C dạy AI
  { id: 'A5', lecturer_id: 'L1', subject_id: 'S4' }, // ThS A cũng có thể dạy AI (A dạy tới 3 môn: S1, S3, S4)
];

const rooms: TRoom[] = [
  { id: 'R1', name: 'Phòng Lab 1', capacity: 40, type: 'lab' },
  { id: 'R2', name: 'Giảng đường A1', capacity: 100, type: 'theory' },
  { id: 'R3', name: 'Giảng đường A2', capacity: 60, type: 'theory' },
];

const timeslots: TTimeSlot[] = [
  { id: 'T2_M1', day_of_week: 2, start_time: 1, end_time: 3 }, // Thứ 2, Sáng (3 tiết)
  { id: 'T2_M2', day_of_week: 2, start_time: 4, end_time: 5 }, // Thứ 2, Sáng (2 tiết)
  { id: 'T3_M1', day_of_week: 3, start_time: 1, end_time: 3 }, // Thứ 3, Sáng (3 tiết)
  { id: 'T3_A1', day_of_week: 3, start_time: 6, end_time: 8 }, // Thứ 3, Chiều (3 tiết)
];

// Các lớp học phần cần được xếp lịch (BỎ TRỐNG LECTURER ĐỂ THUẬT TOÁN TỰ CHỌN)
const classes: TClass[] = [
  { id: 'C1', subject_id: 'S1', student_group_id: 'IT01', size: 35 }, // Lập trình C++
  { id: 'C2', subject_id: 'S2', student_group_id: 'IT01', size: 40 }, // Toán RR
  { id: 'C3', subject_id: 'S3', student_group_id: 'IT02', size: 50 }, // CTDL
  { id: 'C4', subject_id: 'S2', student_group_id: 'IT02', size: 55 }, // Toán RR
  { id: 'C5', subject_id: 'S4', student_group_id: 'IT03', size: 80 }, // AI - Lớp đông (80)
];

// ================= CHẠY THUẬT TOÁN =================

console.log('⏳ Khởi tạo Scheduler (Tự động gán Giảng viên)...');
const scheduler = new SchedulerService(lecturers, subjects, classes, rooms, timeslots, teaching_assignments);

console.log('🚀 Đang xếp lịch...');
const result = scheduler.generate();

// ================= OUTPUT =================

console.log('\n================ KẾT QUẢ ================');
console.log(`✅ Thành công: ${result.success}`);
console.log(`🎯 Điểm tối ưu: ${result.score}`);
console.log(`❌ Số lớp conflict: ${result.conflicts.length}`);

console.log('\n📅 LỊCH ĐÃ XẾP:');
result.schedules.forEach(s => {
  const cls = classes.find(c => c.id === s.class_id)!;
  const sub = subjects.find(su => su.id === cls.subject_id)!;
  const assigned = s as any;
  const lec = lecturers.find(l => l.id === assigned.lecturer_id)!;
  const room = rooms.find(r => r.id === s.room_id)!;
  const slot = timeslots.find(t => t.id === s.timeslot_id)!;

  console.log(`- Lớp [${s.class_id}] (${cls.student_group_id}): ${sub.name}`);
  console.log(`  👨‍🏫 GV: ${lec.name} | 🏠 Phòng: ${room.name} (${room.capacity} chỗ, ${room.type})`);
  console.log(`  ⏰ Thời gian: Thứ ${slot.day_of_week}, Tiết ${slot.start_time}-${slot.end_time}`);
  console.log('------------------------------------------------');
});

if (result.conflicts.length > 0) {
  console.log('\n⚠️ CÁC LỚP KHÔNG XẾP ĐƯỢC (CONFLICT):');
  result.conflicts.forEach(c => {
    const sub = subjects.find(su => su.id === c.subject_id)!;
    console.log(`- Lớp [${c.id}]: ${sub.name} (Sĩ số: ${c.size})`);
  });
}
