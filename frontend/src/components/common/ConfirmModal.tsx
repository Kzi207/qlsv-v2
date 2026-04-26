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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden z-10 border border-slate-100"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  type === 'danger' ? 'bg-rose-50 text-rose-500' : 
                  type === 'warning' ? 'bg-amber-50 text-amber-500' : 
                  'bg-blue-50 text-blue-500'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <button 
                  onClick={onCancel}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{message}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${
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
