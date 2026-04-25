import { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Star, Inbox, RefreshCw, Award, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const Grades = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/grades/my');
      setGrades(res.data);
    } catch (error) {
      toast.error('Không thể tải kết quả học tập');
    } finally {
      setLoading(false);
    }
  };

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    const total = grades.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
    const avg = total / grades.length;
    // Simple 4.0 conversion (Vietnamese 10.0 scale)
    return (avg * 0.4).toFixed(2);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <Award size={12} /> Bảng điểm sinh viên
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Kết quả học tập</h1>
          <p className="text-slate-500 font-bold text-sm">Xem điểm chi tiết và tiến độ học tập của bạn.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-6 min-w-[200px]">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
              <Star size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">GPA Tích lũy</p>
              <p className="text-2xl font-black text-slate-900">{calculateGPA()}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-6 min-w-[200px]">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Số môn học</p>
              <p className="text-2xl font-black text-slate-900">{grades.length}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[400px] flex items-center justify-center bg-white rounded-[2.5rem] border border-slate-100">
             <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải bảng điểm...</p>
             </div>
          </motion.div>
        ) : grades.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Học kỳ</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Môn học</th>
                      <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Quá trình</th>
                      <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Giữa kỳ</th>
                      <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuối kỳ</th>
                      <th className="p-6 text-center text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/30">Tổng kết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {grades.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                           <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                              {g.semesterId}
                           </span>
                        </td>
                        <td className="p-6">
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{g.subject}</p>
                        </td>
                        <td className="p-6 text-center text-sm font-bold text-slate-600">{g.processScore || '-'}</td>
                        <td className="p-6 text-center text-sm font-bold text-slate-600">{g.midtermScore || '-'}</td>
                        <td className="p-6 text-center text-sm font-bold text-slate-600">{g.finalScore || '-'}</td>
                        <td className="p-6 text-center bg-blue-50/10">
                           <span className={`px-4 py-2 rounded-xl font-black text-sm ${
                              (g.totalScore || 0) >= 4.0 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'
                           }`}>
                              {(g.totalScore || 0).toFixed(2)}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-20 text-center flex flex-col items-center space-y-6">
             <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                <Inbox size={48} />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Chưa có kết quả học tập</h3>
                <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">Dữ liệu điểm số sẽ được cập nhật sau khi giảng viên hoàn tất nhập điểm học phần.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/30">
         <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-10 -mt-10">
            <TrendingUp size={160} />
         </div>
         <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shrink-0">
               <Info size={40} className="text-blue-400" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
               <h3 className="text-xl font-black uppercase tracking-tight">Ghi chú về thang điểm</h3>
               <p className="text-slate-400 text-sm font-bold leading-relaxed">
                  Hệ thống sử dụng công thức tính điểm tổng kết: <br />
                  <span className="text-blue-400">20% Quá trình + 30% Giữa kỳ + 50% Cuối kỳ</span>. <br />
                  Điểm đạt (Pass) là từ 4.0 trở lên trên thang điểm 10.
               </p>
            </div>
            <button 
              onClick={fetchGrades}
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-3 shadow-xl"
            >
               <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Cập nhật ngay
            </button>
         </div>
      </div>
    </div>
  );
};

export default Grades;
