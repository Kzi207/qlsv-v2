import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Search,
  CheckCircle2,
  Layout,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const AdminClassSubjectManager = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [classRes, subRes, semRes] = await Promise.all([
        axios.get('/classes'),
        axios.get('/academic/subjects'),
        axios.get('/semesters')
      ]);
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setSemesters(semRes.data);
      if (semRes.data.length > 0) setSelectedSemester(semRes.data[0].name);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSemester) {
      fetchClassSubjects();
    }
  }, [selectedClass, selectedSemester]);

  const fetchClassSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/academic/class-subjects', {
        params: { classId: selectedClass, semesterId: selectedSemester }
      });
      setClassSubjects(res.data);
    } catch (error) {
      toast.error('Lỗi tải môn học theo lớp');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (subjectId: number) => {
    if (!selectedClass || !selectedSemester) {
      toast.error('Vui lòng chọn lớp và học kỳ');
      return;
    }

    try {
      await axios.post('/academic/class-subjects', {
        classId: selectedClass,
        subjectId,
        semesterId: selectedSemester
      });
      toast.success('Đã gán môn học cho lớp');
      fetchClassSubjects();
    } catch (error) {
      toast.error('Lỗi khi gán môn học');
    }
  };

  const handleUnassign = async (id: number) => {
    try {
      await axios.delete(`/academic/class-subjects/${id}`);
      toast.success('Đã hủy gán môn học');
      fetchClassSubjects();
    } catch (error) {
      toast.error('Lỗi khi hủy gán');
    }
  };

  const availableSubjects = subjects.filter(s => 
    !classSubjects.some(cs => cs.subjectId === s.id) &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <Layout size={12} /> Cấu hình đào tạo theo lớp
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý môn học theo lớp</h1>
          <p className="text-slate-500 font-bold text-sm">Thiết lập danh sách môn học bắt buộc cho từng lớp trong mỗi học kỳ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Filter Panel */}
         <div className="lg:col-span-12">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-6 items-end">
               <div className="flex-1 space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Chọn lớp học</label>
                  <select 
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">--- Chọn lớp ---</option>
                    {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
               </div>
               <div className="flex-1 space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Học kỳ</label>
                  <select 
                    value={selectedSemester} 
                    onChange={e => setSelectedSemester(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                  >
                    {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
               </div>
            </div>
         </div>

         {/* Left Side: Assigned Subjects */}
         <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white min-h-[500px] shadow-2xl shadow-slate-900/40 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                     <CheckCircle2 size={20} className="text-emerald-400" /> Môn học của lớp
                  </h3>
                  <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black">
                     {classSubjects.length} Môn
                  </div>
               </div>

               <div className="space-y-4">
                  {classSubjects.map(cs => (
                    <motion.div 
                      key={cs.id}
                      layout
                      className="p-5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center justify-between group"
                    >
                       <div>
                          <p className="text-sm font-black leading-tight">{cs.subject.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{cs.subject.code} • {cs.subject.credits} TC</p>
                       </div>
                       <button 
                         onClick={() => handleUnassign(cs.id)}
                         className="p-3 bg-white/5 rounded-xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                       >
                          <Trash2 size={18} />
                       </button>
                    </motion.div>
                  ))}
                  
                  {classSubjects.length === 0 && !loading && (
                    <div className="py-20 text-center opacity-30 space-y-4">
                       <Filter size={40} className="mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Chưa gán môn học nào</p>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Right Side: Subject Pool */}
         <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-8">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                     <BookOpen size={20} className="text-blue-500" /> Kho môn học
                  </h3>
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

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {availableSubjects.map(s => (
                      <motion.div 
                        key={s.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] flex items-center justify-between hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 transition-all group"
                      >
                         <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{s.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.code} • {s.credits} TC</p>
                         </div>
                         <button 
                           onClick={() => handleAssign(s.id)}
                           className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                         >
                            <Plus size={18} />
                         </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminClassSubjectManager;
