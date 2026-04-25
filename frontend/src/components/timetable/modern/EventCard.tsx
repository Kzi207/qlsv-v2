import React from 'react';
import { BookOpen, Clock, MapPin, Monitor, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPeriodTimes } from '../../../utils/timetable';

interface TimetableEvent {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  classId: string;
  day: number | string;
  startPeriod: number | string;
  endPeriod: number | string;
  type: string;
}

interface Props {
  event: TimetableEvent;
  onClick?: () => void;
  variant?: 'compact' | 'full';
}

const getStatusConfig = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'online':
      return { border: 'border-l-cyan-500', bg: 'bg-cyan-50/40', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700', label: 'Online' };
    case 'exam':
      return { border: 'border-l-amber-500', bg: 'bg-amber-50/50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', label: 'Thi học kỳ' };
    case 'official_exam':
      return { border: 'border-l-rose-500', bg: 'bg-rose-50/50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700', label: 'Thi chính thức' };
    case 'cancelled':
      return { border: 'border-l-slate-400', bg: 'bg-slate-50', text: 'text-slate-500', badge: 'bg-slate-100 text-slate-500', label: 'Tạm ngưng' };
    default:
      return { border: 'border-l-blue-500', bg: 'bg-blue-50/40', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', label: 'Lịch học' };
  }
};

const EventCard: React.FC<Props> = ({ event, onClick, variant = 'full' }) => {
  const config = getStatusConfig(event.type);
  const isOnline = event.type?.toLowerCase() === 'online';
  const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
  const roomLabel = event.room || (isOnline ? 'Online' : 'Chưa cập nhật');
  const teacherLabel = event.teacher || 'Chưa cập nhật';
  const classLabel = event.classId || 'Lớp học';

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        onClick={onClick}
        className={`p-3 rounded-2xl border-l-4 ${config.border} ${config.bg} border border-slate-100 shadow-sm cursor-pointer transition-all h-full min-h-[118px] flex flex-col justify-between hover:shadow-md`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${config.badge}`}>
              Tiết {event.startPeriod}-{event.endPeriod}
            </span>
            {isOnline && <Monitor size={13} className="text-cyan-600 shrink-0" />}
          </div>
          <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-3">
            {event.subject}
          </h4>
        </div>
        <div className="space-y-1.5 pt-2">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 min-w-0">
            <Clock size={11} className="shrink-0" /> {start} - {end}
          </span>
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 min-w-0">
            <MapPin size={11} className="shrink-0" /> <span className="truncate">{roomLabel}</span>
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
      onClick={onClick}
      className={`p-4 md:p-5 rounded-2xl border-l-8 ${config.border} ${config.bg} border border-slate-100 shadow-sm cursor-pointer transition-all space-y-4`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${config.badge}`}>
              {config.label}
            </span>
            {isOnline && (
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center gap-1">
                <Monitor size={10} /> Google Meet
              </span>
            )}
          </div>
          <h4 className="text-lg font-black text-slate-900 leading-snug">
            {event.subject}
          </h4>
        </div>
        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-50 text-slate-500">
          <BookOpen size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100/60">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={14} className="text-blue-500" />
          <span className="text-xs font-bold">Tiết {event.startPeriod}-{event.endPeriod}, {start} - {end}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <MapPin size={14} className="text-rose-500" />
          <span className="text-xs font-bold">Phòng {roomLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <User size={14} className="text-emerald-500" />
          <span className="text-xs font-bold line-clamp-1">GV: {teacherLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Users size={14} className={config.text} />
          <span className="text-xs font-bold line-clamp-1">{classLabel}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
