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
    const height = Math.max(endPos - topPos, 40);

    const scale = 1.35; // Consistent scale

    return {
      top: `${topPos * scale}px`,
      height: `${height * scale}px`,
      backgroundColor: event.isConflict ? '#fff1f2' : '#ffffff',
      borderColor: event.isConflict ? '#fb7185' : '#e2e8f0',
      zIndex: event.isConflict ? 20 : 10,
      willChange: 'transform' // Improve performance
    };
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[850px] relative">
      <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ width: '1200px', minWidth: '1200px' }} className="lg:w-full lg:min-w-0 relative flex-shrink-0">
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr] border-b border-slate-100 bg-white sticky top-0 z-50">
            <div className="p-4 border-r border-slate-100 flex items-center justify-center sticky left-0 z-[60] bg-slate-50">
              <Clock size={16} className="text-slate-400" />
            </div>
            <div className="grid grid-cols-7 divide-x divide-slate-100 bg-white">
              {days.map((day, idx) => (
                <div key={idx} className="p-4 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                    {day === 'Chủ Nhật' ? 'CN' : 'T'}{day !== 'Chủ Nhật' && idx + 2}
                  </span>
                  <span className="text-[11px] font-black text-slate-900 truncate block">{day}</span>
                  <span className="text-[9px] font-bold text-blue-500 block mt-0.5">
                    {weekDates[idx].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* We use a simple grid for the layout to ensure alignment */}
            <div className="grid grid-cols-[80px_1fr] min-h-[1100px] relative">
              
              {/* Sidebar - Sticky left */}
              <div className="border-r border-slate-100 flex flex-col h-full sticky left-0 z-20 w-[80px] bg-white shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)]">
                {/* Morning Section */}
                <div className="flex flex-col items-center justify-center gap-3 border-b border-amber-200 bg-amber-50/50" style={{ height: `${265 * 1.35}px` }}>
                   <Sun size={20} className="text-amber-500" />
                   <span className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">SÁNG</span>
                </div>
                {/* Afternoon Section */}
                <div className="flex flex-col items-center justify-center gap-3 bg-blue-50/50" style={{ height: `${265 * 1.35}px`, marginTop: `${(360 - 265) * 1.35}px` }}>
                   <Sunset size={20} className="text-blue-500" />
                   <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">CHIỀU</span>
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
                            whileHover={{ scale: 1.02, zIndex: 40, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            onClick={() => onEventClick(event)}
                            style={getEventStyle(event)}
                            className="absolute inset-x-1.5 p-3 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm cursor-pointer transition-all group/item overflow-hidden select-none"
                          >
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${Number(event.startPeriod) <= 5 ? 'bg-amber-400' : 'bg-blue-400'}`} />
                            
                            <div className="flex flex-col h-full relative z-10 pl-2">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{start} - {end}</span>
                                 <div className="px-1.5 py-0.5 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-tighter">T{event.startPeriod}-{event.endPeriod}</div>
                              </div>
                              
                              <h4 className="text-[11px] font-black text-slate-900 leading-[1.2] line-clamp-2 uppercase mb-2 tracking-tight group-hover/item:text-blue-600 transition-colors">
                                {event.subject || '(Chưa có tên môn)'}
                              </h4>
                              
                              <div className="mt-auto space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                   {event.classId.split(' + ').map((c, i) => (
                                     <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-md border border-blue-100/50 uppercase">
                                       {c}
                                     </span>
                                   ))}
                                </div>
                                
                                <div className="flex items-center gap-4 border-t border-slate-50 pt-1.5 mt-1.5">
                                  <div className="flex items-center gap-1.5 text-slate-400 min-w-0 flex-1">
                                     <User size={10} className="shrink-0" />
                                     <span className="text-[8px] font-bold truncate uppercase tracking-wide">{event.teacher}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-500 shrink-0">
                                     <MapPin size={10} className="text-blue-500 shrink-0" />
                                     <span className="text-[9px] font-black uppercase tracking-widest">{event.room}</span>
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
