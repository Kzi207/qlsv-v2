import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  Search,
  ChevronDown,
  ChevronRight
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
      // Auto-expand current semester logic could go here
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data?.major) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
        <div className="h-20 w-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-200/20">
           <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase">Chưa có chương trình khung</h2>
        <p className="text-slate-500 font-bold max-w-md mt-2">Lớp học của bạn hiện chưa được gán chương trình đào tạo. Vui lòng liên hệ văn phòng khoa để biết thêm chi tiết.</p>
      </div>
    );
  }

  const { major, grades } = data;
  const passedSubjectNames = grades.filter((g: any) => g.totalScore >= 5).map((g: any) => g.subject);

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-up pb-20 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <Award size={12} /> Lộ trình đào tạo chuẩn
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight text-gradient uppercase">
            {major.name}
          </h1>
          <p className="text-slate-500 font-bold text-sm max-w-2xl">
            Khoa {major.faculty.name}. Tổng {major.totalCredits} tín chỉ trong {major.totalSemesters} học kỳ.
          </p>
        </div>

        <CreditSummary curriculum={major} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Main Curriculum Area */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Layers size={18} className="text-blue-600" /> Tiến độ học tập
             </h3>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Tìm môn học..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
             </div>
          </div>

          <div className="space-y-6">
            {major.curriculumSemesters.map((semester: any) => {
              const filteredSubjects = semester.subjects.filter((s: any) => 
                s.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                s.subject.code.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              if (searchQuery && filteredSubjects.length === 0) return null;

              const semesterCredits = semester.subjects.reduce((acc: number, s: any) => acc + s.subject.credits, 0);
              const passedCredits = semester.subjects
                .filter((s: any) => passedSubjectNames.includes(s.subject.name))
                .reduce((acc: number, s: any) => acc + s.subject.credits, 0);

              const isCompleted = passedCredits === semesterCredits && semesterCredits > 0;

              return (
                <div key={semester.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div 
                    className="p-6 md:p-8 flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleSemester(semester.id)}
                  >
                    <div className="flex items-center gap-6">
                       <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                         isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                       }`}>
                          <h4 className="text-lg font-black">{semester.semesterNumber}</h4>
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Học kỳ {semester.semesterNumber}</h4>
                          <div className="flex items-center gap-3 mt-1">
                             <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-1000" 
                                  style={{ width: `${(passedCredits / semesterCredits) * 100}%` }}
                                />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {passedCredits}/{semesterCredits} Tín chỉ
                             </span>
                          </div>
                       </div>
                    </div>
                    <div className="text-slate-400">
                       {expandedSemesters.includes(semester.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSemesters.includes(semester.id) && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredSubjects.map((item: any) => {
                            const isPassed = passedSubjectNames.includes(item.subject.name);
                            return (
                              <div key={item.id} className="relative">
                                <SubjectCard 
                                  item={item}
                                  isAdmin={false}
                                  onEdit={() => {}}
                                  onDelete={() => {}}
                                />
                                {isPassed && (
                                  <div className="absolute top-3 right-3 text-emerald-500 bg-emerald-50 p-1 rounded-full">
                                     <CheckCircle2 size={16} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="space-y-8 lg:sticky lg:top-8 self-start">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 space-y-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={120} /></div>
              <div className="relative">
                 <h3 className="text-sm font-black uppercase tracking-widest mb-6">Thống kê tích lũy</h3>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-400 uppercase">Học kỳ hoàn thành</span>
                       <span className="text-xl font-black">
                         {major.curriculumSemesters.filter((sem: any) => {
                            const semCr = sem.subjects.reduce((a: number, s: any) => a + s.subject.credits, 0);
                            const psCr = sem.subjects.filter((s: any) => passedSubjectNames.includes(s.subject.name)).reduce((a: number, s: any) => a + s.subject.credits, 0);
                            return psCr === semCr && semCr > 0;
                         }).length} / {major.totalSemesters}
                       </span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-400 uppercase">Tín chỉ tích lũy</span>
                       <span className="text-xl font-black text-emerald-400">
                         {grades.filter((g: any) => g.totalScore >= 5).length > 0 ? grades.filter((g: any) => g.totalScore >= 5).reduce((acc: number, g: any) => {
                            // Find subject credit from major curriculum if possible
                            return acc + 3; // Placeholder if credit not in grade
                         }, 0) : 0} TC
                       </span>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-sm relative">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Lời khuyên học tập</h4>
                 <p className="text-xs font-medium text-slate-200 leading-relaxed">
                   Bạn đã hoàn thành các môn đại cương. Hãy tập trung vào các môn cơ sở ngành trong học kỳ tới để có nền tảng vững chắc.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCurriculum;
