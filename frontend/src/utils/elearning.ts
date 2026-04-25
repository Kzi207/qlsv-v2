export const defaultCourseImage =
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=900&auto=format&fit=crop';

export interface ElearningSubmission {
  id?: number | string;
  student?: {
    name?: string;
    student_code?: string;
    studentCode?: string;
  };
  grade?: number | null;
  submittedAt?: string | Date | null;
}

export interface ElearningAssignment {
  id?: number | string;
  title?: string;
  dueDate?: string | Date | null;
  submissions?: ElearningSubmission[];
}

export interface ElearningExam {
  id?: number | string;
  title?: string;
  startTime?: string | Date | null;
}

export interface ElearningLesson {
  id?: number | string;
  title?: string;
  createdAt?: string | Date | null;
  isVisible?: boolean;
}

export interface ElearningCourse {
  id?: number | string;
  name?: string;
  description?: string | null;
  image?: string | null;
  code?: string;
  category?: string;
  classId?: string | null;
  progress?: number | string | null;
  students?: number | string | null;
  studentCount?: number | string | null;
  subject?: {
    code?: string;
    name?: string;
    _count?: {
      registrations?: number;
    };
  };
  teacher?: string | {
    name?: string;
  };
  lessons?: ElearningLesson[];
  assignments?: ElearningAssignment[];
  exams?: ElearningExam[];
  _count?: {
    lessons?: number;
    assignments?: number;
    exams?: number;
  };
}

export const asArray = <T = unknown>(value: T[] | undefined | null): T[] => {
  return Array.isArray(value) ? value : [];
};

export const getCount = (course: ElearningCourse, key: 'lessons' | 'assignments' | 'exams') => {
  const value = course?.[key];
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'number') return value;
  return Number(course?._count?.[key] || 0);
};

export const getCourseCode = (course: ElearningCourse) => {
  return course?.subject?.code || course?.code || 'E-Learning';
};

export const getCourseCategory = (course: ElearningCourse) => {
  return course?.subject?.name || course?.category || 'Môn học trực tuyến';
};

export const getTeacherName = (course: ElearningCourse) => {
  if (typeof course?.teacher === 'string') return course.teacher;
  return course?.teacher?.name || 'Chưa phân công giảng viên';
};

export const getStudentCount = (course: ElearningCourse) => {
  return Number(course?.students || course?.studentCount || course?.subject?._count?.registrations || 0);
};

export const getCourseProgress = (course: ElearningCourse) => {
  const explicit = Number(course?.progress);
  if (!Number.isNaN(explicit) && explicit >= 0) return Math.min(100, explicit);

  const lessons = asArray(course?.lessons);
  if (!lessons.length) return 0;

  const visibleLessons = lessons.filter((lesson) => lesson?.isVisible !== false).length;
  return Math.round((visibleLessons / lessons.length) * 100);
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'Chưa đặt hạn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa đặt hạn';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isUpcoming = (value?: string | Date | null) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now();
};
