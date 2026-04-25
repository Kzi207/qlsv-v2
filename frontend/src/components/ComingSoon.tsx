import React from 'react';
import { Sparkles, Construction, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ComingSoon: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-fade-up">
       <motion.div 
         animate={{ rotate: [0, 10, -10, 0] }}
         transition={{ repeat: Infinity, duration: 4 }}
         className="h-24 w-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-xl shadow-blue-500/10"
       >
          <Construction size={48} />
       </motion.div>
       
       <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <Sparkles size={12} /> Under Development
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 font-bold max-w-md mx-auto">
             Tính năng này đang được chúng tôi hoàn thiện để mang lại trải nghiệm tốt nhất cho bạn. Vui lòng quay lại sau!
          </p>
       </div>

       <button 
         onClick={() => window.history.back()}
         className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
       >
          <ArrowLeft size={18} /> Quay lại
       </button>
    </div>
  );
};

export default ComingSoon;
