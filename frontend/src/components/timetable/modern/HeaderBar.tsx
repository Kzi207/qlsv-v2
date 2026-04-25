import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'day' | 'week' | 'month';
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void;
}

const HeaderBar: React.FC<Props> = ({ selectedDate, onDateChange, viewMode, onViewModeChange }) => {
  const formatHeaderDate = (date: Date) => {
    if (viewMode === 'day') {
      return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/95 backdrop-blur p-3 md:p-4 rounded-3xl border border-slate-100 shadow-sm sticky top-0 z-30">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => onDateChange(new Date())}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-2xl text-xs font-black text-white border border-blue-600 transition-all active:scale-95"
        >
          Hôm nay
        </button>

        <div className="flex items-center gap-1 bg-slate-50 rounded-2xl border border-slate-100 p-1">
          <button aria-label="Lùi lịch" onClick={handlePrev} className="h-9 w-9 flex items-center justify-center hover:bg-white rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button aria-label="Tới lịch" onClick={handleNext} className="h-9 w-9 flex items-center justify-center hover:bg-white rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <label className="relative group flex items-center gap-3 px-3 py-2 min-w-0 cursor-pointer">
          <CalendarIcon size={18} className="text-blue-600 shrink-0" />
          <span className="text-base md:text-xl font-black text-slate-900 tracking-tight capitalize truncate">
            {formatHeaderDate(selectedDate)}
          </span>
          <input
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              if (e.target.value) onDateChange(new Date(e.target.value));
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 bg-slate-100/70 p-1 rounded-2xl border border-slate-100 w-full sm:w-auto">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onViewModeChange(mode.id)}
            className={`px-4 md:px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ${
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
  );
};

export default HeaderBar;
