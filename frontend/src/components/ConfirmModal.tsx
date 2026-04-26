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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
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
            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden z-10"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className={`h-14 w-14 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.icon}`}>
                  <AlertTriangle size={28} />
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full py-4 ${colors.btn} text-white rounded-2xl font-black uppercase tracking-widest shadow-xl ${colors.shadow} transition-all active:scale-95`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  {cancelText}
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
