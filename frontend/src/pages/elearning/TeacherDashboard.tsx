import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  FileText,
  Monitor,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import CourseCard from '../../components/elearning/CourseCard';
import { toast } from 'react-hot-toast';
import ELearningRightPanel from '../../components/elearning/ELearningRightPanel';
import { useAuthStore } from '../../store/useAuthStore';
import {
  asArray,
  formatDateTime,
  getCourseCategory,
  getStudentCount,
  type ElearningCourse,
  type ElearningSubmission,
} from '../../utils/elearning';

interface TeacherStats {
  totalCourses?: number;
  pendingAssignments?: number;
  totalLessons?: number;
  totalStudents?: number;
}

interface PendingSubmission extends ElearningSubmission {
  studentName: string;
  studentCode: string;
  courseName: string;
  assignmentTitle: string;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<ElearningCourse[]>([]);
  const [statsData, setStatsData] = useState<TeacherStats>({});
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const [coursesRes, statsRes] = await Promise.all([
        api.get('/elearning/courses'),
        api.get('/elearning/teacher-stats'),
      ]);
      setCourses(asArray<ElearningCourse>(coursesRes.data));
      setStatsData(statsRes.data || {});
    } catch (error) {
      console.error('Failed to fetch teacher data', error);
      setCourses([]);
      setStatsData({});
    } finally {
      setLoading(false);
    }
  }

  

  const handleDeleteClick = (id: number | string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const loadingToast = toast.loading('Đang xử lý xóa khóa học...');
    try {
      await api.delete(`/elearning/courses/${deleteId}`);
      setCourses(prev => prev.filter((c) => c.id !== deleteId));
      toast.success('Đã xóa khóa học thành công', { id: loadingToast });
      setDeleteId(null);
      void fetchData();
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Không thể xóa khóa học';
      toast.error(msg, { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const ConfirmModal = () => {
    if (!deleteId) return null;
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          onClick={() => !isDeleting && setDeleteId(null)}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-inner">
              <AlertTriangle size={40} className="animate-pulse" />
            </div>
            <h3 className="mb-3 text-2xl font-black text-slate-900 uppercase tracking-tight">Xác nhận xóa?</h3>
            <p className="mb-8 text-sm font-medium leading-relaxed text-slate-500">
              Bạn có chắc chắn muốn xóa khóa học này? Mọi dữ liệu liên quan sẽ bị <span className="font-bold text-red-600 underline">xóa vĩnh viễn</span> và không thể khôi phục.
            </p>
            <div className="flex w-full gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-red-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-200 transition hover:bg-red-700 hover:shadow-red-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };


  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, []);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return courses;

    return courses.filter((course) =>
      [course?.name, course?.subject?.code, getCourseCategory(course), course?.classId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [courses, query]);

  const pendingSubmissions = useMemo(() => {
    return courses
      .flatMap((course) =>
        asArray(course.assignments).flatMap((assignment) =>
          asArray(assignment.submissions).map((submission): PendingSubmission => ({
            id: submission.id,
            studentName: submission.student?.name || 'Sinh viên',
            studentCode: submission.student?.student_code || submission.student?.studentCode || '',
            courseName: course.name || 'Lớp học',
            assignmentTitle: assignment.title || 'Bài tập',
            submittedAt: submission.submittedAt,
            grade: submission.grade,
          })),
        ),
      )
      .filter((submission) => submission.grade === null || submission.grade === undefined)
      .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
      .slice(0, 5);
  }, [courses]);

  const totalStudentsFromCourses = courses.reduce((sum, course) => sum + getStudentCount(course), 0);
  const stats = [
    { label: 'Lớp đang dạy', value: statsData?.totalCourses ?? courses.length, icon: Monitor, color: 'bg-indigo-600' },
    { label: 'Bài nộp chờ chấm', value: statsData?.pendingAssignments ?? pendingSubmissions.length, icon: FileText, color: 'bg-amber-500' },
    { label: 'Bài giảng đã đăng', value: statsData?.totalLessons ?? 0, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Tổng sinh viên', value: statsData?.totalStudents ?? totalStudentsFromCourses, icon: Users, color: 'bg-blue-600' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] pb-20 animate-fade-up">
      <ConfirmModal />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
        <main className="space-y-8">
          <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                <Monitor size={12} /> Cổng giảng viên
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Quản lý E-Learning</h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                Chào <span className="font-black text-indigo-600">{user?.name || 'giảng viên'}</span>, bạn có
                {' '}<span className="font-black text-slate-900">{stats[1].value}</span> bài nộp cần chấm trong các lớp đang phụ trách.
              </p>
            </div>

            <button
              onClick={() => navigate('/elearning/manage/courses')}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 active:scale-95"
            >
              <Plus size={18} /> Tạo lớp mới
            </button>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{stat.value}</p>
              </motion.div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Tìm lớp học, mã môn, học phần..."
                className="w-full rounded-xl border border-transparent bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                Lớp học đang giảng dạy
                <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-600">
                  {filteredCourses.length}/{courses.length}
                </span>
              </h2>
              <button
                onClick={() => navigate('/elearning/manage/courses')}
                className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 transition hover:translate-x-1 sm:flex"
              >
                Quản lý tất cả <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[1, 2].map((item) => (
                  <div key={item} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    role="LECTURER"
                    onEnter={() => navigate(`/elearning/manage/${course.id}`)}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <Monitor size={34} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">
                  {query ? 'Không tìm thấy lớp học phù hợp' : 'Bạn chưa phụ trách lớp học nào'}
                </p>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Bài nộp chờ chấm</h3>
              <BarChart3 size={18} className="text-slate-400" />
            </div>
            {pendingSubmissions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sinh viên</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Bài tập</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian nộp</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSubmissions.map((submission) => (
                      <tr key={submission.id} className="transition hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-900">{submission.studentName}</p>
                          <p className="text-[10px] font-bold uppercase text-slate-400">{submission.studentCode || submission.courseName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-900">{submission.assignmentTitle}</p>
                          <p className="text-[10px] font-bold text-slate-400">{submission.courseName}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{formatDateTime(submission.submittedAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-600">
                            Chờ chấm
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <p className="text-xs font-bold text-slate-400">Hiện chưa có bài nộp nào cần chấm.</p>
              </div>
            )}
          </section>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <ELearningRightPanel role="LECTURER" courses={courses} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TeacherDashboard;

