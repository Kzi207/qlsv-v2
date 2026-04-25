import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Search, 
  Eye, 
  Trash2, 
  BookOpen, 
  User, 
  Calendar, 
  AlertCircle, 
  Plus, 
  X, 
  FileText, 
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../api/axios';
import ELearningRightPanel from '../../../components/elearning/ELearningRightPanel';
import { toast } from 'react-hot-toast';

const AdminAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  
  const [newAssignment, setNewAssignment] = useState({
    courseId: '',
    title: '',
    description: '',
    fileUrl: '',
    dueDate: '',
    maxPoints: 10,
    allowLate: false
  });

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchAssignments = async () => {
    try {
      // We need a backend endpoint for all assignments or fetch from courses
      const res = await api.get('/elearning/courses');
      const coursesData = res.data;
      const allAs = coursesData.flatMap((c: any) => 
        (c.assignments || []).map((a: any) => ({ ...a, course: c }))
      );
      setAssignments(allAs);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
      toast.error('Không thể tải danh sách bài tập');
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

  const deleteAssignment = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
    try {
      await api.delete(`/elearning/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success('Đã xóa bài tập');
    } catch (error) {
      toast.error('Không thể xóa bài tập');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.courseId || !newAssignment.title || !newAssignment.dueDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      await api.post('/elearning/assignments', newAssignment);
      setIsModalOpen(false);
      setNewAssignment({
        courseId: '',
        title: '',
        description: '',
        fileUrl: '',
        dueDate: '',
        maxPoints: 10,
        allowLate: false
      });
      toast.success('Đã thêm bài tập mới');
      fetchAssignments();
    } catch (error) {
      toast.error('Không thể thêm bài tập');
    }
  };

  const filteredAssignments = assignments.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.course?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'all' || item.courseId.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const coursesList = Array.from(new Set(assignments.map(a => JSON.stringify({ id: a.course?.id, name: a.course?.name }))))
                       .filter(s => JSON.parse(s).id)
                       .map(s => JSON.parse(s));

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                 <PenTool size={12} /> Quản lý học thuật
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý bài tập</h1>
              <p className="text-slate-500 font-bold text-sm">Giám sát và điều phối bài tập trên toàn hệ thống.</p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus size={18} /> Thêm bài tập
            </button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm tiêu đề, khóa học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-xl shadow-slate-200/20 w-full"
                />
             </div>
             <select 
               value={filterCourse}
               onChange={(e) => setFilterCourse(e.target.value)}
               className="px-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-xl shadow-slate-200/20 text-slate-600 min-w-[200px]"
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
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Bài tập</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Khóa học & Giảng viên</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Hạn chót</th>
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
                    ) : filteredAssignments.length > 0 ? (
                      filteredAssignments.map((item) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                                <FileText size={20} />
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 leading-tight">{item.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                    <Users size={12} /> {(item.submissions || []).length} bài nộp
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                <BookOpen size={14} className="text-indigo-500" /> {item.course?.name || 'N/A'}
                              </p>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <User size={14} /> {item.course?.teacher?.name || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-widest">
                                <Clock size={12} className="text-rose-500" /> 
                                {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                {new Date(item.dueDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => deleteAssignment(item.id)}
                                className="p-2.5 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                title="Xóa bài tập"
                              >
                                <Trash2 size={18} />
                              </button>
                              <a 
                                href={item.fileUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2.5 bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                                title="Xem đính kèm"
                              >
                                <ExternalLink size={18} />
                              </a>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="space-y-4">
                            <AlertCircle size={48} className="mx-auto text-slate-200" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không tìm thấy bài tập nào</p>
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

      {/* Add Assignment Modal */}
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
              <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Thêm bài tập mới</h2>
                  <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Giao nhiệm vụ cho sinh viên</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khóa học</label>
                  <select 
                    value={newAssignment.courseId}
                    onChange={e => setNewAssignment({...newAssignment, courseId: e.target.value})}
                    className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                  >
                    <option value="">Chọn khóa học...</option>
                    {allCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bài tập</label>
                  <input 
                    type="text" 
                    placeholder="VD: Báo cáo giữa kỳ"
                    value={newAssignment.title}
                    onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                    className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hạn chót</label>
                    <input 
                      type="datetime-local" 
                      value={newAssignment.dueDate}
                      onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Điểm tối đa</label>
                    <input 
                      type="number" 
                      value={newAssignment.maxPoints}
                      onChange={e => setNewAssignment({...newAssignment, maxPoints: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đường dẫn tài liệu</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    value={newAssignment.fileUrl}
                    onChange={e => setNewAssignment({...newAssignment, fileUrl: e.target.value})}
                    className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={newAssignment.allowLate}
                      onChange={e => setNewAssignment({...newAssignment, allowLate: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${newAssignment.allowLate ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newAssignment.allowLate ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Cho phép nộp muộn</span>
                </label>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-2"
                >
                  Xác nhận giao bài tập
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAssignments;
