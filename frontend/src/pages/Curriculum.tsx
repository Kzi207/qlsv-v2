import { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Curriculum = () => {
  const [expandedSemester, setExpandedSemester] = useState<number | null>(1);
  const totalSemesters = Array.from({ length: 13 }, (_, i) => i + 1);

  const toggleSemester = (semester: number) => {
    setExpandedSemester(expandedSemester === semester ? null : semester);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-up">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Chương trình khung</h1>
        <p className="text-slate-500 font-medium">Lộ trình đào tạo chi tiết qua 13 học kỳ của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Left Panel: Stats */}
         <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-6 sticky top-24">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chuyên ngành</p>
                  <p className="font-black text-slate-900">—</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian học</p>
                  <p className="font-black text-slate-900">13 Học kỳ</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng tín chỉ</p>
                  <div className="flex items-center gap-2">
                     <p className="text-2xl font-black text-slate-300">0</p>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tín chỉ</p>
                  </div>
               </div>
               
               <div className="pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                     <span className="text-slate-500">Tiến độ hoàn thành</span>
                     <span className="text-slate-400">0%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 w-0 rounded-full" />
                  </div>
               </div>
            </div>
         </div>

         {/* Right Panel: Semesters Accordion */}
         <div className="md:col-span-2 space-y-4">
            {totalSemesters.map((semester) => {
               const isExpanded = expandedSemester === semester;
               
               return (
                  <div key={semester} className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/10 overflow-hidden transition-all duration-300">
                     <button 
                        onClick={() => toggleSemester(semester)}
                        className={`w-full p-5 flex items-center justify-between transition-colors ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
                     >
                        <div className="flex items-center gap-4 text-left">
                           <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                              isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-500'
                           }`}>
                              {semester}
                           </div>
                           <div>
                              <h3 className="font-black text-slate-900 tracking-tight text-sm">Học kỳ {semester}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">0 Tín chỉ • 0 Học phần</p>
                           </div>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-white text-blue-600' : 'text-slate-300'}`}>
                           {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                     </button>

                     <AnimatePresence>
                        {isExpanded && (
                           <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                           >
                              <div className="px-5 pb-5 pt-2 flex flex-col items-center justify-center py-8 text-center border-t border-slate-50">
                                 <Inbox size={24} className="text-slate-200 mb-2" />
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chưa có danh sách học phần</p>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               );
            })}
         </div>
      </div>

      <div className="p-8 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50">
        <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 border border-slate-100">
          <Layers size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-slate-900 font-black">Dữ liệu tham khảo</p>
          <p className="text-slate-400 text-sm font-bold">Lộ trình học tập sẽ được cập nhật khi có thông tin chính thức từ khoa.</p>
        </div>
      </div>
    </div>
  );
};

export default Curriculum;
