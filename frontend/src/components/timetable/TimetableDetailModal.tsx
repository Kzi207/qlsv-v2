import React from 'react';
import { X, Clock, MapPin, User, BookOpen, ShieldCheck, Video, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPeriodTimes } from '../../utils/timetable';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

const TimetableDetailModal: React.FC<Props> = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden"
      >
        {/* Header - Compact */}
        <div className={`p-6 pb-12 relative overflow-hidden shrink-0 ${event.type === 'online' ? 'bg-rose-600' : 'bg-blue-600'}`}>
           <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 -mr-6 -mt-6"><BookOpen size={160} /></div>
           <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-2">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                    {event.type} Session
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{event.subject}</h2>
              </div>
              <button onClick={onClose} className="p-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all border border-white/10"><X size={20} /></button>
           </div>
        </div>

        {/* Content - Scrollable if needed */}
        <div className="relative -mt-8 bg-white rounded-t-[2.5rem] p-6 pt-10 flex-1 overflow-y-auto custom-scrollbar space-y-6">
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-1">
                 <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <Clock size={12} className="text-blue-500" /> Thời gian
                 </div>
                 <p className="text-base font-black text-slate-900">{start} - {end}</p>
                 <p className="text-[10px] font-bold text-blue-600 uppercase">Tiết {event.startPeriod}-{event.endPeriod}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-1">
                 <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <Calendar size={12} className="text-blue-500" /> Thứ học
                 </div>
                 <p className="text-base font-black text-slate-900">Thứ {event.day}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Học kỳ 2</p>
              </div>
           </div>

            <div className="space-y-4">
               <div className="flex items-center gap-4 p-1">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                     <User size={22} />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giảng viên</p>
                     <p className="text-base font-black text-slate-900 leading-tight">{event.teacher}</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-1">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                     <MapPin size={22} />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phòng học</p>
                     <p className="text-base font-black text-slate-900 uppercase">{event.room}</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-1">
                  <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                     <BookOpen size={22} />
                  </div>
                  <div className="flex-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lớp học phần</p>
                     <div className="flex flex-wrap gap-1.5">
                        {event.classId?.split(' + ').map((c: string, i: number) => (
                           <span key={i} className="px-2 py-0.5 bg-white border border-amber-200 text-amber-700 text-[10px] font-black rounded-lg uppercase shadow-sm">
                              {c}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

           <div className="pt-2">
              {event.type === 'online' ? (
                 <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                    <Video size={18} /> Vào lớp Online
                 </button>
              ) : (
                 <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <ShieldCheck size={20} className="text-blue-600 shrink-0"/>
                    <p className="text-[10px] font-bold text-blue-800 leading-tight uppercase">Điểm danh QR tại cửa phòng học.</p>
                 </div>
              )}
           </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-center">
           <button onClick={onClose} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">Đóng</button>
        </div>
      </motion.div>
    </div>
  );
};

export default TimetableDetailModal;

