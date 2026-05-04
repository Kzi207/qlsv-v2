import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger'
}) => {
  const getColorScheme = () => {
    switch (type) {
      case 'warning': return { bg: 'bg-amber-50', icon: 'text-amber-500', btn: 'bg-amber-600 hover:bg-amber-700', shadow: 'shadow-amber-500/20' };
      case 'info': return { bg: 'bg-blue-50', icon: 'text-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', shadow: 'shadow-blue-500/20' };
      default: return { bg: 'bg-rose-50', icon: 'text-rose-500', btn: 'bg-rose-600 hover:bg-rose-700', shadow: 'shadow-rose-500/20' };
    }
  };

  const colors = getColorScheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-[1.6rem] bg-white shadow-2xl sm:max-w-md sm:rounded-[2.5rem]"
          >
            <div className="space-y-4 p-5 sm:space-y-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ${colors.icon} sm:h-14 sm:w-14 sm:rounded-2xl`}>
                  <AlertTriangle size={20} className="sm:hidden" />
                  <AlertTriangle size={28} className="hidden sm:block" />
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:text-slate-600 sm:p-2">
                  <X size={18} className="sm:hidden" />
                  <X size={24} className="hidden sm:block" />
                </button>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
                <p className="text-sm font-medium leading-relaxed text-slate-500 sm:text-base">{message}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 sm:gap-3 sm:pt-2">
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-slate-100 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600 transition-all active:scale-95 hover:bg-slate-200 sm:rounded-2xl sm:py-4 sm:text-xs sm:tracking-widest"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full rounded-xl py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-lg transition-all active:scale-95 sm:rounded-2xl sm:py-4 sm:text-xs sm:tracking-widest sm:shadow-xl ${colors.btn} ${colors.shadow}`}
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

