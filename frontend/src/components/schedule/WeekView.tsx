import React from 'react';
import { ScheduleEvent } from './types';
import ScheduleEventCard from './ScheduleEventCard';

interface Props {
  currentDate: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
}

const WeekView: React.FC<Props> = ({ currentDate, events, onEventClick }) => {
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(currentDate);
  const today = new Date().toDateString();

  const getEventPosition = (event: ScheduleEvent) => {
    const startHour = Number(event.startPeriod) + 6;
    const endHour = Number(event.endPeriod) + 6;
    const duration = endHour - startHour + 1;
    
    const top = (startHour - 7) * 80;
    const height = duration * 80;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const hasEventsOnDay = (dayIdx: number) => {
    return events.some(e => Number(e.day) === dayIdx + 2);
  };

  return (
    <>
      {/* Mobile View: List Format */}
      <div className="block md:hidden space-y-6">
        {days.map((dayName, idx) => {
          const date = weekDates[idx];
          const isToday = date.toDateString() === today;
          const dayEvents = events.filter(e => Number(e.day) === idx + 2);

          if (dayEvents.length === 0) return null;

          return (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isToday ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <h3 className={`font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                  {dayName}, {date.getDate()}/{date.getMonth() + 1}
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {dayEvents.map(event => (
                  <ScheduleEventCard key={event.id} event={event} onClick={onEventClick} />
                ))}
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
           <div className="text-center py-10 text-slate-500 font-medium">
             Không có lịch học trong tuần này.
           </div>
        )}
      </div>

      {/* PC/iPad View: Timeline Grid */}
      <div className="hidden md:flex bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex-col h-[800px]">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <div className="min-w-[1000px] relative">
            
            {/* Header */}
            <div className="grid grid-cols-[80px_1fr] sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
              <div className="border-r border-slate-100 bg-slate-50" />
              <div className="grid grid-cols-7 divide-x divide-slate-100">
                {days.map((day, idx) => {
                  const date = weekDates[idx];
                  const isToday = date.toDateString() === today;
                  return (
                    <div key={idx} className={`p-3 flex flex-col items-center justify-center gap-1 ${isToday ? 'bg-blue-50/50' : ''}`}>
                      <span className={`text-xs font-bold uppercase ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                        {day}
                      </span>
                      <span className={`text-lg font-bold ${isToday ? 'h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center' : 'text-slate-800'}`}>
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-[80px_1fr] relative">
              {/* Timeline Left */}
              <div className="border-r border-slate-100 bg-slate-50/50">
                {hours.map(hour => (
                  <div key={hour} className="h-[80px] flex justify-center pt-2">
                    <span className="text-xs font-bold text-slate-400">{String(hour).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="relative">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {hours.map(hour => (
                    <div key={hour} className="h-[80px] border-b border-slate-100/50 w-full" />
                  ))}
                </div>

                {/* Vertical Column Lines */}
                <div className="absolute inset-0 grid grid-cols-7 divide-x divide-slate-100/50 pointer-events-none">
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-full" />)}
                </div>

                {/* Events */}
                <div className="grid grid-cols-7 h-full relative z-10">
                  {Array.from({ length: 7 }).map((_, dayIdx) => (
                    <div key={dayIdx} className="relative h-full">
                      {events.filter(e => Number(e.day) === dayIdx + 2).map(event => (
                        <div 
                          key={event.id}
                          className="absolute inset-x-1"
                          style={getEventPosition(event)}
                        >
                          <ScheduleEventCard 
                            event={event} 
                            variant="compact" 
                            onClick={() => onEventClick(event)} 
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WeekView;
