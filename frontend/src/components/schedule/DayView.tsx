import React from 'react';
import type { ScheduleEvent } from './types';
import ScheduleEventCard from './ScheduleEventCard';
import { Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  currentDate: Date;
  events: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
}

const DayView: React.FC<Props> = ({ events, onEventClick }) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[24px] border border-slate-100 shadow-sm text-center px-4">
        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-6">
          <CalendarIcon size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Không có lịch học trong ngày này</h3>
        <p className="text-slate-500">Bạn có thể nghỉ ngơi hoặc tự ôn tập nhé!</p>
      </div>
    );
  }

  // Generate hours from 07:00 to 21:00
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex">
      {/* Timeline Sidebar */}
      <div className="w-20 sm:w-24 border-r border-slate-100 bg-slate-50/50 py-6">
        {hours.map(hour => (
          <div key={hour} className="h-28 flex justify-center pt-2">
            <span className="text-xs font-bold text-slate-400">{String(hour).padStart(2, '0')}:00</span>
          </div>
        ))}
      </div>

      {/* Events Container */}
      <div className="flex-1 py-6 px-4 sm:px-6 relative">
        <div className="absolute inset-0 pointer-events-none z-0">
          {hours.map(hour => (
            <div key={hour} className="h-28 border-b border-slate-100 w-full" />
          ))}
        </div>

        <div className="relative z-10 space-y-4">
          {events.map((event, idx) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <ScheduleEventCard event={event} onClick={onEventClick} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayView;
