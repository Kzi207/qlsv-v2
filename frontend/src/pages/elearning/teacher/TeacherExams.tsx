import React from 'react';
import { Award, Plus } from 'lucide-react';
import ELearningRightPanel from '../../../components/elearning/ELearningRightPanel';

const TeacherExams: React.FC = () => {
  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900 border border-emerald-800 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                 <Award size={12} /> Examinations
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý kỳ thi</h1>
              <p className="text-slate-500 font-bold text-sm">Tổ chức các kỳ thi online và kiểm tra định kỳ.</p>
            </div>
            <button className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
               <Plus size={18} /> Tạo kỳ thi mới
            </button>
          </div>

          <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
             <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Award size={32} className="text-slate-200" />
             </div>
             <div className="space-y-2">
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Chưa có kỳ thi nào</p>
                <p className="text-xs font-bold text-slate-400">Tổ chức kỳ thi để tổng hợp kết quả học tập của sinh viên.</p>
             </div>
          </div>
        </div>
        <div className="hidden lg:block">
           <ELearningRightPanel role="LECTURER" />
        </div>
      </div>
    </div>
  );
};

export default TeacherExams;
