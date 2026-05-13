import React from 'react';
import { Clock, MapPin, User, Sun, Sunset } from 'lucide-react';
import { motion } from 'framer-motion';
import { PERIODS, getPeriodTimes } from '../../utils/timetable';

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
  isConflict?: boolean;
}

interface Props {
  events: TimetableEvent[];
  onEventClick: (event: TimetableEvent) => void;
  currentDate?: Date;
}

const TimetableCalendar: React.FC<Props> = ({ events, onEventClick, currentDate = new Date() }) => {
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Calculate dates for the current week (starting Monday)
  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(current.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(currentDate);

  const getEventStyle = (event: TimetableEvent) => {
    const sP = Number(event.startPeriod);
    const eP = Number(event.endPeriod);
    
    const startP = PERIODS.find(p => p.id === sP);
    const endP = PERIODS.find(p => p.id === eP);

    if (!startP || !endP) return { display: 'none' };

    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h - 7) * 60 + m;
    };

     const topPos = parseTime(startP.start);
    const endPos = parseTime(endP.end);
    const height = Math.max(endPos - topPos, 30);
    const scale = 1.15; // Balanced scale for high density

    return {
      top: `${topPos * scale}px`,
      height: `${height * scale}px`,
      backgroundColor: event.isConflict ? '#fff1f2' : '#ffffff',
      borderColor: event.isConflict ? '#fb7185' : '#e2e8f0',
      zIndex: event.isConflict ? 20 : 10,
      willChange: 'transform'
    };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[750px] relative mx-2 mb-4">
      <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: '1100px', minWidth: '1100px' }} className="lg:w-full lg:min-w-0 relative flex-shrink-0">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr] border-b border-slate-100 bg-white sticky top-0 z-50">
            <div className="p-3 border-r border-slate-100 flex items-center justify-center sticky left-0 z-[60] bg-slate-50">
              <Clock size={14} className="text-slate-400" />
            </div>
            <div className="grid grid-cols-7 divide-x divide-slate-100 bg-white">
              {days.map((day, idx) => (
                <div key={idx} className="p-3 text-center group hover:bg-slate-50 transition-colors">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                    {day === 'Chủ Nhật' ? 'CN' : 'T'}{day !== 'Chủ Nhật' && idx + 2}
                  </span>
                  <span className="text-[11px] font-black text-slate-900 truncate block tracking-tight">{day}</span>
                  <span className="text-[9px] font-bold text-blue-500 block mt-0.5">
                    {weekDates[idx].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-[60px_1fr] min-h-[900px] relative">
              
              {/* Sidebar - Compact */}
              <div className="border-r border-slate-100 dark:border-slate-800 flex flex-col h-full sticky left-0 z-20 w-[60px] bg-white dark:bg-slate-900">
                {/* Morning Section */}
                <div className="flex flex-col items-center justify-center gap-2 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20" style={{ height: `${265 * 1.15}px` }}>
                   <div className="h-6 w-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                      <Sun size={12} className="text-amber-500" />
                   </div>
                   <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">SÁNG</span>
                </div>
                {/* Afternoon Section */}
                <div className="flex flex-col items-center justify-center gap-2 bg-slate-50/30 dark:bg-slate-800/20" style={{ height: `${265 * 1.15}px`, marginTop: `${(360 - 265) * 1.15}px` }}>
                   <div className="h-6 w-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                      <Sunset size={12} className="text-blue-500" />
                   </div>
                   <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">CHIỀU</span>
                </div>
              </div>

              {/* Grid Area */}
              <div className="relative bg-white min-h-[1100px]">
                {/* Main Grid for columns */}
                <div className="absolute inset-0 grid grid-cols-7 divide-x divide-slate-100/60">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-full group/col hover:bg-slate-50/30 transition-colors" />
                  ))}
                </div>

                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 15 }).map((_, i) => (
                     <div key={i} className="w-full border-b border-slate-100/40" style={{ top: `${i * 80}px`, height: '1px' }} />
                  ))}
                </div>

                {/* Events Container - 7 Column Grid */}
                <div className="relative grid grid-cols-7 h-full z-10">
                  {Array.from({ length: 7 }).map((_, dayIdx) => (
                    <div key={dayIdx} className="relative h-full">
                      {events.filter(e => Number(e.day) === dayIdx + 2).map(event => {
                        const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
                        return (
                          <motion.div
                            key={event.id}
                            whileHover={{ scale: 1.01, zIndex: 40 }}
                            onClick={() => onEventClick(event)}
                            style={getEventStyle(event)}
                            className="absolute inset-x-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all group/item overflow-hidden"
                          >
                            {/* Accent Stripe */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 dark:bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                            
                            <div className="flex flex-col h-full relative z-10 pl-2">
                              <div className="flex items-center justify-between mb-0.5">
                                 <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                   {start} - {end}
                                 </span>
                                 <div className="px-1 py-0.5 bg-slate-50 dark:bg-slate-800 rounded text-[6px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                   T{event.startPeriod}-{event.endPeriod}
                                 </div>
                              </div>
                              
                              <h4 className="text-[9px] font-black text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 uppercase tracking-tighter mb-1">
                                {event.subject || '(Chưa có tên môn)'}
                              </h4>
                              
                              <div className="mt-auto space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                   <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 min-w-0 flex-1">
                                      <User size={8} className="shrink-0" />
                                      <span className="text-[7px] font-bold truncate uppercase">{event.teacher}</span>
                                   </div>
                                   <div className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400 shrink-0">
                                      <MapPin size={8} className="text-blue-500 shrink-0" />
                                      <span className="text-[8px] font-black uppercase">{event.room}</span>
                                   </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableCalendar;
