import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-2xl sm:max-w-md sm:rounded-[2rem]"
          >
            <div className="p-5 sm:p-8">
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${
                  type === 'danger' ? 'bg-rose-50 text-rose-500' : 
                  type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                  'bg-blue-50 text-blue-500'
                }`}>
                  <AlertTriangle size={20} className="sm:hidden" />
                  <AlertTriangle size={24} className="hidden sm:block" />
                </div>
                <button 
                  onClick={onCancel}
                  className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 sm:p-2 sm:rounded-xl"
                >
                  <X size={18} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </div>

              <div className="mb-5 space-y-1.5 sm:mb-8 sm:space-y-2">
                <h3 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">{title}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-500">{message}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  onClick={onCancel}
                  className="w-full rounded-xl bg-slate-100 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600 transition-all hover:bg-slate-200 sm:rounded-2xl sm:py-3.5 sm:text-xs sm:tracking-widest"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`w-full rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-lg transition-all active:scale-95 sm:rounded-2xl sm:py-3.5 sm:text-xs sm:tracking-widest ${
                    type === 'danger' ? 'bg-rose-600 shadow-rose-500/20 hover:bg-rose-700' :
                    type === 'warning' ? 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600' :
                    'bg-blue-600 shadow-blue-500/20 hover:bg-blue-700'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;

