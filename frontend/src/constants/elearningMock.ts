export const ELEARNING_MOCK = {
  courses: [
    {
      id: 'CS101',
      name: 'Lập trình hướng đối tượng',
      code: 'LTHDT_01',
      teacher: 'ThS. Nguyễn Văn A',
      progress: 75,
      lessons: 12,
      assignments: 4,
      exams: 1,
      nextDeadline: '2024-04-30',
      category: 'Công nghệ thông tin',
      students: 45,
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: 'CS102',
      name: 'Cấu trúc dữ liệu và Giải thuật',
      code: 'CTDL_02',
      teacher: 'TS. Trần Thị B',
      progress: 45,
      lessons: 15,
      assignments: 6,
      exams: 2,
      nextDeadline: '2024-05-05',
      category: 'Công nghệ thông tin',
      students: 42,
      image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: 'CS103',
      name: 'Mạng máy tính',
      code: 'MMT_01',
      teacher: 'ThS. Lê Văn C',
      progress: 20,
      lessons: 10,
      assignments: 3,
      exams: 1,
      nextDeadline: '2024-05-10',
      category: 'Mạng & Truyền thông',
      students: 38,
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=500&auto=format&fit=crop'
    }
  ],
  deadlines: [
    { id: 1, title: 'Báo cáo bài tập lớn', course: 'Lập trình hướng đối tượng', due: '2 ngày tới', type: 'assignment', priority: 'high' },
    { id: 2, title: 'Bài tập chương 3', course: 'Cấu trúc dữ liệu', due: 'Ngày mai', type: 'assignment', priority: 'critical' },
    { id: 3, title: 'Thi giữa kỳ', course: 'Mạng máy tính', due: '5 ngày tới', type: 'exam', priority: 'medium' }
  ],
  announcements: [
    { id: 1, sender: 'ThS. Nguyễn Văn A', title: 'Thông báo dời lịch nộp bài tập lớn', time: '10 phút trước', content: 'Hạn nộp bài tập lớn sẽ được dời sang ngày 30/04/2024.' },
    { id: 2, sender: 'TS. Trần Thị B', title: 'Tài liệu ôn tập chương 4', time: '1 giờ trước', content: 'Các bạn tải slide chương 4 trong mục tài liệu môn học nhé.' }
  ],
  activities: [
    { id: 1, user: 'Minh Đăng', action: 'đã nộp bài tập', target: 'Chương 3 - OOP', time: '5 phút trước' },
    { id: 2, user: 'Giảng viên A', action: 'đã đăng bài giảng mới', target: 'Đa hình trong Java', time: '30 phút trước' },
    { id: 3, user: 'Hệ thống', action: 'đã mở bài thi', target: 'Trắc nghiệm MMT', time: '1 giờ trước' }
  ]
};
