import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Video, 
  MessageSquare, 
  Award, 
  Users, 
  Plus, 
  Play,
  File,
  CheckCircle,
  Clock,
  ArrowLeft,
  X,
  Trash2,
  Search,
  Eye,
  Lock,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { getAssetBaseURL } from '../../api/axios';

const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();
  const [activeTab, setActiveTab] = useState('lessons');
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmissionListModalOpen, setIsSubmissionListModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState<any>(null);

  // Form states
  const [newLesson, setNewLesson] = useState({ title: '', content: '', order: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', maxPoints: 10 });
  const [newExam, setNewExam] = useState({ 
    title: '', 
    description: '',
    startTime: '', 
    duration: 60, 
    shuffle: false,
    questions: [] as any[]
  });
  const [examModalTab, setExamModalTab] = useState<'info' | 'questions'>('info');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');

  // Student management states
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollPassword, setEnrollPassword] = useState('');
  const [courseSettings, setCourseSettings] = useState({ enrollKey: '', name: '', description: '' });

  useEffect(() => {
    fetchCourseDetail();
    if (role !== 'STUDENT') {
      fetchRegistrations();
      fetchStudents();
    }
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      const res = await api.get(`/elearning/courses/${id}`);
      setCourse(res.data);
    } catch (error) {
      console.error('Failed to fetch course detail', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await api.get(`/elearning/courses/${id}/registrations`);
      setRegistrations(res.data);
    } catch (error) {
      console.error('Failed to fetch registrations', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setAllStudents(res.data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  };

  const enrollStudent = async (studentId: string) => {
    try {
      await api.post('/elearning/enroll', { courseId: id, studentId });
      toast.success('Đã ghi danh sinh viên');
      fetchRegistrations();
    } catch (error) {
      toast.error('Không thể ghi danh sinh viên');
    }
  };

  const removeStudent = async (registrationId: number) => {
    if (!window.confirm('Xóa sinh viên khỏi lớp học này?')) return;
    try {
      await api.delete(`/elearning/registrations/${registrationId}`);
      toast.success('Đã xóa sinh viên');
      fetchRegistrations();
    } catch (error) {
      toast.error('Không thể xóa sinh viên');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Vui lòng chọn file bài giảng');
      return;
    }

    const formData = new FormData();
    formData.append('title', newLesson.title);
    formData.append('courseId', String(id));
    formData.append('file', selectedFile);
    formData.append('order', String(newLesson.order));
    if (newLesson.content) formData.append('content', newLesson.content);

    try {
      await api.post('/elearning/lessons', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Đã thêm bài giảng');
      setIsLessonModalOpen(false);
      fetchCourseDetail();
      setNewLesson({ title: '', content: '', order: 0 });
      setSelectedFile(null);
    } catch (error) {
      toast.error('Không thể thêm bài giảng');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/elearning/assignments', { ...newAssignment, courseId: Number(id) });
      toast.success('Đã giao bài tập');
      setIsAssignmentModalOpen(false);
      fetchCourseDetail();
      setNewAssignment({ title: '', description: '', dueDate: '', maxPoints: 10 });
    } catch (error) {
      toast.error('Không thể tạo bài tập');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/elearning/exams', { ...newExam, courseId: Number(id) });
      toast.success('Đã thiết lập kỳ thi');
      setIsExamModalOpen(false);
      fetchCourseDetail();
      setNewExam({ 
        title: '', 
        description: '',
        startTime: '', 
        duration: 60, 
        shuffle: false,
        questions: []
      });
      setExamModalTab('info');
    } catch (error) {
      toast.error('Không thể tạo kỳ thi');
    }
  };

  const addQuestion = () => {
    setNewExam({
      ...newExam,
      questions: [
        ...newExam.questions,
        {
          question: '',
          type: 'MULTIPLE_CHOICE',
          points: 1,
          options: [
            { content: '', isCorrect: true },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
          ]
        }
      ]
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...newExam.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setNewExam({ ...newExam, questions: updatedQuestions });
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
    const updatedQuestions = [...newExam.questions];
    const updatedOptions = [...updatedQuestions[qIndex].options];
    
    if (field === 'isCorrect' && value === true) {
      // Ensure only one correct answer for multiple choice
      updatedOptions.forEach((opt, idx) => opt.isCorrect = idx === oIndex);
    } else {
      updatedOptions[oIndex] = { ...updatedOptions[oIndex], [field]: value };
    }
    
    updatedQuestions[qIndex].options = updatedOptions;
    setNewExam({ ...newExam, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = newExam.questions.filter((_, i) => i !== index);
    setNewExam({ ...newExam, questions: updatedQuestions });
  };

  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/elearning/exams/import-word', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewExam({
        ...newExam,
        questions: [...newExam.questions, ...res.data]
      });
      toast.success(`Đã nhập ${res.data.length} câu hỏi thành công`);
    } catch (error) {
      toast.error('Không thể xử lý tệp Word. Vui lòng kiểm tra lại định dạng.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionFile && !submissionContent) {
      toast.error('Vui lòng tải file hoặc nhập nội dung bài nộp');
      return;
    }

    const formData = new FormData();
    formData.append('assignmentId', activeAssignment.id);
    if (submissionFile) formData.append('file', submissionFile);
    if (submissionContent) formData.append('content', submissionContent);

    try {
      await api.post('/elearning/assignments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Nộp bài thành công');
      setIsSubmitModalOpen(false);
      fetchCourseDetail();
      setSubmissionFile(null);
      setSubmissionContent('');
    } catch (error) {
      toast.error('Không thể nộp bài tập');
    }
  };

  const handleGradeSubmission = async (submissionId: number, grade: number, feedback: string) => {
    try {
      await api.patch(`/elearning/submissions/${submissionId}/grade`, { grade, feedback });
      toast.success('Đã cập nhật điểm');
      fetchCourseDetail();
    } catch (error) {
      toast.error('Không thể cập nhật điểm');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/elearning/course/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Đã sao chép liên kết khóa học');
  };

  const handleEnrollSelf = async () => {
    try {
      await api.post('/elearning/enroll', { 
        courseId: id,
        password: enrollPassword 
      });
      toast.success('Đã tham gia khóa học thành công!');
      fetchCourseDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tham gia khóa học');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await api.put(`/elearning/courses/${id}`, courseSettings);
      toast.success('Đã cập nhật cài đặt khóa học');
      fetchCourseDetail();
    } catch (error) {
      toast.error('Không thể cập nhật cài đặt');
    }
  };

  useEffect(() => {
    if (course) {
      setCourseSettings({
        enrollKey: course.enrollKey || '',
        name: course.name,
        description: course.description || ''
      });
    }
  }, [course]);

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: BookOpen },
    { id: 'lessons', label: 'Bài giảng', icon: Video },
    { id: 'assignments', label: 'Bài tập', icon: FileText },
    { id: 'exams', label: 'Thi online', icon: Award },
    { id: 'discussion', label: 'Thảo luận', icon: MessageSquare },
    { id: 'students', label: 'Sinh viên', icon: Users, roles: ['LECTURER', 'QTV'] },
    { id: 'settings', label: 'Cài đặt', icon: Settings, roles: ['LECTURER', 'QTV'] },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-slate-900">Không tìm thấy khóa học</h2>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-24 animate-fade-up space-y-8">
      
      {/* Navigation & Header Section */}
      <div className="sticky top-0 z-20 bg-[#f8fafc]/80 backdrop-blur-md pt-4 pb-2 px-4 -mx-4 md:static md:bg-transparent md:p-0 md:m-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
             <button 
               onClick={() => navigate(-1)}
               className="group flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all active:scale-95"
             >
               <div className="h-7 w-7 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-indigo-50 transition-colors">
                 <ArrowLeft size={14} />
               </div>
               Quay lại Dashboard
             </button>
             <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{course.subject?.code}</p>
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{course.name}</h1>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             {role !== 'STUDENT' ? (
               <>
                 <button 
                   onClick={handleCopyLink}
                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
                 >
                    <Plus size={14} /> Link ghi danh
                 </button>
                 <button 
                   onClick={() => setIsEnrollModalOpen(true)}
                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                 >
                    <Users size={14} /> Ghi danh
                 </button>
               </>
             ) : !course.isRegistered && (
               <button 
                 onClick={handleEnrollSelf}
                 className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-300 hover:bg-indigo-700 hover:scale-105 transition-all active:scale-95"
               >
                  <Plus size={18} /> Tham gia khóa học
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Course Hero Visual */}
      <div className="relative h-48 md:h-80 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 group">
        <img 
          src={course.image || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1200&auto=format&fit=crop'} 
          alt={course.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full">
           <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                 <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-black">GV</div>
                 <span className="text-[10px] font-bold">{course.teacher?.name}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                 <Users size={12} />
                 <span className="text-[10px] font-bold">{course.subject?._count?.registrations || 0} Học viên</span>
              </div>
           </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      {(role !== 'STUDENT' || course.isRegistered) && (
        <div className="sticky top-[80px] md:static z-20 -mx-4 px-4 pb-2 md:m-0 md:p-0">
          <div className="flex flex-row flex-nowrap items-center gap-0.5 md:gap-1.5 p-1 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/10 transition-all overflow-hidden">
            {tabs.filter(t => !t.roles || t.roles.includes(role || '')).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-1 py-2.5 sm:px-6 sm:py-3.5 rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={14} className="sm:size-4" />
                <span className="text-[7px] min-[380px]:text-[8px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest whitespace-nowrap overflow-hidden text-ellipsis w-full text-center sm:w-auto">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {role === 'STUDENT' && !course.isRegistered ? (
             <div className="bg-white p-12 md:p-20 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 text-center space-y-8">
                <div className="h-24 w-24 md:h-32 md:w-32 bg-indigo-50 text-indigo-600 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center mx-auto shadow-xl shadow-indigo-100">
                   <BookOpen size={48} className="md:w-16 md:h-16" />
                </div>
                <div className="space-y-4">
                   <h2 className="text-2xl md:text-3xl font-black text-slate-900">Khám phá kiến thức mới!</h2>
                   <p className="text-slate-500 font-bold text-sm max-w-md mx-auto leading-relaxed">Hãy tham gia khóa học để bắt đầu hành trình chinh phục môn học này cùng giảng viên và bạn bè.</p>
                   
                   {course.hasEnrollKey && (
                     <div className="max-w-xs mx-auto space-y-3 pt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left ml-1">Mật khẩu ghi danh</label>
                        <div className="relative">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                           <input 
                             type="password" 
                             placeholder="Nhập mật khẩu..." 
                             value={enrollPassword}
                             onChange={e => setEnrollPassword(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:bg-white rounded-2xl px-12 py-4 font-bold text-sm outline-none transition-all shadow-sm"
                           />
                        </div>
                     </div>
                   )}
                </div>
                <button 
                  onClick={handleEnrollSelf}
                  className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                >
                   Bắt đầu ngay
                </button>
             </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6"
                >
                   <h3 className="text-xl font-black text-slate-900">Về khóa học này</h3>
                   <div className="prose prose-slate max-w-none">
                      <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                        {course.description || "Chưa có mô tả chi tiết cho khóa học này."}
                      </p>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6">
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase">Bài giảng</p>
                         <p className="text-xl font-black text-slate-900">{course.lessons?.length || 0}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase">Bài tập</p>
                         <p className="text-xl font-black text-slate-900">{course.assignments?.length || 0}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase">Kỳ thi</p>
                         <p className="text-xl font-black text-slate-900">{course.exams?.length || 0}</p>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'lessons' && (
                <motion.div 
                  key="lessons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                   <div className="flex items-center justify-between px-2">
                      <h3 className="text-lg font-black text-slate-900">Bài học ({course.lessons?.length || 0})</h3>
                      {role !== 'STUDENT' && (
                        <button 
                          onClick={() => setIsLessonModalOpen(true)}
                          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                           <Plus size={14} /> Thêm bài mới
                        </button>
                      )}
                   </div>
                   
                   <div className="space-y-3">
                      {course.lessons?.length > 0 ? course.lessons.map((lesson: any, index: number) => (
                        <div 
                          key={lesson.id} 
                          onClick={() => {
                            const url = lesson.fileUrl.startsWith('http') 
                              ? lesson.fileUrl 
                              : `${getAssetBaseURL()}${lesson.fileUrl}`;
                            window.open(url, '_blank');
                          }}
                          className={`cursor-pointer group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-600 hover:shadow-blue-600/5 active:scale-[0.98] transition-all ${!lesson.isVisible ? 'opacity-60' : ''}`}
                        >
                           <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                 <div className={`h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center text-lg font-black ${
                                   lesson.fileType === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                                 }`}>
                                    {lesson.fileType === 'video' ? <Play size={20} fill="currentColor" /> : <File size={20} />}
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className="text-sm font-black text-slate-900 truncate">{lesson.title}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] font-black text-slate-400 uppercase px-1.5 py-0.5 bg-slate-50 rounded">Mục {index + 1}</span>
                                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">• {lesson.duration || '0'} phút</span>
                                    </div>
                                 </div>
                              </div>
                              <button 
                                onClick={() => {
                                  const url = lesson.fileUrl.startsWith('http') 
                                    ? lesson.fileUrl 
                                    : `${getAssetBaseURL()}${lesson.fileUrl}`;
                                  window.open(url, '_blank');
                                }}
                                className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm group-hover:scale-110"
                              >
                                 <Eye size={18} />
                              </button>
                           </div>
                        </div>
                      )) : (
                        <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Không có dữ liệu bài giảng</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'assignments' && (
                <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h3 className="text-lg font-black text-slate-900">Bài tập & Thử thách</h3>
                      {role !== 'STUDENT' && (
                        <button 
                          onClick={() => setIsAssignmentModalOpen(true)}
                          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                           <Plus size={14} /> Giao bài tập
                        </button>
                      )}
                   </div>
                   <div className="space-y-4">
                      {course.assignments?.length > 0 ? course.assignments.map((assignment: any) => (
                        <div key={assignment.id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-lg hover:shadow-slate-200/20 transition-all group">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-2">
                                 <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{assignment.title}</h4>
                                 <div className="flex items-center gap-3">
                                   <div className="flex items-center gap-1.5 text-rose-500">
                                     <Clock size={12} />
                                     <p className="text-[10px] font-black uppercase tracking-tight">Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')} {new Date(assignment.dueDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                                   </div>
                                 </div>
                              </div>
                               <div className={`w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                 role === 'STUDENT' 
                                   ? (assignment.submissions?.[0] ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100')
                                   : 'bg-indigo-50 text-indigo-600'
                               }`}>
                                  {role === 'STUDENT' 
                                    ? (assignment.submissions?.[0] ? '✓ Đã hoàn thành' : '! Chưa nộp bài')
                                    : `${assignment.submissions?.length || 0} bài đã nộp`}
                               </div>
                           </div>
                           <p className="text-sm font-bold text-slate-500 leading-relaxed line-clamp-3">{assignment.description}</p>
                           <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-slate-400 uppercase">Thang điểm</span>
                                   <span className="text-sm font-black text-slate-900">{assignment.maxPoints}</span>
                                 </div>
                              </div>
                               <button 
                                onClick={() => {
                                  if (role === 'STUDENT') {
                                    if (assignment.submissions?.[0]) {
                                      const sub = assignment.submissions[0];
                                      const url = sub.fileUrl.startsWith('http') 
                                        ? sub.fileUrl 
                                        : `${getAssetBaseURL()}${sub.fileUrl}`;
                                      window.open(url, '_blank');
                                    } else {
                                      setActiveAssignment(assignment);
                                      setIsSubmitModalOpen(true);
                                    }
                                  } else {
                                    setSelectedAssignmentForSubmissions(assignment);
                                    setIsSubmissionListModalOpen(true);
                                  }
                                }}
                                className="px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                              >
                                 {role === 'STUDENT' 
                                   ? (assignment.submissions?.[0] ? 'Xem lại bài nộp' : 'Nộp bài ngay')
                                   : 'Quản lý bài nộp'}
                              </button>
                           </div>
                        </div>
                      )) : (
                        <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chưa có bài tập nào được giao</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'exams' && (
                <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h3 className="text-lg font-black text-slate-900">Kỳ thi trực tuyến</h3>
                      {role !== 'STUDENT' && (
                        <button 
                          onClick={() => setIsExamModalOpen(true)}
                          className="flex items-center gap-2 px-5 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                           <Plus size={14} /> Tạo kỳ thi
                        </button>
                      )}
                   </div>
                   <div className="space-y-4">
                      {course.exams?.length > 0 ? course.exams.map((exam: any) => (
                        <div key={exam.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-6 hover:shadow-md transition-all">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                 <Award size={24} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-slate-900">{exam.title}</h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian: {exam.duration} phút</p>
                              </div>
                           </div>
                           <button 
                            onClick={() => navigate(`/elearning/exam/${exam.id}`)}
                            className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                           >
                              Vào thi
                           </button>
                        </div>
                      )) : (
                        <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chưa có kỳ thi nào</p>
                        </div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'discussion' && (
                <motion.div key="discussion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-12 bg-white rounded-3xl border border-slate-100 text-center">
                   <MessageSquare size={48} className="mx-auto mb-4 text-slate-200" />
                   <h3 className="text-sm font-black text-slate-900">Tính năng thảo luận đang được phát triển</h3>
                   <p className="text-xs font-bold text-slate-400 mt-2">Tính năng này sẽ sớm ra mắt trong các phiên bản tiếp theo.</p>
                </motion.div>
              )}

              {activeTab === 'students' && (
                <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h3 className="text-lg font-black text-slate-900">Danh sách học viên ({registrations.length})</h3>
                   </div>
                   <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học viên</th>
                               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">MSSV</th>
                               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tham gia</th>
                               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {registrations.map((reg: any) => (
                              <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                                          {reg.student?.name?.charAt(0)}
                                       </div>
                                       <span className="text-sm font-black text-slate-900">{reg.student?.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-xs font-bold text-slate-500">{reg.student?.student_code}</td>
                                 <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(reg.enrolledAt).toLocaleDateString('vi-VN')}</td>
                                 <td className="px-6 py-4 text-right">
                                    <button onClick={() => removeStudent(reg.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                       <Trash2 size={16} />
                                    </button>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                      {registrations.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest opacity-50">Chưa có học viên nào</div>
                      )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                   <h3 className="text-lg font-black text-slate-900">Cài đặt khóa học</h3>
                   <div className="space-y-6 max-w-xl">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên hiển thị</label>
                         <input 
                           type="text" 
                           value={courseSettings.name}
                           onChange={e => setCourseSettings({...courseSettings, name: e.target.value})}
                           className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả khóa học</label>
                         <textarea 
                           rows={4}
                           value={courseSettings.description}
                           onChange={e => setCourseSettings({...courseSettings, description: e.target.value})}
                           className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all resize-none" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu ghi danh (Tùy chọn)</label>
                         <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="text" 
                              value={courseSettings.enrollKey}
                              onChange={e => setCourseSettings({...courseSettings, enrollKey: e.target.value})}
                              placeholder="Để trống nếu không yêu cầu mật khẩu"
                              className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-12 py-3.5 font-bold text-sm outline-none transition-all" 
                            />
                         </div>
                      </div>
                      <button 
                        onClick={handleUpdateSettings}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                      >
                         Lưu thay đổi
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Course Info Sidebar */}
        <div className="space-y-6">
           <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-8 sticky top-24">
              <div className="space-y-5">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ cá nhân</h3>
                    <span className="text-sm font-black text-indigo-600">{course.progress}%</span>
                 </div>
                 <div className="relative pt-1">
                    <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 rounded-full"
                       />
                    </div>
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 text-center italic">Bạn cần hoàn thành thêm {100 - course.progress}% để nhận chứng chỉ.</p>
              </div>

              <div className="space-y-5 pt-6 border-t border-slate-50">
                 <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Clock size={16} />
                       </div>
                       <span className="text-xs font-bold text-slate-600">Thời lượng</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">45 Giờ</span>
                 </div>
                 <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                          <Award size={16} />
                       </div>
                       <span className="text-xs font-bold text-slate-600">Chứng nhận</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600">Có</span>
                 </div>
                 <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <BookOpen size={16} />
                       </div>
                       <span className="text-xs font-bold text-slate-600">Mức độ</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">Cơ bản</span>
                 </div>
              </div>

              <div className="pt-2">
                 <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                    Tiếp tục bài học
                 </button>
              </div>
           </div>

           <div className="bg-indigo-600 rounded-[3rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare size={100} /></div>
              <h3 className="text-sm font-black uppercase tracking-widest relative z-10">Hỗ trợ học tập</h3>
              <p className="text-xs font-medium text-indigo-100 relative z-10 leading-relaxed">Bạn gặp khó khăn trong quá trình học tập? Hãy đặt câu hỏi trong mục thảo luận nhé!</p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest relative z-10 hover:bg-indigo-50 transition-all">Đặt câu hỏi ngay</button>
           </div>
        </div>
      </div>

      {/* Lesson Modal */}
      <AnimatePresence>
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLessonModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-blue-600 p-8 text-white flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Thêm bài giảng mới</h2>
                <button onClick={() => setIsLessonModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateLesson} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bài giảng</label>
                  <input type="text" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File bài giảng (Video/PDF/Slide)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                    />
                    <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/30 rounded-2xl px-5 py-8 transition-all flex flex-col items-center justify-center gap-3">
                       <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                          <Plus size={24} />
                       </div>
                       <div className="text-center">
                          <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                            {selectedFile ? selectedFile.name : 'Nhấp để chọn hoặc kéo thả file'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">Hỗ trợ MP4, PDF, PPTX...</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả bài giảng (Tùy chọn)</label>
                  <textarea 
                    value={newLesson.content} 
                    onChange={e => setNewLesson({...newLesson, content: e.target.value})} 
                    className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all resize-none" 
                    rows={3}
                  />
                </div>
                
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all mt-4">Xác nhận thêm</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assignment Modal */}
      <AnimatePresence>
        {isAssignmentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignmentModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Tạo bài tập mới</h2>
                <button onClick={() => setIsAssignmentModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateAssignment} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bài tập</label>
                  <input type="text" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả bài tập</label>
                  <textarea rows={3} value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hạn nộp</label>
                    <input type="datetime-local" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Điểm tối đa</label>
                    <input type="number" value={newAssignment.maxPoints} onChange={e => setNewAssignment({...newAssignment, maxPoints: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all mt-4">Xác nhận tạo</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exam Modal */}
      <AnimatePresence>
        {isExamModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExamModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-rose-600 p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black tracking-tight">Thiết lập kỳ thi mới</h2>
                  <button onClick={() => setIsExamModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setExamModalTab('info')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${examModalTab === 'info' ? 'bg-white text-rose-600' : 'bg-rose-700/50 text-white hover:bg-rose-700'}`}
                  >
                    Thông tin chung
                  </button>
                  <button 
                    onClick={() => setExamModalTab('questions')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${examModalTab === 'questions' ? 'bg-white text-rose-600' : 'bg-rose-700/50 text-white hover:bg-rose-700'}`}
                  >
                    Câu hỏi ({newExam.questions.length})
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateExam} className="p-8 space-y-6 flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar">
                {examModalTab === 'info' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề kỳ thi</label>
                      <input type="text" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả (Tùy chọn)</label>
                      <textarea value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all resize-none" rows={2} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian bắt đầu</label>
                        <input type="datetime-local" value={newExam.startTime} onChange={e => setNewExam({...newExam, startTime: e.target.value})} className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian thi (phút)</label>
                        <input type="number" value={newExam.duration} onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-transparent focus:border-rose-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10 border-b border-slate-50 mb-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách câu hỏi</p>
                       <div className="flex items-center gap-2">
                          <input 
                            type="file" 
                            id="wordImport" 
                            hidden 
                            accept=".docx"
                            onChange={handleImportWord}
                          />
                          <button 
                            type="button"
                            onClick={() => document.getElementById('wordImport')?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                          >
                             <FileText size={14} /> Nhập từ Word
                          </button>
                          <button 
                            type="button"
                            onClick={addQuestion}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all"
                          >
                             <Plus size={14} /> Thêm câu hỏi
                          </button>
                       </div>
                    </div>

                    <div className="space-y-10">
                       {newExam.questions.map((q, qIndex) => (
                         <div key={qIndex} className="p-6 bg-slate-50 rounded-[2rem] relative group border border-transparent hover:border-rose-100 transition-all">
                            <button 
                              type="button"
                              onClick={() => removeQuestion(qIndex)}
                              className="absolute -top-3 -right-3 h-8 w-8 bg-white text-rose-500 rounded-full shadow-lg border border-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            >
                               <X size={16} />
                            </button>

                            <div className="space-y-4">
                               <div className="flex items-center gap-3 mb-2">
                                  <span className="h-6 w-6 bg-rose-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black">#{qIndex + 1}</span>
                                  <input 
                                    type="text" 
                                    placeholder="Nhập nội dung câu hỏi..."
                                    value={q.question}
                                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                    className="flex-1 bg-white border border-transparent focus:border-rose-500 rounded-xl px-4 py-2.5 font-bold text-sm outline-none transition-all"
                                  />
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {q.options.map((opt: any, oIndex: number) => (
                                    <div key={oIndex} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100">
                                       <button
                                         type="button"
                                         onClick={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                                         className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                       >
                                          <CheckCircle size={14} />
                                       </button>
                                       <input 
                                         type="text" 
                                         placeholder={`Lựa chọn ${String.fromCharCode(65 + oIndex)}`}
                                         value={opt.content}
                                         onChange={(e) => updateOption(qIndex, oIndex, 'content', e.target.value)}
                                         className="flex-1 bg-transparent border-none font-bold text-xs outline-none"
                                       />
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                       ))}

                       {newExam.questions.length === 0 && (
                         <div className="text-center py-10 opacity-40">
                            <Plus size={40} className="mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Chưa có câu hỏi nào</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tất cả thông tin sẽ được lưu khi nhấn xác nhận</p>
                   <button type="submit" className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all">Hoàn tất & Lưu</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assignment Submit Modal */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSubmitModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Nộp bài tập</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{activeAssignment?.title}</p>
                </div>
                <button onClick={() => setIsSubmitModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmitAssignment} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File bài nộp</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      onChange={e => setSubmissionFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/30 rounded-2xl px-5 py-8 transition-all flex flex-col items-center justify-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                          <Plus size={20} />
                       </div>
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          {submissionFile ? submissionFile.name : 'Chọn file bài nộp'}
                       </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú/Nội dung (Tùy chọn)</label>
                  <textarea 
                    value={submissionContent} 
                    onChange={e => setSubmissionContent(e.target.value)} 
                    className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 font-bold text-sm outline-none transition-all resize-none" 
                    rows={4}
                    placeholder="Nhập ghi chú hoặc nội dung bài nộp nếu có..."
                  />
                </div>
                
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-blue-600 transition-all mt-4">Xác nhận nộp bài</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submission List Modal (For Teachers) */}
      <AnimatePresence>
        {isSubmissionListModalOpen && selectedAssignmentForSubmissions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSubmissionListModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Quản lý bài nộp</h2>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">{selectedAssignmentForSubmissions.title}</p>
                </div>
                <button onClick={() => setIsSubmissionListModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {selectedAssignmentForSubmissions.submissions?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedAssignmentForSubmissions.submissions.map((sub: any) => (
                      <div key={sub.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black">
                            {sub.student?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{sub.student?.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MSSV: {sub.student?.student_code}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1">Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <button 
                             onClick={() => {
                               const url = sub.fileUrl.startsWith('http') 
                                 ? sub.fileUrl 
                                 : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${sub.fileUrl}`;
                               window.open(url, '_blank');
                             }}
                             className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                           >
                             <Eye size={14} /> Xem bài làm
                           </button>
                           
                           <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border border-slate-200">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Điểm:</span>
                             <input 
                               type="number" 
                               defaultValue={sub.grade || 0}
                               onBlur={(e) => handleGradeSubmission(sub.id, parseFloat(e.target.value), sub.feedback || '')}
                               className="w-12 bg-transparent text-center font-black text-indigo-600 outline-none"
                               max={selectedAssignmentForSubmissions.maxPoints}
                               min={0}
                             />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-40">
                    <Users size={48} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Chưa có sinh viên nào nộp bài</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enroll Student Modal */}
      <AnimatePresence>
        {isEnrollModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEnrollModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-emerald-600 p-8 text-white flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-black tracking-tight">Ghi danh sinh viên</h2>
                <button onClick={() => setIsEnrollModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tìm tên hoặc MSSV..." 
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-12 py-3.5 font-bold text-sm outline-none transition-all" 
                  />
                </div>
                
                <div className="space-y-3">
                  {allStudents
                    .filter(s => 
                      !registrations.some(r => r.studentId === s.id) &&
                      (s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || s.student_code.includes(studentSearchQuery))
                    )
                    .slice(0, 10)
                    .map(student => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="text-sm font-black text-slate-900">{student.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.student_code}</p>
                        </div>
                        <button 
                          onClick={() => enrollStudent(student.id)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                        >
                          Ghi danh
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseDetail;

