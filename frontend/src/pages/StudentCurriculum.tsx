import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  Search,
  ChevronDown,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Reusing some logic but simplified for student
import CreditSummary from '../components/curriculum/CreditSummary';
import SubjectCard from '../components/curriculum/SubjectCard.tsx';

const StudentCurriculum = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSemesters, setExpandedSemesters] = useState<number[]>([1]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyCurriculum();
  }, []);

  const fetchMyCurriculum = async () => {
    try {
      const res = await axios.get('/curriculum/my-curriculum');
      setData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi tải chương trình học');
    } finally {
      setLoading(false);
    }
  };

  const toggleSemester = (id: number) => {
    setExpandedSemesters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data?.major) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
        <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
           <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 uppercase">Chưa có chương trình khung</h2>
        <p className="text-slate-500 font-medium text-sm mt-2">Vui lòng liên hệ văn phòng khoa để biết thêm chi tiết.</p>
      </div>
    );
  }

  const { major, grades } = data;
  
  // Normalized comparison (trim and lowercase to handle potential typos/trailing spaces)
  const passedSubjectNames = grades
    .filter((g: any) => g.totalScore >= 5)
    .map((g: any) => String(g.subject || '').trim().toLowerCase());

  const passedSubjectCodes = grades
    .filter((g: any) => g.totalScore >= 5)
    .map((g: any) => String(g.subjectCode || '').trim().toLowerCase());

  const isSubjectPassed = (subject: any) => {
    const sName = String(subject.name || '').trim().toLowerCase();
    const sCode = String(subject.code || '').trim().toLowerCase();
    return passedSubjectNames.includes(sName) || passedSubjectCodes.includes(sCode);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-up pb-12 pt-2 space-y-6 px-4">
      {/* Header Section - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
             <Award size={12} className="animate-pulse" /> Lộ trình đào tạo
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase italic">
            {major.name}
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">
            Khoa {major.faculty.name} • {major.totalCredits} tín chỉ • {major.totalSemesters} học kỳ
          </p>
        </div>

        <div className="relative z-10 bg-slate-50 p-4 rounded-3xl border border-white shadow-inner">
          <CreditSummary curriculum={major} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Main Curriculum Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} className="text-blue-600" /> Tiến độ học tập
             </h3>
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder="Tìm kiếm môn học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-56 md:w-80 shadow-sm"
                />
             </div>
          </div>

          <div className="space-y-4">
            {major.curriculumSemesters?.map((sem: any) => {
              const isExpanded = expandedSemesters.includes(sem.id);
              const filteredSubjects = sem.subjects.filter((s: any) => 
                s.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.subject.code.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (searchQuery && filteredSubjects.length === 0) return null;

              const totalCredits = sem.subjects.reduce((sum: number, s: any) => sum + s.subject.credits, 0);
              const completedCredits = sem.subjects
                .filter((s: any) => isSubjectPassed(s.subject))
                .reduce((sum: number, s: any) => sum + s.subject.credits, 0);

              return (
                <div key={sem.id} className="group bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
                  <button 
                    onClick={() => toggleSemester(sem.id)}
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
                        {sem.order}
                      </div>
                      <div className="text-left space-y-2">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Học kỳ {sem.order}</h4>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(completedCredits / totalCredits) * 100}%` }}
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            <span className="text-emerald-600">{completedCredits}</span> / {totalCredits} Tín chỉ
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all ${isExpanded ? 'rotate-180' : ''}`}>
                       <ChevronDown size={20} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-50 bg-slate-50/30"
                      >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredSubjects.map((subject: any) => (
                            <SubjectCard 
                              key={subject.id} 
                              item={subject.subject} 
                              isAdmin={false}
                              onEdit={() => {}}
                              onDelete={() => {}}
                              isPassed={isSubjectPassed(subject)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Thống kê tích lũy</h3>
                   <TrendingUp className="text-emerald-400" size={20} />
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black text-white/60 uppercase tracking-widest">
                         <span>Tiến độ học kỳ</span>
                         <span>{major.curriculumSemesters?.filter((s: any) => 
                           s.subjects.every((sub: any) => isSubjectPassed(sub.subject))
                         ).length} / {major.totalSemesters}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[5%] rounded-full" />
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tín chỉ tích lũy</p>
                         <p className="text-2xl font-black text-emerald-400">
                           {major.curriculumSemesters?.reduce((acc: number, sem: any) => 
                             acc + sem.subjects.filter((s: any) => isSubjectPassed(s.subject)).reduce((sAcc: number, s: any) => sAcc + s.subject.credits, 0)
                           , 0)} <span className="text-xs uppercase text-white/40 ml-1">TC</span>
                         </p>
                      </div>
                      <Award size={32} className="text-white/10" />
                   </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                         <AlertCircle size={16} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Lời khuyên hệ thống</p>
                   </div>
                   <p className="text-xs font-bold text-white/60 leading-relaxed italic">
                     "Hoàn thành các môn đại cương trong năm nhất sẽ giúp bạn giảm bớt áp lực khi bước vào giai đoạn chuyên ngành."
                   </p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                 <Layers size={240} />
              </div>
           </div>

           <button className="w-full py-5 bg-white border border-slate-100 rounded-[2rem] font-black text-[11px] uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3">
              <Download size={18} className="text-blue-600" /> Tải chương trình đào tạo (.PDF)
           </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCurriculum;
