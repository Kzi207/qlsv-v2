import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/10"
        >
          <AlertCircle size={48} className="text-blue-600" />
        </motion.div>

        {/* 404 Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-9xl font-black text-slate-200 leading-none select-none"
        >
          404
        </motion.h1>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative -mt-12"
        >
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
            Không tìm thấy trang
          </h2>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
            Có vẻ như đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển sang một vị trí khác.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
          >
            <Home size={20} />
            Về trang chủ
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 font-black rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
            Quay lại
          </button>
        </motion.div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-slate-400 text-sm font-bold uppercase tracking-widest"
        >
          MY CTUT • 2026
        </motion.p>
      </div>
    </div>
  );
};

export default NotFound;
