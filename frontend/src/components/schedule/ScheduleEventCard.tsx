import React from 'react';
import { MapPin, User, Clock, Monitor, BookOpen } from 'lucide-react';
import type { ScheduleEvent } from './types';

interface Props {
  event: ScheduleEvent;
  onClick: (event: ScheduleEvent) => void;
  variant?: 'full' | 'compact';
}

const ScheduleEventCard: React.FC<Props> = ({ event, onClick, variant = 'full' }) => {
  const getConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'online': return { border: 'border-l-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700', label: 'Online' };
      case 'exam': return { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', label: 'Thi' };
      case 'cancelled': return { border: 'border-l-slate-400', bg: 'bg-slate-50', text: 'text-slate-500', badge: 'bg-slate-200 text-slate-600', label: 'Tạm ngưng' };
      case 'hybrid': return { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', label: 'Hybrid' };
      default: return { border: 'border-l-blue-500', bg: 'bg-white', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', label: 'Offline' };
    }
  };

  const config = getConfig(event.type);
  const isOnline = event.type?.toLowerCase() === 'online' || event.type?.toLowerCase() === 'hybrid';

  const formatPeriod = () => {
    const s = Number(event.startPeriod) + 6;
    const e = Number(event.endPeriod) + 7; // simplified 1 period = 1 hour for display
    return `${String(s).padStart(2, '0')}:00 - ${String(e).padStart(2, '0')}:00`;
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onClick(event)}
        className={`w-full p-2.5 rounded-2xl border-l-4 ${config.border} ${config.bg} shadow-sm hover:shadow-md cursor-pointer transition-all h-full flex flex-col gap-1.5`}
      >
        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{event.subject}</h4>
        <div className="flex flex-col gap-1 mt-auto">
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
            <Clock size={10} /> {formatPeriod()}
          </span>
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 line-clamp-1">
            <MapPin size={10} /> {event.room}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(event)}
      className={`w-full p-4 md:p-5 rounded-[20px] border-l-[6px] ${config.border} bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.badge}`}>
            {config.label}
          </span>
          {isOnline && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Monitor size={10} /> Meet
            </span>
          )}
        </div>
        <div className="text-slate-400 p-1 bg-slate-50 rounded-lg hidden sm:block">
          <BookOpen size={18} />
        </div>
      </div>

      <h3 className="text-base md:text-lg font-bold text-slate-800 leading-snug">{event.subject}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Clock size={16} className="text-blue-500" />
          <span className="font-medium">{formatPeriod()} (T{event.startPeriod}-{event.endPeriod})</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <MapPin size={16} className={isOnline ? 'text-cyan-500' : 'text-rose-500'} />
          <span className="font-medium line-clamp-1">{event.room}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 text-sm sm:col-span-2">
          <User size={16} className="text-emerald-500" />
          <span className="font-medium line-clamp-1">{event.teacher}</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEventCard;
