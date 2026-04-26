import { Calendar, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

interface ScheduleDayListProps {
  previewEvents: any[];
  onRemove: (id: string) => void;
}

const ScheduleDayList = ({ previewEvents, onRemove }: ScheduleDayListProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 lg:hidden">
      {DAYS.map((dayName, dIdx) => {
        const eventsForDay = previewEvents.filter(e => e.day === dIdx + 1);
        if (eventsForDay.length === 0) return null;

        return (
          <div key={dayName} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{dayName}</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">
                {eventsForDay.length} Tiết
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {eventsForDay.map(e => (
                  <motion.div 
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-6 rounded-[2rem] border bg-white shadow-sm flex flex-col gap-4 relative overflow-hidden group ${
                      e.isConflict ? 'border-rose-200' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          e.isConflict ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {e.isConflict ? <AlertTriangle size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase leading-tight">{e.subject}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Tiết {e.startPeriod} - {e.endPeriod}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onRemove(e.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lớp / Phòng</p>
                        <p className="text-xs font-bold text-slate-700">{e.classId} • {e.room}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Giảng viên</p>
                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{e.teacher}</p>
                      </div>
                    </div>

                    {e.isConflict && (
                      <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3">
                        <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                        <p className="text-[9px] font-black text-rose-700 uppercase leading-tight">
                          Phát hiện xung đột lịch học (Trùng phòng/GV)
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {previewEvents.length === 0 && (
        <div className="py-40 text-center space-y-4 opacity-30">
          <Calendar size={60} className="mx-auto" />
          <p className="text-sm font-black uppercase tracking-widest">Chưa có lịch xem trước</p>
          <p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto">Chọn lớp và điền thông tin để bắt đầu xếp lịch.</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleDayList;
