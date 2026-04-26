import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  ClipboardList,
  Filter,
  GraduationCap,
  Search,
  Video,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import CourseCard from '../../components/elearning/CourseCard';
import ELearningRightPanel from '../../components/elearning/ELearningRightPanel';
import { useAuthStore } from '../../store/useAuthStore';
import {
  asArray,
  getCount,
  getCourseCategory,
  getCourseProgress,
  isUpcoming,
  type ElearningCourse,
} from '../../utils/elearning';

type FilterKey = 'all' | 'active' | 'todo';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<ElearningCourse[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCourses() {
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

  useEffect(() => {
    void Promise.resolve().then(fetchCourses);
  }, []);

  const summary = useMemo(() => {
    const totalLessons = courses.reduce((sum, course) => sum + getCount(course, 'lessons'), 0);
    const assignments = courses.flatMap((course) => asArray(course.assignments));
    const exams = courses.flatMap((course) => asArray(course.exams));
    const pendingAssignments = assignments.filter((item) => !item.submissions?.length).length;
    const upcomingExams = exams.filter((item) => isUpcoming(item.startTime)).length;
    const avgProgress = courses.length
      ? Math.round(courses.reduce((sum, course) => sum + getCourseProgress(course), 0) / courses.length)
      : 0;

    return { totalLessons, pendingAssignments, upcomingExams, avgProgress };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      const searchable = [
        course?.name,
        course?.subject?.code,
        getCourseCategory(course),
        typeof course?.teacher === 'string' ? course.teacher : course?.teacher?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && getCourseProgress(course) < 100) ||
        (filter === 'todo' && asArray(course.assignments).some((item) => !item.submissions?.length));

      return matchesQuery && matchesFilter;
    });
  }, [courses, filter, query]);

  const stats = [
    { label: 'Môn học', value: courses.length, icon: BookOpen, color: 'bg-blue-600', sub: 'Đang theo học' },
    { label: 'Bài tập', value: summary.pendingAssignments, icon: ClipboardList, color: 'bg-rose-500', sub: 'Chưa nộp' },
    { label: 'Bài giảng', value: summary.totalLessons, icon: Video, color: 'bg-emerald-500', sub: 'Đã phát hành' },
    { label: 'Lịch thi', value: summary.upcomingExams, icon: GraduationCap, color: 'bg-amber-500', sub: 'Sắp diễn ra' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] pb-24 animate-fade-up">
      <div className="grid grid-cols-1 gap-8 lg:gap-10 xl:grid-cols-[1fr_360px]">
        <main className="space-y-8 md:space-y-12">
          {/* Header Section */}
          <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
            <div className="space-y-3 md:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
                <Award size={12} className="animate-pulse" /> MyCTUTs E-Learning System
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 md:text-6xl lg:text-7xl leading-none">Học trực tuyến</h1>
              <p className="max-w-2xl text-xs md:text-lg font-bold leading-relaxed text-slate-500">
                Chào mừng <span className="text-blue-600 font-black">{user?.name || 'sinh viên'}</span>! 
                Tiến độ trung bình của bạn: <span className="text-slate-900 font-black px-2 py-0.5 bg-slate-100 rounded-lg">{summary.avgProgress}%</span>
              </p>
            </div>

            <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
              <div className="relative min-w-0 flex-1 md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                   value={query}
                   onChange={(event) => setQuery(event.target.value)}
                   type="text"
                   placeholder="Tìm tên môn học..."
                   className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-xs md:text-sm font-black outline-none transition-all shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5"
                />
              </div>
            </div>
          </section>

          {/* Stats Bento Grid */}
          <section className="grid grid-cols-2 gap-3 md:gap-6 px-2">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -5 }}
                className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 bg-white p-4 md:p-8 shadow-xl shadow-slate-200/20 group"
              >
                <div className={`mb-4 md:mb-6 flex h-10 w-10 md:h-16 md:w-16 items-center justify-center rounded-xl md:rounded-2xl text-white shadow-lg ${stat.color} transition-transform group-hover:scale-110`}>
                  <stat.icon size={20} className="md:size-8" />
                </div>
                <div className="space-y-1">
                   <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                   <p className="text-xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{stat.value}</p>
                   <p className="text-[8px] md:text-[10px] font-bold text-slate-400 opacity-60 italic">{stat.sub}</p>
                </div>
                <div className={`absolute -right-4 -bottom-4 h-20 w-20 rounded-full opacity-[0.03] ${stat.color}`} />
              </motion.div>
            ))}
          </section>

          {/* Course List Section */}
          <section className="space-y-6">
            <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                 <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">Học phần của tôi</h2>
                 <span className="rounded-xl bg-slate-900 px-3 py-1 text-[10px] font-black text-white">
                   {filteredCourses.length}
                 </span>
              </div>
              
              <div className="flex rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'active', label: 'Đang học' },
                  { key: 'todo', label: 'Cần nộp' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key as FilterKey)}
                    className={`rounded-xl px-5 md:px-7 py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      filter === item.key 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 px-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-64 md:h-80 animate-pulse rounded-[2rem] bg-slate-100" />
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 px-2">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEnter={() => navigate(`/elearning/course/${course.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-2 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white p-16 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-200">
                  {query || filter !== 'all' ? <Filter size={32} /> : <BookOpen size={32} />}
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">
                  {query || filter !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có môn học trực tuyến'}
                </h3>
                <p className="text-xs font-bold text-slate-400">Vui lòng kiểm tra lại bộ lọc hoặc liên hệ phòng đào tạo.</p>
              </div>
            )}
          </section>

          {/* Mobile Right Panel Section */}
          <div className="xl:hidden px-2 mt-8">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                   <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                      <Clock className="text-blue-400" size={24} />
                   </div>
                   <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Việc cần làm</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Thời hạn sắp tới</p>
                   </div>
                </div>
                <div className="space-y-1">
                   <p className="text-xs font-bold text-slate-300">
                      Bạn có <span className="text-white font-black">{summary.pendingAssignments} bài tập</span> chưa nộp và <span className="text-white font-black">{summary.upcomingExams} kỳ thi</span> sắp tới.
                   </p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 -mr-10 -mt-10 rotate-12">
                   <Video size={140} />
                </div>
             </div>
          </div>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <ELearningRightPanel role="STUDENT" courses={courses} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudentDashboard;
