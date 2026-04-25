import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Play, 
  File, 
  Download, 
  Clock, 
  Search,
  Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const Lectures: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const res = await api.get('/elearning/courses');
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch lectures', error);
    } finally {
      setLoading(false);
    }
  };

  const allLessons = courses.flatMap(course => 
    (course.lessons || []).map((lesson: any) => ({
      ...lesson,
      courseName: course.name,
      courseId: course.id
    }))
  ).filter(lesson => 
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-fade-up space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <BookOpen size={12} /> Kho tài liệu học tập
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bài giảng trực tuyến</h1>
          <p className="text-slate-500 font-bold text-sm">Truy cập toàn bộ video và tài liệu từ các khóa học của bạn.</p>
        </div>

        <div className="relative group w-full md:w-80">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
           <input 
             type="text" 
             placeholder="Tìm bài giảng, tên môn..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-xl shadow-slate-200/20"
           />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]" />
           ))}
        </div>
      ) : allLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {allLessons.map((lesson) => (
             <motion.div 
               key={lesson.id}
               whileHover={{ y: -5 }}
               className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-between space-y-6"
             >
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                        lesson.fileType === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                         {lesson.fileType === 'video' ? <Play size={24} /> : <File size={24} />}
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{lesson.duration || 'N/A'}</span>
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-slate-900 line-clamp-1">{lesson.title}</h3>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{lesson.courseName}</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold">12 giờ trước</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.location.href = `/elearning/course/${lesson.courseId}`}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                         <Monitor size={18} />
                      </button>
                      <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                         <Download size={16} className="inline mr-2" /> Tải về
                      </button>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      ) : (
        <div className="py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
           <BookOpen size={48} className="mx-auto text-slate-200" />
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không tìm thấy bài giảng nào</p>
        </div>
      )}

    </div>
  );
};

export default Lectures;
