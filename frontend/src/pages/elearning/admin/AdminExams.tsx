import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Trash2, 
  BookOpen, 
  User, 
  AlertCircle, 
  Plus, 
  X, 
  FileText, 
  Clock,
  Shuffle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../api/axios';
import ELearningRightPanel from '../../../components/elearning/ELearningRightPanel';
import { toast } from 'react-hot-toast';

const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  
  const [newExam, setNewExam] = useState({
    courseId: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 60,
    maxPoints: 10,
    shuffle: true
  });

  useEffect(() => {
    fetchExams();
    fetchCourses();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/elearning/courses');
      const coursesData = res.data;
      const allEs = coursesData.flatMap((c: any) => 
        (c.exams || []).map((e: any) => ({ ...e, course: c }))
      );
      setExams(allEs);
    } catch (error) {
      console.error('Failed to fetch exams', error);
      toast.error('Không thể tải danh sách kỳ thi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/elearning/courses');
      setAllCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses', error);
    }
  };

  const deleteExam = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kỳ thi này?')) return;
    try {
      await api.delete(`/elearning/exams/${id}`);
      setExams(prev => prev.filter(e => e.id !== id));
      toast.success('Đã xóa kỳ thi');
    } catch (error) {
      toast.error('Không thể xóa kỳ thi');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.courseId || !newExam.title || !newExam.startTime || !newExam.endTime) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      await api.post('/elearning/exams', newExam);
      setIsModalOpen(false);
      setNewExam({
        courseId: '',
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        duration: 60,
        maxPoints: 10,
        shuffle: true
      });
      toast.success('Đã tạo kỳ thi mới');
      fetchExams();
    } catch (error) {
      toast.error('Không thể tạo kỳ thi');
    }
  };

  const filteredExams = exams.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.course?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'all' || item.courseId.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const coursesList = Array.from(new Set(exams.map(e => JSON.stringify({ id: e.course?.id, name: e.course?.name }))))
                       .filter(s => JSON.parse(s).id)
                       .map(s => JSON.parse(s));

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                 <Award size={12} /> Khảo thí trực tuyến
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý kỳ thi</h1>
              <p className="text-slate-500 font-bold text-sm">Quản lý ngân hàng câu hỏi và giám sát kết quả thi.</p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-rose-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95"
            >
              <Plus size={18} /> Tạo kỳ thi
            </button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm kỳ thi, khóa học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all shadow-xl shadow-slate-200/20 w-full"
                />
             </div>
             <select 
               value={filterCourse}
               onChange={(e) => setFilterCourse(e.target.value)}
               className="px-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all shadow-xl shadow-slate-200/20 text-slate-600 min-w-[200px]"
             >
               <option value="all">Tất cả khóa học</option>
               {coursesList.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kỳ thi</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Khóa học</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Thời gian</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-8 py-6 h-24 bg-slate-50/30" />
                        </tr>
                      ))
                    ) : filteredExams.length > 0 ? (
                      filteredExams.map((item) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                                <FileText size={20} />
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 leading-tight">{item.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                    <Clock size={12} /> {item.duration} phút
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1 ml-2">
                                    <Activity size={12} /> {item.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                <BookOpen size={14} className="text-rose-500" /> {item.course?.name || 'N/A'}
                              </p>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <User size={14} /> {item.course?.teacher?.name || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-widest">
                                {new Date(item.startTime).toLocaleDateString('vi-VN')}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                {new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => deleteExam(item.id)}
                                className="p-2.5 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                title="Xóa kỳ thi"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button 
                                className="p-2.5 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                title="Quản lý câu hỏi"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="space-y-4">
                            <AlertCircle size={48} className="mx-auto text-slate-200" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không tìm thấy kỳ thi nào</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
           <div className="sticky top-8">
              <ELearningRightPanel role="QTV" />
           </div>
        </div>
      </div>

      {/* Create Exam Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-rose-600 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Tạo kỳ thi mới</h2>
                  <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1">Thiết lập bài thi trực tuyến</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khóa học</label>
                  <select 
                    value={newExam.courseId}
                    onChange={e => setNewExam({...newExam, courseId: e.target.value})}
                    className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                  >
                    <option value="">Chọn khóa học...</option>
                    {allCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên kỳ thi</label>
                  <input 
                    type="text" 
                    placeholder="VD: Kiểm tra cuối kỳ"
                    value={newExam.title}
                    onChange={e => setNewExam({...newExam, title: e.target.value})}
                    className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bắt đầu</label>
                    <input 
                      type="datetime-local" 
                      value={newExam.startTime}
                      onChange={e => setNewExam({...newExam, startTime: e.target.value})}
                      className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kết thúc</label>
                    <input 
                      type="datetime-local" 
                      value={newExam.endTime}
                      onChange={e => setNewExam({...newExam, endTime: e.target.value})}
                      className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian (phút)</label>
                    <input 
                      type="number" 
                      value={newExam.duration}
                      onChange={e => setNewExam({...newExam, duration: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Điểm tối đa</label>
                    <input 
                      type="number" 
                      value={newExam.maxPoints}
                      onChange={e => setNewExam({...newExam, maxPoints: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group py-2">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={newExam.shuffle}
                      onChange={e => setNewExam({...newExam, shuffle: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${newExam.shuffle ? 'bg-rose-600' : 'bg-slate-200'}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newExam.shuffle ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                    <Shuffle size={14} className="text-rose-500" /> Trộn câu hỏi ngẫu nhiên
                  </span>
                </label>

                <button 
                  type="submit"
                  className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-[0.98] mt-2"
                >
                  Xác nhận tạo kỳ thi
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExams;

