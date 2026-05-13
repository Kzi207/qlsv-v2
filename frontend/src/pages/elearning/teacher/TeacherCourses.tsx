import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, Plus, Search, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../../api/axios';
import ELearningRightPanel from '../../../components/elearning/ELearningRightPanel';
import CourseCard from '../../../components/elearning/CourseCard';
import { asArray, getCourseCategory, type ElearningCourse } from '../../../utils/elearning';

interface SubjectOption {
  id: number | string;
  code: string;
  name: string;
}

const TeacherCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ElearningCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [query, setQuery] = useState('');
  const [newCourse, setNewCourse] = useState({
    subjectId: '',
    name: '',
    description: '',
    image: '',
    semesterId: '2023-2024.2',
  });

  async function fetchTeacherCourses() {
    try {
      const res = await api.get('/elearning/courses');
      setCourses(asArray<ElearningCourse>(res.data));
    } catch (error) {
      console.error('Failed to fetch courses', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubjects() {
    try {
      const res = await api.get('/elearning/subjects');
      setSubjects(asArray<SubjectOption>(res.data));
    } catch (error) {
      console.error('Failed to fetch subjects', error);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchTeacherCourses();
      fetchSubjects();
    });
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

  const handleCreateCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCourse.subjectId || !newCourse.name.trim()) {
      toast.error('Vui lòng nhập đầy đủ môn học và tên lớp');
      return;
    }

    try {
      const res = await api.post('/elearning/courses', {
        ...newCourse,
        name: newCourse.name.trim(),
        description: newCourse.description.trim(),
        image: newCourse.image.trim(),
      });
      setCourses([res.data, ...courses]);
      setIsModalOpen(false);
      setNewCourse({
        subjectId: '',
        name: '',
        description: '',
        image: '',
        semesterId: '2023-2024.2',
      });
      toast.success('Đã tạo lớp học trực tuyến');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
          ? (error as { response: { data: { error: string } } }).response.data.error
          : 'Không thể tạo lớp học';
      toast.error(message);
    }
  };

  const handleDeleteCourse = async (id: number | string) => {
    try {
      await api.delete(`/elearning/courses/${id}`);
      setCourses(courses.filter((c) => c.id !== id));
      toast.success('Đã xóa khóa học');
    } catch (error) {
      console.error('Failed to delete course', error);
      toast.error('Không thể xóa khóa học');
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] pb-20 animate-fade-up">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
        <main className="space-y-8">
          <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                <BookOpen size={12} /> Lớp học trực tuyến
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Khóa học của tôi</h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                Quản lý lớp, bài giảng, bài tập và bài thi theo từng học phần bạn phụ trách.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 active:scale-95"
            >
              <Plus size={18} /> Thêm lớp học
            </button>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Tìm theo tên lớp, mã môn, học phần..."
                className="w-full rounded-xl border border-transparent bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </section>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
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
                  onDelete={handleDeleteCourse}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                {query ? <Eye size={30} /> : <BookOpen size={30} />}
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-500">
                {query ? 'Không tìm thấy lớp học phù hợp' : 'Bạn chưa tạo lớp học trực tuyến'}
              </p>
              {!query && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-indigo-700"
                >
                  Tạo lớp đầu tiên
                </button>
              )}
            </div>
          )}
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <ELearningRightPanel role="LECTURER" courses={courses} />
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 16 }}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-600 p-6 text-white">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Tạo lớp học mới</h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-100">
                    Thiết lập học phần trực tuyến cho sinh viên
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-2 transition hover:bg-white/10"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-6 p-6">
                <label className="block space-y-2">
                  <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Môn học gốc</span>
                  <select
                    value={newCourse.subjectId}
                    onChange={(event) => setNewCourse({ ...newCourse, subjectId: event.target.value })}
                    className="w-full rounded-xl border border-transparent bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="">Chọn môn học...</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Tên lớp hiển thị</span>
                  <input
                    type="text"
                    placeholder="VD: Lập trình Java - Sáng thứ 3"
                    value={newCourse.name}
                    onChange={(event) => setNewCourse({ ...newCourse, name: event.target.value })}
                    className="w-full rounded-xl border border-transparent bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Mô tả ngắn</span>
                  <textarea
                    rows={3}
                    placeholder="Mục tiêu, yêu cầu hoặc ghi chú cho lớp học..."
                    value={newCourse.description}
                    onChange={(event) => setNewCourse({ ...newCourse, description: event.target.value })}
                    className="w-full resize-none rounded-xl border border-transparent bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ảnh đại diện URL</span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newCourse.image}
                      onChange={(event) => setNewCourse({ ...newCourse, image: event.target.value })}
                      className="w-full rounded-xl border border-transparent bg-slate-50 px-4 py-3 pr-11 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                  </div>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 active:scale-95"
                >
                  Xác nhận tạo lớp học
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherCourses;
