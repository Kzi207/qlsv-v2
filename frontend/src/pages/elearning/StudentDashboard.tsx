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
    { label: 'Môn đang học', value: courses.length, icon: BookOpen, color: 'bg-blue-600' },
    { label: 'Bài tập cần nộp', value: summary.pendingAssignments, icon: ClipboardList, color: 'bg-rose-500' },
    { label: 'Bài giảng khả dụng', value: summary.totalLessons, icon: Video, color: 'bg-emerald-500' },
    { label: 'Bài thi sắp tới', value: summary.upcomingExams, icon: GraduationCap, color: 'bg-amber-500' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] pb-20 animate-fade-up">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
        <main className="space-y-8">
          <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                <Award size={12} /> Không gian học tập
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">E-Learning</h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                Chào <span className="font-black text-blue-600">{user?.name || 'sinh viên'}</span>, bạn đang có
                {' '}<span className="font-black text-slate-900">{summary.pendingAssignments}</span> bài tập cần xử lý và tiến độ trung bình
                {' '}<span className="font-black text-slate-900">{summary.avgProgress}%</span>.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <div className="relative min-w-0 flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="text"
                  placeholder="Tìm môn học, giảng viên..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-900">
                Môn học của tôi
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">
                  {filteredCourses.length}/{courses.length}
                </span>
              </h2>
              <div className="flex rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'active', label: 'Đang học' },
                  { key: 'todo', label: 'Cần nộp' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key as FilterKey)}
                    className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                      filter === item.key ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

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
                    onEnter={() => navigate(`/elearning/course/${course.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  {query || filter !== 'all' ? <Filter size={26} /> : <BookOpen size={26} />}
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">
                  {query || filter !== 'all' ? 'Không tìm thấy môn học phù hợp' : 'Bạn chưa có môn học trực tuyến'}
                </p>
              </div>
            )}
          </section>
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
