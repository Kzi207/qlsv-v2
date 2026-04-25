import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sunset } from 'lucide-react';
import EventCard from './EventCard';

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

type SlotId = 'morning' | 'afternoon' | 'evening';

const WeekView: React.FC<Props> = ({ events, selectedDate, onEventClick }) => {
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const today = new Date().toDateString();

  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    return Array.from({ length: 7 }).map((_, index) => {
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + index);
      return nextDate;
    });
  };

  const getEventsForDay = (dayIndex: number) => {
    return events
      .filter((event) => Number(event.day) === dayIndex + 2)
      .sort((a, b) => Number(a.startPeriod) - Number(b.startPeriod));
  };

  const getEventsForSlot = (dayIndex: number, slot: SlotId) => {
    return getEventsForDay(dayIndex).filter((event) => {
      const startPeriod = Number(event.startPeriod);
      if (slot === 'morning') return startPeriod <= 5;
      if (slot === 'afternoon') return startPeriod > 5 && startPeriod <= 10;
      return startPeriod > 10;
    });
  };

  const weekDates = getWeekDates(selectedDate);
  const weekEventsCount = weekDates.reduce((total, _date, index) => total + getEventsForDay(index).length, 0);
  const timeSlots: Array<{ id: SlotId; label: string; icon: React.ReactNode; bg: string; desc: string }> = [
    { id: 'morning', label: 'Sáng', icon: <Sun size={22} className="text-amber-500" />, bg: 'bg-amber-50/60', desc: 'Tiết 1 - 5' },
    { id: 'afternoon', label: 'Chiều', icon: <Sunset size={22} className="text-blue-500" />, bg: 'bg-blue-50/60', desc: 'Tiết 6 - 10' },
    { id: 'evening', label: 'Tối', icon: <Moon size={22} className="text-indigo-500" />, bg: 'bg-indigo-50/60', desc: 'Tiết 11+' },
  ];

  if (weekEventsCount === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Sun size={30} />
        </div>
        <h3 className="text-xl font-black text-slate-900">Tuần này chưa có lịch học</h3>
        <p className="mt-2 text-sm font-bold text-slate-500">Bạn có thể đổi ngày hoặc xem theo tháng để kiểm tra các tuần khác.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="md:hidden space-y-3">
        {weekDates.map((date, dayIndex) => {
          const dayEvents = getEventsForDay(dayIndex);
          const isToday = date.toDateString() === today;

          return (
            <div key={date.toISOString()} className={`rounded-3xl border p-4 ${isToday ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-xs font-black ${isToday ? 'text-blue-700' : 'text-slate-500'}`}>{dayLabels[dayIndex]}</p>
                  <h3 className="text-lg font-black text-slate-900">{date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-[11px] font-black text-slate-600 border border-slate-100">
                  {dayEvents.length} lịch
                </span>
              </div>

              {dayEvents.length > 0 ? (
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-400 py-4">Không có lịch học.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden md:block bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1080px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[110px] bg-slate-50 border-b border-r border-slate-100 p-4 sticky left-0 z-20" />
                  {dayLabels.map((day, index) => {
                    const date = weekDates[index];
                    const isToday = date.toDateString() === today;
                    return (
                      <th key={day} className={`p-4 border-b border-slate-100 ${isToday ? 'bg-blue-50/70' : 'bg-white'}`}>
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span className={`text-[11px] font-black ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                            {day}
                          </span>
                          <span className={`text-sm font-black ${isToday ? 'h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30' : 'text-slate-900'}`}>
                            {date.getDate()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td className={`w-[110px] border-b border-r border-slate-100 p-4 sticky left-0 z-10 ${slot.bg}`}>
                      <div className="flex flex-col items-center justify-center text-center h-full min-h-[170px] gap-2">
                        {slot.icon}
                        <span className="text-xs font-black text-slate-800">{slot.label}</span>
                        <span className="text-[10px] font-bold text-slate-400">{slot.desc}</span>
                      </div>
                    </td>

                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const slotEvents = getEventsForSlot(dayIndex, slot.id);
                      const isToday = weekDates[dayIndex].toDateString() === today;

                      return (
                        <td key={dayIndex} className={`p-3 border-b border-r border-slate-100 align-top ${isToday ? 'bg-blue-50/20' : 'hover:bg-slate-50/60'} transition-colors w-[14%]`}>
                          <div className="flex flex-col gap-3 min-h-[170px]">
                            {slotEvents.length > 0 ? (
                              slotEvents.map((event) => (
                                <motion.div
                                  key={event.id}
                                  initial={{ opacity: 0, scale: 0.96 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  <EventCard event={event} variant="compact" onClick={() => onEventClick(event)} />
                                </motion.div>
                              ))
                            ) : (
                              <div className="h-full min-h-[120px] rounded-2xl border border-dashed border-slate-100 bg-slate-50/40 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-300">Trống</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
