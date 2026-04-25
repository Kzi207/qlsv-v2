import { AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConflictAlertProps {
  conflictCount: number;
  onViewDetails: () => void;
}

const ConflictAlert = ({ conflictCount, onViewDetails }: ConflictAlertProps) => {
  if (conflictCount === 0) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl bg-rose-600 text-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl z-[150] flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 md:gap-6">
        <div className="h-12 w-12 md:h-14 md:w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shrink-0">
          <AlertTriangle size={24} className="md:size-32 animate-bounce" />
        </div>
        <div>
          <h4 className="text-sm md:text-base font-black uppercase tracking-tight">Phát hiện xung đột lịch học</h4>
          <p className="text-[10px] md:text-xs font-bold text-white/80">
            Có {conflictCount} lịch học bị trùng Giảng viên, Phòng hoặc Lớp. Vui lòng kiểm tra lại.
          </p>
        </div>
      </div>
      <button 
        onClick={onViewDetails}
        className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-xl"
      >
        Chi tiết & Sửa lỗi <ChevronRight size={16} />
      </button>
    </motion.div>
  );
};

export default ConflictAlert;
