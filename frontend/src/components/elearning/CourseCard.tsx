import React from 'react';
import { ArrowRight, BookOpen, Clock, PlayCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  defaultCourseImage,
  getCount,
  getCourseCategory,
  getCourseCode,
  getCourseProgress,
  getStudentCount,
  getTeacherName,
  type ElearningCourse,
} from '../../utils/elearning';
import { Trash2 } from 'lucide-react';

interface CourseCardProps {
  course: ElearningCourse;
  onEnter?: () => void;
  onDelete?: (id: number | string) => void;
  role?: 'STUDENT' | 'LECTURER' | 'QTV';
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnter, onDelete, role = 'STUDENT' }) => {
  const progress = getCourseProgress(course);
  const badgeClass = role === 'STUDENT' ? 'text-blue-600' : 'text-indigo-600';


  return (
    <motion.article
      whileHover={{ y: -4 }}
      onClick={onEnter}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-200/40 active:scale-[0.98]"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={course?.image || defaultCourseImage}
          alt={course?.name || 'Khóa học'}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <span className={`absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClass} shadow-sm`}>
          {getCourseCode(course)}
        </span>
        
        {role !== 'STUDENT' && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(course.id!);
            }}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 active:scale-90"
          >
            <Trash2 size={16} />
          </button>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="line-clamp-1 text-[10px] font-black uppercase tracking-widest text-white/70">
            {getCourseCategory(course)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-white">
            {course?.name || 'Khóa học chưa đặt tên'}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div>
          <p className="text-xs font-bold text-slate-500">{getTeacherName(course)}</p>
          {course?.description && (
            <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
              {course.description}
            </p>
          )}
        </div>

        {role === 'STUDENT' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Tiến độ</span>
              <span className="text-blue-600">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full bg-blue-600"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-500">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <BookOpen size={15} />
            <span className="text-[11px] font-bold">{getCount(course, 'lessons')} bài giảng</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <Clock size={15} />
            <span className="text-[11px] font-bold">{getCount(course, 'assignments')} bài tập</span>
          </div>
          {role !== 'STUDENT' && (
            <div className="col-span-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Users size={15} />
              <span className="text-[11px] font-bold">{getStudentCount(course)} sinh viên theo học</span>
            </div>
          )}
        </div>

        <button
          className={`mt-auto flex w-full items-center justify-center gap-3 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            role === 'STUDENT'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5'
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5'
          } active:scale-95`}
        >
          {role === 'STUDENT' ? 'Vào học' : 'Quản lý lớp'}
          {role === 'STUDENT' ? <PlayCircle size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </motion.article>
  );
};

export default CourseCard;

