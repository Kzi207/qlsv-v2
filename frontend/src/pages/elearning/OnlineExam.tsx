import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Clock, 
  CheckCircle,
  PlayCircle,
  Timer
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const OnlineExam: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/elearning/courses');
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch exams', error);
    } finally {
      setLoading(false);
    }
  };

  const allExams = courses.flatMap(course => 
    (course.exams || []).map((exam: any) => ({
      ...exam,
      courseName: course.name,
      courseId: course.id,
      isFinished: exam.results && exam.results.length > 0
    }))
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-fade-up space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-widest">
             <Award size={12} /> Hệ thống khảo thí
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Kỳ thi trực tuyến</h1>
          <p className="text-slate-500 font-bold text-sm">Tham gia các bài kiểm tra và đánh giá kết quả học tập.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {[1, 2].map(i => (
             <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-[2.5rem]" />
           ))}
        </div>
      ) : allExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {allExams.map((exam) => (
             <motion.div 
               key={exam.id}
               whileHover={{ scale: 1.02 }}
               className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10 flex flex-col justify-between space-y-8 relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Award size={120} />
                </div>

                <div className="flex items-center gap-6 relative z-10">
                   <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center ${
                     exam.isFinished ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 shadow-xl shadow-rose-200/50'
                   }`}>
                      {exam.isFinished ? <CheckCircle size={40} /> : <Timer size={40} />}
                   </div>
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{exam.courseName}</span>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{exam.title}</h3>
                      <div className="flex items-center gap-4 text-slate-400">
                         <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">{exam.duration} Phút</span>
                         </div>
                         <span className="text-slate-200">|</span>
                         <div className="flex items-center gap-1.5 text-rose-500">
                            <Timer size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                               {new Date(exam.startTime).toLocaleDateString('vi-VN')}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Trạng thái</span>
                      <span className={`text-xs font-black uppercase tracking-widest ${exam.isFinished ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {exam.isFinished ? 'Hoàn thành' : 'Chưa tham gia'}
                      </span>
                   </div>
                   <button 
                     onClick={() => {
                       if (!exam.isFinished) {
                         navigate(`/elearning/exam/${exam.id}`);
                       }
                     }}
                     className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl ${
                       exam.isFinished 
                         ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                         : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200 active:scale-95'
                     }`}
                   >
                      {exam.isFinished ? 'Đã hoàn tất' : 'Vào phòng thi'}
                      {!exam.isFinished && <PlayCircle size={18} />}
                   </button>
                </div>
             </motion.div>
           ))}
        </div>
      ) : (
        <div className="py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
           <Award size={48} className="mx-auto text-slate-200" />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có kỳ thi nào đang diễn ra</p>
        </div>
      )}

    </div>
  );
};

export default OnlineExam;
