import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);

interface ScheduleGridProps {
  previewEvents: any[];
}

const ScheduleGrid = ({ previewEvents }: ScheduleGridProps) => {
  return (
    <div className="hidden lg:block min-w-[1200px] p-6">
      <div className="grid grid-cols-8 gap-1 bg-slate-200 border border-slate-200 rounded-[2rem] overflow-hidden shadow-inner">
        {/* Header Column: Periods */}
        <div className="bg-slate-50 p-4 flex items-center justify-center border-r border-slate-200">
          <Clock size={20} className="text-slate-400" />
        </div>
        {/* Header Row: Days */}
        {DAYS.map(day => (
          <div key={day} className="bg-slate-50 p-5 text-center border-r border-slate-200 last:border-r-0">
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">{day}</span>
          </div>
        ))}

        {/* Grid Body */}
        {PERIODS.map(p => (
          <React.Fragment key={p}>
            <div className="bg-white p-4 text-center border-b border-r border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-slate-900">Tiết {p}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">{7 + p}:00</span>
            </div>
            {DAYS.map((day, dIdx) => {
              const eventsInSlot = previewEvents.filter(e => e.day === dIdx + 1 && e.startPeriod <= p && e.endPeriod >= p);
              return (
                <div key={`${day}-${p}`} className="bg-white border-b border-r border-slate-100 min-h-[1200px]:h-24 relative p-1 group hover:bg-slate-50/50 transition-all cursor-pointer">
                  {eventsInSlot.map((e, idx) => (
                    <motion.div 
                      key={e.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute inset-1 rounded-xl p-3 border-2 overflow-hidden shadow-sm flex flex-col justify-between ${
                        e.isConflict 
                        ? 'bg-rose-50 border-rose-200 text-rose-700 z-20' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                      style={{ zIndex: 10 + idx }}
                    >
                      <div>
                        <p className="text-[9px] font-black uppercase leading-tight truncate">{e.subject}</p>
                        <p className="text-[8px] font-bold opacity-70 uppercase tracking-tighter truncate">{e.classId} • {e.room}</p>
                      </div>
                      {e.isConflict && (
                        <div className="flex justify-end">
                          <AlertTriangle size={12} className="animate-pulse" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;
