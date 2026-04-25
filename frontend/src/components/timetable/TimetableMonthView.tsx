import React from 'react';
import { motion } from 'framer-motion';

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
  events: TimetableEvent[];
  selectedDate: Date;
  onEventClick: (event: TimetableEvent) => void;
}

const TimetableMonthView: React.FC<Props> = ({ events, selectedDate, onEventClick }) => {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Monday start
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentYear, currentMonth, i));
  }

  const getDayValue = (d: Date) => {
    const day = d.getDay();
    return day === 0 ? 8 : day + 1;
  };

  const getStatusColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'online': return 'bg-[#00b09b]';
      case 'exam': return 'bg-[#f1c40f]';
      case 'official_exam': return 'bg-[#2ecc71]';
      default: return 'bg-[#00b09b]';
    }
  };

  // Group events by actual days that have them in the month
  const monthDaysWithEvents = calendarDays
    .filter((d): d is Date => d !== null)
    .map(date => ({
      date,
      dayEvents: events.filter(e => Number(e.day) === getDayValue(date))
    }))
    .filter(item => item.dayEvents.length > 0);

  return (
    <div className="space-y-6">
      {/* Calendar Grid Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-3 md:p-6">
        <div className="max-w-[800px] mx-auto">
          <div className="grid grid-cols-7 gap-1 mb-4">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
          </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
            
            const dayEvents = events.filter(e => Number(e.day) === getDayValue(date));
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();

            return (
              <motion.div
                key={date.toISOString()}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square relative rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center p-1 ${
                  isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 
                  isToday ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                  'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-blue-200'
                }`}
              >
                <span className={`text-sm font-black ${isSelected ? 'text-white' : ''}`}>{date.getDate()}</span>
                
                {dayEvents.length > 0 && !isSelected && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <div key={i} className={`h-1.5 w-1.5 rounded-full ${isToday ? 'bg-blue-600' : 'bg-blue-400'}`} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Full Monthly Schedule List (Improved based on user feedback) */}
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Toàn bộ lịch học tháng {currentMonth + 1}</h3>
          <span className="text-[10px] font-bold text-slate-400">({monthDaysWithEvents.length} ngày học)</span>
        </div>

        <div className="space-y-8">
          {monthDaysWithEvents.length > 0 ? (
            monthDaysWithEvents.map((item, dIdx) => (
              <div key={item.date.toISOString()} className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${selectedDate.toDateString() === item.date.toDateString() ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${selectedDate.toDateString() === item.date.toDateString() ? 'text-blue-600' : 'text-slate-500'}`}>
                    {item.date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-3">
                  {item.dayEvents.map((event, eIdx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: eIdx * 0.05 }}
                      onClick={() => onEventClick(event)}
                      className="bg-white rounded-xl border border-[#d1d8e0] shadow-sm overflow-hidden flex min-h-[130px] cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <div className={`w-3 shrink-0 ${getStatusColor(event.type)}`} />
                      <div className="p-4 flex-1 flex flex-col justify-center space-y-2">
                        <h4 className="text-[16px] font-bold text-[#2d3436] line-clamp-1">
                          {event.subject}
                        </h4>
                        <div className="space-y-1.5">
                          <div className="flex gap-4 text-[13px]">
                            <span className="text-[#636e72] w-20 shrink-0 font-medium">Tiết :</span>
                            <span className="text-[#2d3436] font-bold">{event.startPeriod} - {event.endPeriod}</span>
                          </div>
                          <div className="flex gap-4 text-[13px]">
                            <span className="text-[#636e72] w-20 shrink-0 font-medium">Phòng :</span>
                            <span className="text-[#2d3436] font-bold">{event.room}</span>
                          </div>
                          <div className="flex gap-4 text-[13px]">
                            <span className="text-[#636e72] w-20 shrink-0 font-medium">GV :</span>
                            <span className="text-[#2d3436] font-bold truncate">{event.teacher}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 mx-2">
              Không có lịch học trong tháng này
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableMonthView;
