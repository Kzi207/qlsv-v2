import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'day' | 'week' | 'month';
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void;
}

const ScheduleHeader: React.FC<Props> = ({ currentDate, onDateChange, viewMode, onViewModeChange }) => {
  const formatHeaderDate = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    return currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 sticky top-4 z-40">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onDateChange(new Date())}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-700 transition-colors"
          >
            Hôm nay
          </button>
          <div className="flex items-center bg-slate-50 rounded-xl">
            <button onClick={handlePrev} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={handleNext} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-bold text-slate-800 hidden md:block">
          {formatHeaderDate()}
        </h2>
      </div>

      <h2 className="text-lg font-bold text-slate-800 block md:hidden text-center">
        {formatHeaderDate()}
      </h2>

      <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
        {(['day', 'week', 'month'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 ${
              viewMode === mode 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScheduleHeader;
