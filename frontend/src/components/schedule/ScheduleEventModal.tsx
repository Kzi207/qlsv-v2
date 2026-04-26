import React from 'react';
import { X, Clock, MapPin, User, BookOpen, Monitor } from 'lucide-react';
import type { ScheduleEvent } from './types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
}

const ScheduleEventModal: React.FC<Props> = ({ isOpen, onClose, event }) => {
  if (!event) return null;

  const isOnline = event.type === 'online' || event.type === 'hybrid';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden z-10"
          >
            {/* Header Area */}
            <div className={`p-6 pb-8 text-white relative ${
              event.type === 'online' ? 'bg-cyan-600' :
              event.type === 'exam' ? 'bg-amber-500' :
              event.type === 'hybrid' ? 'bg-purple-600' :
              event.type === 'cancelled' ? 'bg-slate-500' :
              'bg-blue-600'
            }`}>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="flex gap-3 mb-3">
                 <span className="px-2.5 py-1 bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                   {event.type}
                 </span>
                 {isOnline && (
                   <span className="px-2.5 py-1 bg-slate-900/50 rounded-md text-[11px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
                     <Monitor size={12} /> Online
                   </span>
                 )}
              </div>
              
              <h2 className="text-xl font-bold leading-snug">{event.subject}</h2>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6 -mt-4 bg-white rounded-t-[24px] relative">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Thời gian</p>
                    <p className="text-sm font-semibold text-slate-800">Thứ {event.day}, Tiết {event.startPeriod} - {event.endPeriod}</p>
                    {event.date && <p className="text-xs text-slate-500">{event.date}</p>}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Phòng học</p>
                    <p className="text-sm font-semibold text-slate-800">{event.room}</p>
                    {isOnline && <a href="#" className="text-xs text-blue-500 hover:underline mt-1 inline-block">Tham gia Google Meet</a>}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Giảng viên</p>
                    <p className="text-sm font-semibold text-slate-800">{event.teacher}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Lớp học phần</p>
                    <p className="text-sm font-semibold text-slate-800">{event.classId}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleEventModal;
