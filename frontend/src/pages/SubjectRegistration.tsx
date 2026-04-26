import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Calendar,
  CreditCard,
  Info,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface RegistrationSubject {
  name?: string;
  code?: string;
  credits?: number;
}

interface RegistrationItem {
  id: number;
  subject?: RegistrationSubject;
}

const SubjectRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelTarget, setCancelTarget] = useState<RegistrationItem | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
       fetchSubjectsForCurriculum();
    }
  }, [selectedSemester]);

  const fetchInitialData = async () => {
    try {
      const [regRes, semRes] = await Promise.all([
        axios.get('/academic/registrations/my'),
        axios.get('/semesters')
      ]);
      setMyRegistrations(regRes.data);
      setSemesters(semRes.data);
      if (semRes.data.length > 0) setSelectedSemester(semRes.data[0].name);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu cơ bản');
    } finally {
    }
  };

  const fetchSubjectsForCurriculum = async () => {
     try {
        const res = await axios.get('/curriculum/my-curriculum');
        // The API returns { major: { ..., curriculumSemesters: [] }, grades: [] }
        if (!res.data?.major?.curriculumSemesters) {
           setSubjects([]);
           return;
        }

        const allCurriculumSubjects = res.data.major.curriculumSemesters.flatMap((cs: any) => 
           cs.subjects.map((s: any) => ({
              ...s.subject,
              curriculumSemester: cs.semesterNumber
           }))
        );
        setSubjects(allCurriculumSubjects);
     } catch (error) {
        toast.error('Lỗi tải chương trình đào tạo');
     }
  };

  const handleRegister = async (subjectId: number) => {
    try {
      await axios.post('/academic/registrations', {
        subjectId,
        semesterId: selectedSemester
      });
      toast.success('Đăng ký thành công');
      // Refresh registrations
      const regRes = await axios.get('/academic/registrations/my');
      setMyRegistrations(regRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi đăng ký');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await axios.delete(`/academic/registrations/${cancelTarget.id}`);
      toast.success('Đã hủy đăng ký');
      const regRes = await axios.get('/academic/registrations/my');
      setMyRegistrations(regRes.data);
    } catch {
      toast.error('Lỗi khi hủy đăng ký');
    } finally {
      setCancelTarget(null);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Extract number from selectedSemester (e.g. "HỌC KÌ 3" -> 3)
    const semNumMatch = selectedSemester.match(/\d+/);
    const targetSemNum = semNumMatch ? parseInt(semNumMatch[0]) : null;
    
    // Only show subjects belonging to the selected curriculum semester number
    return matchesSearch && (targetSemNum ? s.curriculumSemester === targetSemNum : true);
  });

  const totalCredits = myRegistrations
    .filter(r => r.semesterId === selectedSemester)
    .reduce((sum, r) => sum + r.subject.credits, 0);

  const totalTuition = myRegistrations
    .filter(r => r.semesterId === selectedSemester)
    .reduce((sum, r) => sum + (r.subject.credits * (r.subject.pricePerCredit || 500000)), 0);

  return (
    <>
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <Calendar size={12} /> Đăng ký học phần - {user?.class_id}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Đăng ký môn học</h1>
          <p className="text-slate-500 font-bold text-sm">Đăng ký học phần dựa trên Chương trình khung của ngành học.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Tín chỉ đã chọn</p>
              <p className="text-2xl font-black text-blue-600">{totalCredits}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Available Subjects */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-6">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                     <BookOpen size={20} className="text-blue-500" /> Môn học theo lộ trình
                  </h3>
                  <div className="flex items-center gap-4">
                     <select 
                       value={selectedSemester}
                       onChange={e => setSelectedSemester(e.target.value)}
                       className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                     >
                        {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                     </select>
                     <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Tìm môn học..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-10">
                  {Array.from(new Set(filteredSubjects.map(s => s.curriculumSemester))).sort((a, b) => a - b).map(semNum => (
                    <div key={semNum} className="space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="h-[2px] flex-1 bg-slate-100"></div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Học kỳ khung {semNum}</h4>
                          <div className="h-[2px] flex-1 bg-slate-100"></div>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-3">
                          {filteredSubjects.filter(s => s.curriculumSemester === semNum).map(s => {
                            const isRegistered = myRegistrations.some(r => r.subjectId === s.id && r.semesterId === selectedSemester);
                            return (
                              <div key={s.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all group">
                                 <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 font-black text-xs border border-slate-100">
                                       {s.credits}TC
                                    </div>
                                     <div>
                                        <p className="text-sm font-black text-slate-900">{s.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.code}</p>
                                           <span className="text-[9px] font-bold text-emerald-600 italic">{(s.pricePerCredit || 500000).toLocaleString()}đ/TC</span>
                                        </div>
                                     </div>
                                 </div>
                                 {isRegistered ? (
                                    <button 
                                      onClick={() => {
                                        const reg = myRegistrations.find(r => r.subjectId === s.id && r.semesterId === selectedSemester);
                                        if (reg) setCancelTarget(reg);
                                      }}
                                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 active:scale-95"
                                    >
                                       <Trash2 size={14} /> Hủy chọn
                                    </button>
                                 ) : (
                                    <button 
                                      onClick={() => handleRegister(s.id)}
                                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95"
                                    >
                                       <Plus size={14} /> Đăng ký
                                    </button>
                                 )}
                              </div>
                            );
                          })}
                       </div>
                    </div>
                  ))}
                  
                  {filteredSubjects.length === 0 && (
                     <div className="py-20 text-center space-y-4 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                        <Info size={32} className="mx-auto text-slate-300" />
                         <p className="text-sm font-bold text-slate-400">Không tìm thấy môn học nào trong chương trình khung của bạn.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* My Registrations */}
         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 -mr-4 -mt-4"><BookOpen size={100} /></div>
               <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 relative z-10">
                  <CheckCircle2 size={20} className="text-emerald-400" /> Môn đã chọn
               </h3>
               
               <div className="space-y-4 relative z-10">
                  <AnimatePresence mode="popLayout">
                    {myRegistrations.filter(r => r.semesterId === selectedSemester).map(r => (
                      <motion.div 
                        key={r.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl group flex items-center justify-between"
                      >
                         <div>
                            <p className="text-xs font-black leading-tight">{r.subject.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{r.subject.code} • {r.subject.credits} tín chỉ</p>
                         </div>
                         <button 
                           onClick={() => setCancelTarget(r)}
                           className="p-2 text-slate-400 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 size={16} />
                         </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {myRegistrations.filter(r => r.semesterId === selectedSemester).length === 0 && (
                     <div className="py-12 text-center space-y-3 opacity-30">
                        <AlertCircle className="mx-auto" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Chưa có môn học nào</p>
                     </div>
                  )}
               </div>

               <div className="pt-4 border-t border-white/10 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-black uppercase text-slate-400">Ước tính học phí</span>
                     <span className="text-xl font-black text-emerald-400">
                        {totalTuition.toLocaleString('vi-VN')}đ
                     </span>
                  </div>
                  <button 
                    onClick={() => navigate('/tuition', { state: { semesterId: selectedSemester } })}
                    className="w-full py-4 bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
                  >
                     <CreditCard size={14} /> Đi tới thanh toán
                  </button>
               </div>
            </div>
         </div>
      </div>

    </div>

      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            className="fixed left-0 top-0 z-[100] flex h-dvh w-screen items-center justify-center bg-slate-950/45 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/25 border border-slate-100"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest">Xác nhận hủy</p>
                      <h3 className="text-xl font-black text-slate-900">Hủy đăng ký học phần?</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCancelTarget(null)}
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
                    aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-sm font-bold text-slate-500 mb-1">Bạn đang hủy môn</p>
                  <p className="text-base font-black text-slate-900 leading-snug">{cancelTarget.subject?.name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-100 text-[10px] font-black text-slate-500">
                      {cancelTarget.subject?.code}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-100 text-[10px] font-black text-blue-600">
                      {cancelTarget.subject?.credits} tín chỉ
                    </span>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-500">
                  Sau khi hủy, môn học sẽ được bỏ khỏi danh sách đã chọn của học kỳ hiện tại.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 border-t border-slate-100">
                <button
                  onClick={() => setCancelTarget(null)}
                  className="py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black hover:bg-slate-100 transition-all active:scale-95"
                >
                  Giữ lại
                </button>
                <button
                  onClick={handleCancel}
                  className="py-3 rounded-2xl bg-rose-600 text-white text-sm font-black hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                >
                  Hủy đăng ký
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubjectRegistration;
