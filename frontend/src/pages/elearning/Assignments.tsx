import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const Assignments: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/elearning/courses');
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setLoading(false);
    }
  };

  const allAssignments = courses.flatMap(course => 
    (course.assignments || []).map((assign: any) => ({
      ...assign,
      courseName: course.name,
      courseId: course.id,
      isSubmitted: assign.submissions && assign.submissions.length > 0
    }))
  ).filter(assign => {
    if (filter === 'pending') return !assign.isSubmitted;
    if (filter === 'completed') return assign.isSubmitted;
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-fade-up space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
             <ClipboardList size={12} /> Quản lý bài tập
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bài tập & Deadline</h1>
          <p className="text-slate-500 font-bold text-sm">Theo dõi và hoàn thành các bài tập được giao từ giảng viên.</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
           <button 
             onClick={() => setFilter('all')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               filter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
             }`}
           >Tất cả</button>
           <button 
             onClick={() => setFilter('pending')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               filter === 'pending' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
             }`}
           >Chưa nộp</button>
           <button 
             onClick={() => setFilter('completed')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               filter === 'completed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
             }`}
           >Đã nộp</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-[2.5rem]" />
           ))}
        </div>
      ) : allAssignments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
           {allAssignments.map((assign) => (
             <motion.div 
               key={assign.id}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-blue-200 transition-all"
             >
                <div className="flex items-center gap-6">
                   <div className={`h-16 w-16 rounded-3xl flex items-center justify-center ${
                     assign.isSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                   }`}>
                      {assign.isSubmitted ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900">{assign.title}</h3>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{assign.courseName}</span>
                         <span className="text-slate-300">•</span>
                         <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">Hạn: {new Date(assign.dueDate).toLocaleString('vi-VN')}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm tối đa</p>
                      <p className="text-lg font-black text-slate-900">{assign.maxPoints}</p>
                   </div>
                   <button 
                     onClick={() => window.location.href = `/elearning/course/${assign.courseId}?tab=assignments`}
                     className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 group-hover:gap-4 shadow-xl shadow-slate-200/50"
                   >
                      {assign.isSubmitted ? 'Xem bài nộp' : 'Làm bài ngay'}
                      <ArrowRight size={16} />
                   </button>
                </div>
             </motion.div>
           ))}
        </div>
      ) : (
        <div className="py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
           <FileText size={48} className="mx-auto text-slate-200" />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có bài tập nào phù hợp</p>
        </div>
      )}

    </div>
  );
};

export default Assignments;
