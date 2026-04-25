import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  EyeOff, 
  Trash2, 
  ExternalLink,
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  Plus,
  X,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../api/axios';
import ELearningRightPanel from '../../../components/elearning/ELearningRightPanel';
import { toast } from 'react-hot-toast';

const AdminLessons: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  
  const [newLesson, setNewLesson] = useState({
    courseId: '',
    title: '',
    content: '',
    fileUrl: '',
    fileType: 'video',
    duration: '',
    order: 0
  });

  useEffect(() => {
    fetchLessons();
    fetchCourses();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await api.get('/elearning/lessons');
      setLessons(res.data);
    } catch (error) {
      console.error('Failed to fetch lessons', error);
      toast.error('Không thể tải danh sách bài giảng');
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

  const toggleVisibility = async (id: number, current: boolean) => {
    try {
      await api.patch(`/elearning/lessons/${id}/visibility`, { isVisible: !current });
      setLessons(prev => prev.map(l => l.id === id ? { ...l, isVisible: !current } : l));
      toast.success(current ? 'Đã ẩn bài giảng' : 'Đã hiện bài giảng');
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const deleteLesson = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài giảng này?')) return;
    try {
      await api.delete(`/elearning/lessons/${id}`);
      setLessons(prev => prev.filter(l => l.id !== id));
      toast.success('Đã xóa bài giảng');
    } catch (error) {
      toast.error('Không thể xóa bài giảng');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.courseId || !newLesson.title) {
      toast.error('Vui lòng chọn khóa học và nhập tiêu đề');
      return;
    }

    try {
      const res = await api.post('/elearning/lessons', newLesson);
      setLessons([res.data, ...lessons]);
      setIsModalOpen(false);
      setNewLesson({
        courseId: '',
        title: '',
        content: '',
        fileUrl: '',
        fileType: 'video',
        duration: '',
        order: 0
      });
      toast.success('Đã thêm bài giảng mới');
      fetchLessons(); // Refresh to get relations
    } catch (error) {
      toast.error('Không thể thêm bài giảng');
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.course?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'all' || lesson.courseId.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const coursesList = Array.from(new Set(lessons.map(l => JSON.stringify({ id: l.course?.id, name: l.course?.name }))))
                       .filter(s => JSON.parse(s).id)
                       .map(s => JSON.parse(s));

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        
        {/* Main Content */}
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                 <Video size={12} /> Hệ thống quản lý nội dung
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý bài giảng</h1>
              <p className="text-slate-500 font-bold text-sm">
                Giám sát và kiểm duyệt toàn bộ bài giảng trên hệ thống E-Learning.
              </p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Plus size={18} /> Thêm bài giảng
            </button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm tiêu đề, khóa học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-xl shadow-slate-200/20 w-full"
                />
             </div>
             <select 
               value={filterCourse}
               onChange={(e) => setFilterCourse(e.target.value)}
               className="px-4 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-xl shadow-slate-200/20 text-slate-600 min-w-[200px]"
             >
               <option value="all">Tất cả khóa học</option>
               {coursesList.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
          </div>

          {/* Lessons List */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Bài giảng</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Khóa học & Giảng viên</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Thông tin</th>
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
                    ) : filteredLessons.length > 0 ? (
                      filteredLessons.map((lesson) => (
                        <motion.tr 
                          key={lesson.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                lesson.fileType === 'video' ? 'bg-rose-50 text-rose-500' :
                                lesson.fileType === 'pdf' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                              }`}>
                                {lesson.fileType === 'video' ? <Video size={20} /> : <FileText size={20} />}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 leading-tight">{lesson.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                    <Calendar size={12} /> {new Date(lesson.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                  {!lesson.isVisible && (
                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                      <EyeOff size={10} /> Đang ẩn
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                <BookOpen size={14} className="text-blue-500" /> {lesson.course?.name || 'N/A'}
                              </p>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <User size={14} /> {lesson.course?.teacher?.name || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {lesson.fileType || 'Link'}
                              </span>
                              {lesson.duration && (
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                  {lesson.duration}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => toggleVisibility(lesson.id, lesson.isVisible)}
                                className={`p-2.5 rounded-xl transition-all ${
                                  lesson.isVisible 
                                  ? 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600' 
                                  : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                }`}
                                title={lesson.isVisible ? "Ẩn bài giảng" : "Hiện bài giảng"}
                              >
                                {lesson.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                              </button>
                              <button 
                                onClick={() => deleteLesson(lesson.id)}
                                className="p-2.5 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                title="Xóa bài giảng"
                              >
                                <Trash2 size={18} />
                              </button>
                              <a 
                                href={lesson.fileUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2.5 bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                                title="Xem nội dung"
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
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không tìm thấy bài giảng nào</p>
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

        {/* Right Sidebar */}
        <div className="hidden lg:block">
           <div className="sticky top-8">
              <ELearningRightPanel role="QTV" />
           </div>
        </div>

      </div>

      {/* Add Lesson Modal */}
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
              <div className="bg-blue-600 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Thêm bài giảng mới</h2>
                  <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Cập nhật nội dung cho khóa học</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateLesson} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn khóa học</label>
                  <select 
                    value={newLesson.courseId}
                    onChange={e => setNewLesson({...newLesson, courseId: e.target.value})}
                    className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                  >
                    <option value="">Chọn khóa học...</option>
                    {allCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bài giảng</label>
                  <input 
                    type="text" 
                    placeholder="VD: Chương 1: Giới thiệu về React"
                    value={newLesson.title}
                    onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                    className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại file</label>
                    <select 
                      value={newLesson.fileType}
                      onChange={e => setNewLesson({...newLesson, fileType: e.target.value})}
                      className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    >
                      <option value="video">Video</option>
                      <option value="pdf">Tài liệu PDF</option>
                      <option value="slide">Slide bài giảng</option>
                      <option value="link">Liên kết ngoài</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời lượng/Số trang</label>
                    <input 
                      type="text" 
                      placeholder="VD: 45:00 hoặc 12 trang"
                      value={newLesson.duration}
                      onChange={e => setNewLesson({...newLesson, duration: e.target.value})}
                      className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đường dẫn File/Link</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="https://..."
                      value={newLesson.fileUrl}
                      onChange={e => setNewLesson({...newLesson, fileUrl: e.target.value})}
                      className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 pr-12 font-bold text-sm outline-none transition-all"
                    />
                    <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98] mt-4"
                >
                  Xác nhận thêm bài giảng
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLessons;
