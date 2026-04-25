import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock3 } from 'lucide-react';
import EventCard from './EventCard';
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
  events: TimetableEvent[];
  selectedDate: Date;
  onEventClick: (event: TimetableEvent) => void;
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
}

const DayView: React.FC<Props> = ({ events, selectedDate, onEventClick, onViewChange }) => {
  const getDayValue = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 8 : day + 1;
  };

  const dayEvents = events
    .filter((event) => Number(event.day) === getDayValue(selectedDate))
    .sort((a, b) => Number(a.startPeriod) - Number(b.startPeriod));

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6 px-6">
        <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
          <CalendarIcon size={38} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-900">Hôm nay bạn không có lịch học</h3>
          <p className="text-slate-500 font-bold">Chọn ngày khác hoặc xem lịch tuần để chuẩn bị trước.</p>
        </div>
        <button
          onClick={() => onViewChange?.('week')}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
        >
          Xem lịch tuần
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-blue-600">Lịch trong ngày</p>
          <h3 className="text-xl font-black text-slate-900 capitalize">
            {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </h3>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-slate-50 text-xs font-black text-slate-600 border border-slate-100">
          {dayEvents.length} môn học
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {dayEvents.map((event, index) => {
          const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="grid grid-cols-[74px_1fr] md:grid-cols-[96px_1fr] gap-3 md:gap-5"
            >
              <div className="pt-3 text-right">
                <div className="inline-flex flex-col items-end gap-1">
                  <span className="text-sm font-black text-slate-900">{start}</span>
                  <span className="text-[10px] font-bold text-slate-400">{end}</span>
                  <span className="mt-1 h-8 w-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock3 size={15} />
                  </span>
                </div>
              </div>
              <EventCard event={event} onClick={() => onEventClick(event)} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
