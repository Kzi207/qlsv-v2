import React from 'react';
import type { ScheduleEvent } from './types';
import ScheduleEventCard from './ScheduleEventCard';

interface Props {
  currentDate: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  onDateSelect: (date: Date) => void;
}

const MonthView: React.FC<Props> = ({ currentDate, events, onEventClick, onDateSelect }) => {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(currentYear, currentMonth, i));

  const getDayValue = (d: Date) => {
    const day = d.getDay();
    return day === 0 ? 8 : day + 1;
  };

  const getDotColor = (type: string) => {
    switch (type) {
      case 'online': return 'bg-cyan-500';
      case 'exam': return 'bg-amber-500';
      case 'hybrid': return 'bg-purple-500';
      case 'cancelled': return 'bg-slate-400';
      default: return 'bg-blue-500';
    }
  };

  const monthDaysWithEvents = calendarDays
    .filter((d): d is Date => d !== null)
    .map(date => ({
      date,
      dayEvents: events.filter(e => Number(e.day) === getDayValue(date))
    }))
    .filter(item => item.dayEvents.length > 0);

  return (
    <>
      {/* Mobile View: List of days in month with events */}
      <div className="block md:hidden space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Lịch trong tháng {currentMonth + 1}</h3>
        {monthDaysWithEvents.map((item, idx) => (
          <div key={idx} className="space-y-3 bg-white p-4 rounded-[20px] shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
              {item.date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
            </h4>
            <div className="flex flex-col gap-3">
              {item.dayEvents.map(event => (
                <ScheduleEventCard key={event.id} event={event} onClick={onEventClick} variant="compact" />
              ))}
            </div>
          </div>
        ))}
        {monthDaysWithEvents.length === 0 && (
           <div className="text-center py-10 text-slate-500 font-medium bg-white rounded-[20px] border border-slate-100">
             Không có lịch học trong tháng này.
           </div>
        )}
      </div>

      {/* PC/iPad View: Calendar Grid */}
      <div className="hidden md:block bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-16" />;
            
            const dayEvents = events.filter(e => Number(e.day) === getDayValue(date));
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = currentDate.toDateString() === date.toDateString();

            return (
              <div
                key={idx}
                onClick={() => onDateSelect(date)}
                className={`h-16 relative rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 
                  isToday ? 'bg-blue-50 border-blue-100 text-blue-700' : 
                  'bg-white border-slate-100 text-slate-700 hover:border-blue-300'
                }`}
              >
                <span className="text-sm font-bold">{date.getDate()}</span>
                
                {dayEvents.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div key={i} className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : getDotColor(e.type)}`} />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-slate-300'}`} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MonthView;
