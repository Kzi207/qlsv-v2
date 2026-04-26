import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, MapPin, Moon, Sun, Sunset, User } from 'lucide-react';
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
}

type SlotId = 'morning' | 'afternoon' | 'evening';

const WeekView: React.FC<Props> = ({ events, selectedDate, onEventClick }) => {
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const today = new Date().toDateString();
  const selectedDateKey = selectedDate.toDateString();

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

  const getEventsForSlot = (dayEvents: TimetableEvent[], slot: SlotId) => {
    return dayEvents.filter((event) => {
      const startPeriod = Number(event.startPeriod);
      if (slot === 'morning') return startPeriod <= 5;
      if (slot === 'afternoon') return startPeriod > 5 && startPeriod <= 10;
      return startPeriod > 10;
    });
  };

  const weekDates = getWeekDates(selectedDate);
  const weekEventsByDay = weekDates.map((_, index) => getEventsForDay(index));
  const weekEventsCount = weekEventsByDay.reduce((total, dayEvents) => total + dayEvents.length, 0);
  const weekLearningDays = weekEventsByDay.filter((dayEvents) => dayEvents.length > 0).length;
  const hasEveningEvents = weekEventsByDay.some((dayEvents) =>
    dayEvents.some((event) => Number(event.startPeriod) > 10),
  );

  const busiestDay = weekEventsByDay.reduce(
    (max, dayEvents, index) => {
      if (dayEvents.length > max.count) return { index, count: dayEvents.length };
      return max;
    },
    { index: 0, count: 0 },
  );

  const baseTimeSlots: Array<{ id: SlotId; label: string; icon: React.ReactNode; bg: string; desc: string }> = [
    { id: 'morning', label: 'Sáng', icon: <Sun size={22} className="text-amber-500" />, bg: 'bg-amber-50/60', desc: 'Tiết 1 - 5' },
    { id: 'afternoon', label: 'Chiều', icon: <Sunset size={22} className="text-blue-500" />, bg: 'bg-blue-50/60', desc: 'Tiết 6 - 10' },
    { id: 'evening', label: 'Tối', icon: <Moon size={22} className="text-indigo-500" />, bg: 'bg-indigo-50/60', desc: 'Tiết 11+' },
  ];
  const timeSlots = hasEveningEvents ? baseTimeSlots : baseTimeSlots.filter((slot) => slot.id !== 'evening');

  const getMobileTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'online':
        return 'bg-cyan-100 text-cyan-700';
      case 'exam':
      case 'official_exam':
        return 'bg-amber-100 text-amber-700';
      case 'cancelled':
        return 'bg-slate-200 text-slate-500';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

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
      <div className="hidden lg:flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">{weekEventsCount} lịch học</span>
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">{weekLearningDays} ngày có lịch</span>
        </div>
        <p className="text-xs font-black text-slate-500">
          {busiestDay.count > 0 ? `Bận nhất: ${dayLabels[busiestDay.index]} (${busiestDay.count} môn)` : 'Không có lịch học'}
        </p>
      </div>

      <div className="lg:hidden space-y-4">
        {weekDates.map((date, dayIndex) => {
          const dayEvents = weekEventsByDay[dayIndex];
          const isToday = date.toDateString() === today;
          const isSelected = date.toDateString() === selectedDateKey;

          return (
            <div
              key={date.toISOString()}
              className={`rounded-3xl border p-4 shadow-sm ${
                isSelected ? 'bg-blue-50 border-blue-100' : isToday ? 'bg-cyan-50 border-cyan-100' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-xs font-black ${isSelected ? 'text-blue-700' : isToday ? 'text-cyan-700' : 'text-slate-500'}`}>{dayLabels[dayIndex]}</p>
                  <h3 className="text-xl font-black text-slate-900">{date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-[11px] font-black text-slate-600 border border-slate-100">
                  {dayEvents.length} lịch
                </span>
              </div>

              {dayEvents.length > 0 ? (
                <div className="space-y-2.5">
                  {dayEvents.map((event) => {
                    const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
                    return (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left shadow-sm transition-all hover:border-blue-200 active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-[15px] font-black text-slate-900 leading-snug">{event.subject}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${getMobileTypeBadge(event.type)}`}>
                            Tiết {event.startPeriod}-{event.endPeriod}
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-1.5 text-[11px] font-bold text-slate-600">
                          <p className="inline-flex items-center gap-1.5">
                            <Clock3 size={13} />
                            {start} - {end}
                          </p>
                          <p className="inline-flex items-center gap-1.5">
                            <MapPin size={13} />
                            {event.room || 'Chưa cập nhật phòng'}
                          </p>
                          <p className="inline-flex items-center gap-1.5">
                            <User size={13} />
                            {event.teacher || 'Chưa cập nhật giảng viên'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-400 py-4">Không có lịch học.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1180px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[124px] bg-slate-50 border-b border-r border-slate-200 p-4 sticky left-0 z-20" />
                  {dayLabels.map((day, index) => {
                    const date = weekDates[index];
                    const isToday = date.toDateString() === today;
                    const isSelected = date.toDateString() === selectedDateKey;
                    const dayEventsCount = weekEventsByDay[index].length;

                    return (
                      <th
                        key={day}
                        className={`p-4 border-b border-slate-200 ${
                          isSelected ? 'bg-blue-50/80' : isToday ? 'bg-cyan-50/80' : 'bg-white'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <span className={`text-[11px] font-black ${isSelected ? 'text-blue-600' : isToday ? 'text-cyan-700' : 'text-slate-400'}`}>
                            {day}
                          </span>
                          <span
                            className={`text-sm font-black ${
                              isSelected
                                ? 'h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30'
                                : isToday
                                  ? 'h-8 w-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30'
                                  : 'text-slate-900'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {dayEventsCount} môn
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
                    <td className={`w-[124px] border-b border-r border-slate-200 p-4 sticky left-0 z-10 ${slot.bg}`}>
                      <div className="flex flex-col items-center justify-center text-center h-full min-h-[152px] gap-2">
                        {slot.icon}
                        <span className="text-xs font-black text-slate-800">{slot.label}</span>
                        <span className="text-[10px] font-bold text-slate-400">{slot.desc}</span>
                      </div>
                    </td>

                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const dayEvents = weekEventsByDay[dayIndex];
                      const slotEvents = getEventsForSlot(dayEvents, slot.id);
                      const isToday = weekDates[dayIndex].toDateString() === today;
                      const isSelected = weekDates[dayIndex].toDateString() === selectedDateKey;

                      return (
                        <td
                          key={dayIndex}
                          className={`w-[14%] p-3 border-b border-r border-slate-200 align-top transition-colors ${
                            isSelected
                              ? 'bg-blue-50/40'
                              : isToday
                                ? 'bg-cyan-50/40'
                                : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex flex-col gap-2.5 min-h-[152px]">
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
                              <div className="h-full min-h-[120px] rounded-2xl border border-dashed border-slate-200 bg-white/65 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-300">Không có lớp</span>
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
