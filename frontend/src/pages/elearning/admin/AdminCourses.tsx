import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Book,
  Edit2,
  Trash2,
  Eye,
  X,
  UserCheck,
  Users,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../api/axios';
import ELearningRightPanel from '../../../components/elearning/ELearningRightPanel';
import { toast } from 'react-hot-toast';

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [deleteItem, setDeleteItem] = useState<{id: any, name: string, type: 'course' | 'registration'} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [newCourse, setNewCourse] = useState({
    subjectId: '',
    teacherId: '',
    name: '',
    description: '',
    image: '',
    semesterId: '2023-2024.2'
  });

  useEffect(() => {
    fetchCourses();
    fetchSubjects();
    fetchTeachers();
    fetchAllStudents();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/elearning/courses');
      setCourses(res.data);
    } catch (error) {
      console.error('Failed to fetch courses', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/elearning/subjects');
      setSubjects(res.data);
    } catch (error) {
      console.error('Failed to fetch subjects', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/elearning/teachers');
      setTeachers(res.data);
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await api.get('/students');
      setAllStudents(res.data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  };

  const openStudentManagement = async (course: any) => {
    setSelectedCourse(course);
    setIsStudentModalOpen(true);
    try {
      const res = await api.get(`/elearning/courses/${course.id}/registrations`);
      setRegistrations(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách sinh viên');
    }
  };

   const openCourseModal = (course: any = null) => {
      if (course) {
         setEditingCourse(course);
         setNewCourse({
            subjectId: String(course.subjectId || ''),
            teacherId: String(course.teacherId || ''),
            name: course.name || '',
            description: course.description || '',
            image: course.image || '',
            semesterId: course.semesterId || '2023-2024.2'
         });
      } else {
         setEditingCourse(null);
         setNewCourse({
            subjectId: '',
            teacherId: '',
            name: '',
            description: '',
            image: '',
            semesterId: '2023-2024.2'
         });
      }

      setIsModalOpen(true);
   };

   const closeCourseModal = () => {
      setIsModalOpen(false);
      setEditingCourse(null);
   };

  const enrollStudent = async (studentId: number) => {
    try {
      await api.post('/elearning/enroll', { courseId: selectedCourse.id, studentId });
      toast.success('Đã đăng ký sinh viên vào khóa học');
      const res = await api.get(`/elearning/courses/${selectedCourse.id}/registrations`);
      setRegistrations(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Không thể đăng ký sinh viên');
    }
  };

  const removeRegistration = async (regId: number) => {
    setDeleteItem({ id: regId, name: '', type: 'registration' }); return;
    try {
      await api.delete(`/elearning/registrations/${regId}`);
      setRegistrations(prev => prev.filter(r => r.id !== regId));
      toast.success(' Đã xóa đăng ký');
    } catch (error) {
      toast.error('Không thể xóa đăng ký');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.subjectId || !newCourse.teacherId || !newCourse.name) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
         if (editingCourse) {
            const res = await api.put(`/elearning/courses/${editingCourse.id}`, {
               name: newCourse.name,
               description: newCourse.description,
               image: newCourse.image,
               enrollKey: editingCourse.enrollKey,
               isActive: editingCourse.isActive
            });
            setCourses(prev => prev.map(course => (course.id === editingCourse.id ? res.data : course)));
            toast.success('Cập nhật khóa học thành công!');
         } else {
            const res = await api.post('/elearning/courses', newCourse);
            setCourses([res.data, ...courses]);
            toast.success('Tạo khóa học thành công!');
         }

         closeCourseModal();
         setNewCourse({
            subjectId: '',
            teacherId: '',
            name: '',
            description: '',
            image: '',
            semesterId: '2023-2024.2'
         });
    } catch (error: any) {
         toast.error(error.response?.data?.error || error.response?.data?.message || 'Không thể lưu khóa học');
    }
  };

   const handleDeleteCourse = async (course: any) => {
      setDeleteItem({ id: course.id, name: course.name, type: 'course' }); return;

      try {
         await api.delete(`/elearning/courses/${course.id}`);
         setCourses(prev => prev.filter(item => item.id !== course.id));
         toast.success('Đã xóa khóa học');
      } catch (error: any) {
         toast.error(error.response?.data?.error || error.response?.data?.message || 'Không thể xóa khóa học');
      }
   };

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.subject?.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = allStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 5);


  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    const loadingToast = toast.loading('Đang xử lý...');
    try {
      if (deleteItem.type === 'course') {
        await api.delete(`/elearning/courses/${deleteItem.id}`);
        setCourses(prev => prev.filter(item => item.id !== deleteItem.id));
        toast.success('Đã xóa khóa học thành công', { id: loadingToast });
      } else {
        await api.delete(`/elearning/registrations/${deleteItem.id}`);
        setRegistrations(prev => prev.filter(r => r.id !== deleteItem.id));
        toast.success('Đã xóa sinh viên khỏi lớp', { id: loadingToast });
      }
      setDeleteItem(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Thao tác thất bại', { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const ConfirmModal = () => {
    if (!deleteItem) return null;
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          onClick={() => !isDeleting && setDeleteItem(null)}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-inner rotate-3">
              <AlertTriangle size={40} className="animate-pulse" />
            </div>
            <h3 className="mb-3 text-2xl font-black text-slate-900 uppercase tracking-tight">Xác nhận xóa?</h3>
            <p className="mb-8 text-sm font-medium leading-relaxed text-slate-500">
              Bạn có chắc chắn muốn xóa {deleteItem.type === 'course' ? `khóa học "${deleteItem.name}"` : 'sinh viên này'}? 
              Hành động này sẽ <span className="font-bold text-red-600">vĩnh viễn</span> loại bỏ dữ liệu liên quan.
            </p>
            <div className="flex w-full gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteItem(null)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-2xl bg-red-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-200 transition hover:bg-red-700 hover:shadow-red-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };
  return (
    <>
      <ConfirmModal />
      <div className="max-w-[1600px] mx-auto pb-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <Book size={12} /> Course Management
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Danh sách khóa học</h1>
              <p className="text-slate-500 font-bold text-sm">Quản lý và điều phối các lớp học trực tuyến trên hệ thống.</p>
            </div>

            <div className="flex items-center gap-3">
               <button 
                onClick={() => openCourseModal()}
                className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
               >
                  <Plus size={18} /> Thêm khóa học
               </button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
             <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tất cả môn học ({filteredCourses.length})</h3>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                   <input 
                     type="text" 
                     placeholder="Tìm tên môn, mã môn..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all w-full md:w-80"
                   />
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="px-4 xl:px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa học</th>
                         <th className="px-4 xl:px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giảng viên</th>
                         <th className="px-4 xl:px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tín chỉ</th>
                         <th className="px-4 xl:px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                         <th className="px-4 xl:px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {loading ? (
                         <tr><td colSpan={5} className="px-8 py-20 text-center"><div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                      ) : filteredCourses.length > 0 ? filteredCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-4 xl:px-6 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                    <img src={course.image || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=100&auto=format&fit=crop'} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">{course.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{course.subject?.code}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 xl:px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                    {course.teacher?.name?.charAt(0)}
                                 </div>
                                 <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{course.teacher?.name}</span>
                              </div>
                           </td>
                           <td className="px-4 xl:px-6 py-5 text-xs font-black text-slate-900 text-center">{course.subject?.credits}</td>
                           <td className="px-4 xl:px-6 py-5">
                              <span className={`whitespace-nowrap px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${course.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {course.isActive ? 'Đang mở' : 'Đã đóng'}
                              </span>
                           </td>
                           <td className="px-4 xl:px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-1.5 md:gap-2">
                                 <button 
                                   onClick={() => openStudentManagement(course)}
                                   className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Quản lý sinh viên"
                                 >
                                    <Users size={20} />
                                 </button>
                                 <button 
                                  onClick={() => window.location.href = `/elearning/course/${course.id}`}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Xem chi tiết"
                                 >
                                    <Eye size={20} />
                                 </button>
                                 <button 
                                   onClick={() => openCourseModal(course)}
                                   className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Chỉnh sửa"
                                 >
                                    <Edit2 size={20} />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteCourse(course)}
                                   className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Xóa"
                                 >
                                    <Trash2 size={20} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-4 xl:px-6 py-20 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Không tìm thấy kết quả phù hợp</td></tr>
                      )}
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
      </div>

      {/* Create Course Modal */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                        onClick={closeCourseModal}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
              >
                 <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-blue-600 text-white">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <Plus size={24} />
                       </div>
                       <div>
                          <h2 className="text-xl font-black tracking-tight">{editingCourse ? 'Sửa khóa học hệ thống' : 'Thêm khóa học hệ thống'}</h2>
                          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">{editingCourse ? 'Cập nhật dữ liệu E-Learning' : 'Khởi tạo dữ liệu E-Learning'}</p>
                       </div>
                    </div>
                    <button 
                      onClick={closeCourseModal}
                      className="p-3 hover:bg-white/10 rounded-2xl transition-all"
                    >
                       <X size={24} />
                    </button>
                 </div>

                 <form onSubmit={handleCreateCourse} className="p-10 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn học gốc</label>
                          <select 
                            value={newCourse.subjectId}
                            onChange={(e) => setNewCourse({...newCourse, subjectId: e.target.value})}
                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                          >
                             <option value="">Chọn môn...</option>
                             {subjects.map(sub => (
                               <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giảng viên</label>
                          <select 
                            value={newCourse.teacherId}
                            onChange={(e) => setNewCourse({...newCourse, teacherId: e.target.value})}
                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                          >
                             <option value="">Chọn GV...</option>
                             {teachers.map(t => (
                               <option key={t.id} value={t.id}>{t.name}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên khóa học</label>
                       <input 
                         type="text"
                         placeholder="Tên lớp học trực tuyến..."
                         value={newCourse.name}
                         onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                         className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả</label>
                       <textarea 
                         rows={2}
                         placeholder="Thông tin thêm..."
                         value={newCourse.description}
                         onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                         className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ảnh đại diện (URL)</label>
                       <input 
                         type="text"
                         placeholder="Link ảnh..."
                         value={newCourse.image}
                         onChange={(e) => setNewCourse({...newCourse, image: e.target.value})}
                         className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                       />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-5 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30"
                    >
                       {editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học ngay'}
                    </button>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Student Management Modal */}
      <AnimatePresence>
         {isStudentModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsStudentModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, x: 100 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.95, opacity: 0, x: 100 }}
                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]"
              >
                 {/* Left Panel: Registered Students */}
                 <div className="flex-1 border-r border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-8 bg-slate-50 border-b border-slate-100">
                       <div className="flex items-center gap-3 mb-2">
                          <Users className="text-blue-600" size={20} />
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">Sinh viên đã đăng ký</h2>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Khóa học: <span className="text-blue-600">{selectedCourse?.name}</span>
                       </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                       {registrations.length > 0 ? registrations.map((reg) => (
                         <div key={reg.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                                  {reg.student.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-xs font-black text-slate-900">{reg.student.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{reg.student.student_code} • {reg.student.class_id}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => removeRegistration(reg.id)}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                       )) : (
                         <div className="h-full flex items-center justify-center text-center p-10">
                            <div className="space-y-3">
                               <Users className="mx-auto text-slate-200" size={48} />
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chưa có sinh viên đăng ký</p>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Right Panel: Enroll Students */}
                 <div className="w-full md:w-[380px] bg-white flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Thêm sinh viên mới</h3>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="Mã SV hoặc Họ tên..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                          />
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                       {studentSearch ? (
                         filteredStudents.length > 0 ? filteredStudents.map((student) => {
                            const isEnrolled = registrations.some(r => r.studentId === student.id);
                            return (
                               <div key={student.id} className={`p-4 rounded-2xl border transition-all ${isEnrolled ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-50 hover:border-blue-200 hover:shadow-lg shadow-slate-200/20'}`}>
                                  <div className="flex items-center justify-between mb-3">
                                     <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest rounded-md">{student.student_code}</span>
                                     {isEnrolled && <UserCheck className="text-emerald-500" size={14} />}
                                  </div>
                                  <p className="text-xs font-black text-slate-900 mb-1">{student.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 mb-4">{student.class_id}</p>
                                  
                                  {!isEnrolled && (
                                     <button 
                                       onClick={() => enrollStudent(student.id)}
                                       className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                     >
                                        <UserPlus size={14} /> Đăng ký ngay
                                     </button>
                                  )}
                               </div>
                            );
                         }) : (
                            <div className="p-10 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Không tìm thấy sinh viên</div>
                         )
                       ) : (
                          <div className="p-10 text-center space-y-4">
                             <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
                                <Search className="text-slate-200" size={32} />
                             </div>
                             <p className="text-xs font-bold text-slate-400">Nhập mã số sinh viên hoặc tên để tìm kiếm và đăng ký vào khóa học</p>
                          </div>
                       )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                       <button 
                        onClick={() => setIsStudentModalOpen(false)}
                        className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                       >
                          Đóng quản lý
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </>
  );
};

export default AdminCourses;

