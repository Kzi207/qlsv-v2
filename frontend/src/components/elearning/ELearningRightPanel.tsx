import React, { useMemo } from 'react';
import { AlertCircle, Bell, Calendar, CheckCircle2, ChevronRight, Clock, FileText } from 'lucide-react';
import { ELEARNING_MOCK } from '../../constants/elearningMock';
import { asArray, formatDateTime, isUpcoming, type ElearningCourse } from '../../utils/elearning';

interface RightPanelProps {
  role?: 'STUDENT' | 'LECTURER' | 'QTV';
  courses?: ElearningCourse[];
}

const ELearningRightPanel: React.FC<RightPanelProps> = ({ role = 'STUDENT', courses = [] }) => {
  const toTime = (value: string | Date | null | undefined) => {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const tasks = useMemo(() => {
    const assignments = courses.flatMap((course) =>
        asArray(course.assignments).map((assignment) => ({
        id: `assignment-${assignment.id}`,
        title: assignment.title,
        course: course.name,
        dueAt: assignment.dueDate,
        type: 'assignment',
        done: role === 'STUDENT' ? Boolean(assignment.submissions?.length) : false,
      })),
    );

    const exams = courses.flatMap((course) =>
        asArray(course.exams).map((exam) => ({
        id: `exam-${exam.id}`,
        title: exam.title,
        course: course.name,
        dueAt: exam.startTime,
        type: 'exam',
        done: false,
      })),
    );

    return [...assignments, ...exams]
      .filter((item) => !item.done && isUpcoming(item.dueAt))
      .sort((a, b) => toTime(a.dueAt) - toTime(b.dueAt))
      .slice(0, 5);
  }, [courses, role]);

  const recentLessons = useMemo(() => {
    return courses
      .flatMap((course) =>
        asArray(course.lessons).map((lesson) => ({
          id: `${course.id}-${lesson.id}`,
          title: lesson.title,
          course: course.name,
          createdAt: lesson.createdAt,
          visible: lesson.isVisible !== false,
        })),
      )
      .filter((lesson) => lesson.visible)
      .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
      .slice(0, 4);
  }, [courses]);

  const fallbackTasks = ELEARNING_MOCK.deadlines.slice(0, 3).map((item) => ({
    id: `mock-${item.id}`,
    title: item.title,
    course: item.course,
    dueAt: item.due,
    type: item.type,
  }));

  const visibleTasks = tasks.length ? tasks : fallbackTasks;

  return (
    <aside className="w-full space-y-6 animate-fade-in">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
            {role === 'STUDENT' ? 'Việc cần làm' : 'Cần theo dõi'}
          </h3>
          <Clock size={18} className="text-blue-600" />
        </div>

        <div className="space-y-3">
          {visibleTasks.map((item) => (
            <div key={item.id} className="rounded-xl border border-transparent p-3 transition hover:border-slate-100 hover:bg-slate-50">
              <div className="flex gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  item.type === 'exam' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.type === 'exam' ? <AlertCircle size={19} /> : <FileText size={19} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-slate-900">{item.title}</p>
                  <p className="truncate text-[10px] font-bold text-slate-400">{item.course}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[9px] font-black uppercase text-blue-600">
                    <Calendar size={10} />
                    <span>{formatDateTime(item.dueAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/20">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <Bell size={18} className="text-blue-400" /> Thông báo
          </h3>
          <ChevronRight size={16} className="text-slate-500" />
        </div>
        <div className="space-y-4">
          {ELEARNING_MOCK.announcements.slice(0, 2).map((item) => (
            <div key={item.id}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="truncate text-[10px] font-black uppercase text-blue-400">{item.sender}</p>
                <span className="shrink-0 text-[9px] font-bold text-slate-500">{item.time}</span>
              </div>
              <p className="text-xs font-bold leading-relaxed text-slate-100">{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-black uppercase tracking-widest text-slate-900">
          {role === 'STUDENT' ? 'Bài giảng mới' : 'Nội dung gần đây'}
        </h3>
        <div className="space-y-4">
          {recentLessons.length ? (
            recentLessons.map((lesson) => (
              <div key={lesson.id} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-900">{lesson.title}</p>
                  <p className="truncate text-[10px] font-bold text-slate-400">{lesson.course}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs font-bold leading-relaxed text-slate-400">
              Chưa có bài giảng mới trong các lớp học hiện tại.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
};

export default ELearningRightPanel;
