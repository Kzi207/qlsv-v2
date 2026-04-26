import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, MapPin, User } from 'lucide-react';
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
  onDateSelect: (date: Date) => void;
}

const MonthView: React.FC<Props> = ({ events, selectedDate, onEventClick, onDateSelect }) => {
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const calendarDays: Array<Date | null> = [];

  for (let index = 0; index < startOffset; index += 1) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) calendarDays.push(new Date(currentYear, currentMonth, day));

  const getDayValue = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 8 : day + 1;
  };

  const getStatusColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'online': return 'bg-cyan-500';
      case 'exam': return 'bg-amber-500';
      case 'official_exam': return 'bg-rose-500';
      case 'cancelled': return 'bg-slate-400';
      default: return 'bg-blue-500';
    }
  };

  const getTypeBadgeClass = (type: string) => {
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

  const getTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'online':
        return 'Online';
      case 'exam':
        return 'Thi HK';
      case 'official_exam':
        return 'Thi chính';
      case 'cancelled':
        return 'Tạm ngưng';
      default:
        return 'Lịch học';
    }
  };

  const daysWithEvents = calendarDays
    .filter((date): date is Date => date !== null)
    .map((date) => ({
      date,
      dayEvents: events
        .filter((event) => Number(event.day) === getDayValue(date))
        .sort((a, b) => Number(a.startPeriod) - Number(b.startPeriod)),
    }))
    .filter((item) => item.dayEvents.length > 0);

  return (
    <div className="space-y-5 pb-12">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[392px_minmax(0,1fr)]">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2.5 md:p-3 h-fit xl:sticky xl:top-6">
          <div className="grid grid-cols-7 gap-0.5 mb-1.5">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <div key={day} className="py-0.5 text-center text-[9px] font-black text-slate-400">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 auto-rows-[30px] md:auto-rows-[34px] xl:auto-rows-[36px]">
            {calendarDays.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="h-full" />;

              const dayEvents = events.filter((event) => Number(event.day) === getDayValue(date));
              const isToday = new Date().toDateString() === date.toDateString();
              const isSelected = selectedDate.toDateString() === date.toDateString();

              return (
                <motion.div
                  key={date.toISOString()}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => onDateSelect(date)}
                  className={`h-full relative rounded-md border transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                      : isToday ? 'bg-blue-50 border-blue-100 text-blue-700'
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-100'
                  }`}
                >
                  <span className="text-[11px] md:text-xs font-black leading-none">{date.getDate()}</span>
                  {dayEvents.length > 0 && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div key={event.id} className={`h-1 w-1 rounded-full ${getStatusColor(event.type)} shadow-sm`} />
                      ))}
                    </div>
                  )}
                  {dayEvents.length > 2 && !isSelected && (
                    <span className="absolute right-1 bottom-0.5 hidden md:block text-[8px] font-black text-slate-400">+{dayEvents.length - 2}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-black text-slate-900">Lịch học trong tháng</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{daysWithEvents.length} ngày có lịch</span>
          </div>

          {daysWithEvents.length > 0 ? (
            <div className="max-h-[650px] overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-3">
              {daysWithEvents.map((item) => {
                const isSelectedDay = selectedDate.toDateString() === item.date.toDateString();

                return (
                  <div
                    key={item.date.toISOString()}
                    className={`rounded-2xl border ${isSelectedDay ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-100">
                      <button
                        onClick={() => onDateSelect(item.date)}
                        className="text-left"
                      >
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Ngày học</p>
                        <p className="text-sm font-black text-slate-900 capitalize">
                          {item.date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        </p>
                      </button>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                        {item.dayEvents.length} môn
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {item.dayEvents.map((event) => {
                        const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
                        return (
                          <button
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="w-full px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-[96px] pt-0.5">
                                <p className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600">
                                  <Clock3 size={11} />
                                  {start} - {end}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">
                                  Tiết {event.startPeriod}-{event.endPeriod}
                                </p>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-xs font-black text-slate-900">{event.subject}</p>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${getTypeBadgeClass(event.type)}`}>
                                    {getTypeLabel(event.type)}
                                  </span>
                                </div>
                                <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                  <MapPin size={11} />
                                  {event.room || 'Chưa cập nhật phòng'}
                                </p>
                                <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                  <User size={11} />
                                  {event.teacher || 'Chưa cập nhật giảng viên'}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-bold text-slate-500">Tháng này chưa có lịch học.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MonthView;
