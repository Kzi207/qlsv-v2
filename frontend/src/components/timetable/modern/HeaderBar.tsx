import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'day' | 'week' | 'month';
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void;
}

const HeaderBar: React.FC<Props> = ({ selectedDate, onDateChange, viewMode, onViewModeChange }) => {
  const getWeekRange = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  const formatHeaderDate = (date: Date) => {
    if (viewMode === 'day') {
      return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const { monday, sunday } = getWeekRange(date);
      const rangeStart = monday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const rangeEnd = sunday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `Tuần ${rangeStart} - ${rangeEnd}`;
    }
    return `Tháng ${date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}`;
  };

  const handlePrev = () => {
    const nextDate = new Date(selectedDate);
    if (viewMode === 'month') nextDate.setMonth(nextDate.getMonth() - 1);
    else if (viewMode === 'week') nextDate.setDate(nextDate.getDate() - 7);
    else nextDate.setDate(nextDate.getDate() - 1);
    onDateChange(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(selectedDate);
    if (viewMode === 'month') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (viewMode === 'week') nextDate.setDate(nextDate.getDate() + 7);
    else nextDate.setDate(nextDate.getDate() + 1);
    onDateChange(nextDate);
  };

  const modes = [
    { id: 'day', label: 'Ngày' },
    { id: 'week', label: 'Tuần' },
    { id: 'month', label: 'Tháng' },
  ] as const;

  return (
    <div className="relative z-10 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onDateChange(new Date())}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition-all hover:bg-blue-700 active:scale-95"
            >
              Hôm nay
            </button>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                aria-label="Lùi lịch"
                onClick={handlePrev}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                aria-label="Tới lịch"
                onClick={handleNext}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <label className="group relative flex w-fit min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 transition-colors hover:bg-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <CalendarIcon size={17} className="shrink-0" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {viewMode === 'day' ? 'Lịch ngày' : viewMode === 'week' ? 'Lịch tuần' : 'Lịch tháng'}
              </p>
              <p className="truncate text-base font-black capitalize text-slate-900 md:text-lg">
                {formatHeaderDate(selectedDate)}
              </p>
            </div>
            <input
              type="date"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => {
                if (e.target.value) onDateChange(new Date(e.target.value));
              }}
            />
          </label>
        </div>

        <div className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 sm:w-auto">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onViewModeChange(mode.id)}
              className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all duration-200 md:px-6 ${
                viewMode === mode.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
