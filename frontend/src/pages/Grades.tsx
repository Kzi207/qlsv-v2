import { useState, useEffect } from 'react';
import { 
  Award, 
  BookOpen, 
  Star, 
  Inbox, 
  TrendingUp,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';

// --- Components ---

const GradeStats = ({ stats }: { stats: any }) => {
  const statItems = [
    {
      label: 'GPA tích lũy (4.0)',
      value: stats.gpa,
      subValue: stats.rank || 'Chưa có',
      icon: Star,
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'bg-blue-500',
      description: 'Dựa trên hệ 4'
    },
    {
      label: 'Môn đã học',
      value: `${stats.totalSubjects} / ${stats.allSubjects}`,
      subValue: 'Môn',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600',
      iconColor: 'bg-emerald-500',
      description: 'Số môn đã có điểm'
    },
    {
      label: 'Tổng tín chỉ',
      value: stats.totalCredits,
      subValue: 'Tín chỉ',
      icon: Layout,
      color: 'bg-violet-50 text-violet-600',
      iconColor: 'bg-violet-500',
      description: 'Tích lũy thành công'
    },
    {
      label: 'Xếp loại',
      value: stats.rankLabel || '-',
      subValue: 'Kết quả',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
      iconColor: 'bg-amber-500',
      description: 'Dựa trên GPA'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statItems.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div className={`h-12 w-12 rounded-2xl ${item.color} flex items-center justify-center shadow-inner relative z-10`}>
              <item.icon size={24} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-2xl font-black text-slate-900 leading-none">{item.value}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.description}</span>
            <span className="text-xs font-black text-slate-900">{item.subValue}</span>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${item.iconColor} opacity-[0.03] group-hover:scale-150 transition-transform duration-700`} />
        </motion.div>
      ))}
    </div>
  );
};

const GradeTable = ({ grades, getGradeColor }: { grades: any[], getGradeColor: (l: string) => string }) => {
  return (
    <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md">
              <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Học kỳ</th>
              <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Môn học</th>
              <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tín chỉ</th>
              <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Giữa kỳ (40%)</th>
              <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuối kỳ (60%)</th>
              <th className="p-6 text-center text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/50">Tổng kết</th>
              <th className="p-6 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Điểm chữ (4.0)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {grades.map((g, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-200 group">
                <td className="p-6">
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap">
                    {g.semesterName}
                  </span>
                </td>
                <td className="p-6 min-w-[250px]">
                  <p className="text-sm font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">{g.subject}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{g.subjectCode}</p>
                </td>
                <td className="p-6 text-center">
                  <span className="text-xs font-black text-slate-600">{g.credits}</span>
                </td>
                <td className="p-6 text-center">
                  {g.midtermScore !== null ? (
                    <span className="text-sm font-bold text-slate-600">{g.midtermScore.toFixed(1)}</span>
                  ) : (
                    <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded-md text-xs font-bold">-</span>
                  )}
                </td>
                <td className="p-6 text-center">
                  {g.finalScore !== null ? (
                    <span className="text-sm font-bold text-slate-600">{g.finalScore.toFixed(1)}</span>
                  ) : (
                    <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded-md text-xs font-bold">-</span>
                  )}
                </td>
                <td className="p-6 text-center bg-blue-50/5">
                  <span className={`px-4 py-2 rounded-xl font-black text-sm inline-block min-w-[3rem] ${
                    g.totalScore !== null ? (g.totalScore >= 4.0 ? 'text-blue-600 bg-blue-50 shadow-sm border border-blue-100/50' : 'text-rose-600 bg-rose-50') : 'text-slate-300'
                  }`}>
                    {g.totalScore !== null ? g.totalScore.toFixed(1) : '-'}
                  </span>
                </td>
                <td className="p-6 text-center">
                  {g.letterGrade ? (
                    <div className="flex flex-col items-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${getGradeColor(g.letterGrade)}`}>
                        {g.letterGrade}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">({g.gradePoint.toFixed(1)})</span>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GradeMobileCard = ({ grades, getGradeColor }: { grades: any[], getGradeColor: (l: string) => string }) => {
  return (
    <div className="lg:hidden space-y-4 px-2 md:px-0">
      {grades.map((g, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/10 overflow-hidden"
        >
          {/* Card Header */}
          <div className="p-5 border-b border-slate-50 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                {g.semesterName}
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-snug">{g.subject}</h3>
              <p className="text-[10px] font-bold text-slate-400">{g.subjectCode}</p>
            </div>
            <div className="text-right shrink-0">
              {g.totalScore !== null ? (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm border ${
                   g.totalScore >= 4.0 ? 'bg-blue-600 text-white border-blue-400' : 'bg-rose-500 text-white border-rose-400'
                }`}>
                  {g.totalScore.toFixed(1)}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 font-black border border-rose-100">
                  -
                </div>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tín chỉ</p>
              <p className="text-sm font-black text-slate-700">{g.credits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giữa kỳ</p>
              <p className="text-sm font-black text-slate-700">{g.midtermScore !== null ? g.midtermScore.toFixed(1) : '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cuối kỳ</p>
              <p className="text-sm font-black text-slate-700">{g.finalScore !== null ? g.finalScore.toFixed(1) : '-'}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tổng kết</p>
              <p className="text-sm font-black text-slate-700">{g.totalScore !== null ? g.totalScore.toFixed(1) : '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Điểm chữ</p>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${getGradeColor(g.letterGrade)}`}>
                  {g.letterGrade || '-'}
                </span>
                {g.gradePoint !== null && (
                   <span className="text-[10px] font-bold text-slate-400">({g.gradePoint.toFixed(1)})</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm" />
        ))}
      </div>
      <div className="h-[400px] bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hidden lg:block" />
      <div className="space-y-4 lg:hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-white rounded-[2rem] border border-slate-100 shadow-sm" />
        ))}
      </div>
    </div>
  );
};

const EmptyState = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center flex flex-col items-center space-y-6 shadow-xl shadow-slate-200/10"
    >
      <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 relative">
        <Inbox size={48} />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-4 border-white animate-bounce" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Chưa có kết quả học tập</h3>
        <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">Vui lòng kiểm tra lại chương trình khung hoặc liên hệ quản lý đào tạo.</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
      >
        Tải lại dữ liệu
      </button>
    </motion.div>
  );
};

// --- Main Page Component ---

const Grades = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    gpa: '0.00',
    totalSubjects: 0,
    allSubjects: 0,
    totalCredits: 0,
    rank: '-',
    rankLabel: '-'
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/grades/my');
      const data = res.data;
      setGrades(data);
      
      // Calculate Stats
      const graded = data.filter((g: any) => g.gradePoint !== null);
      const totalCredits = graded.reduce((sum: number, g: any) => sum + g.credits, 0);
      const weightedSum = graded.reduce((sum: number, g: any) => sum + (g.gradePoint * g.credits), 0);
      const gpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : '0.00';
      
      const gpaValue = parseFloat(gpa);
      let rank = '-';
      let rankLabel = '-';
      
      if (gpaValue >= 3.6) { rank = 'Xuất sắc'; rankLabel = 'XUẤT SẮC'; }
      else if (gpaValue >= 3.2) { rank = 'Giỏi'; rankLabel = 'GIỎI'; }
      else if (gpaValue >= 2.5) { rank = 'Khá'; rankLabel = 'KHÁ'; }
      else if (gpaValue >= 2.0) { rank = 'Trung bình'; rankLabel = 'TRUNG BÌNH'; }
      else if (gpaValue > 0) { rank = 'Yếu'; rankLabel = 'YẾU'; }

      setStats({
        gpa,
        totalSubjects: graded.length,
        allSubjects: data.length,
        totalCredits,
        rank,
        rankLabel
      });
    } catch (error) {
      toast.error('Không thể tải kết quả học tập');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (letter: string) => {
    if (!letter) return 'text-slate-400 bg-slate-50';
    if (['A+', 'A', 'B+'].includes(letter)) return 'text-emerald-600 bg-emerald-50';
    if (['B', 'C+'].includes(letter)) return 'text-blue-600 bg-blue-50';
    if (['C', 'D+'].includes(letter)) return 'text-amber-600 bg-amber-50';
    if (letter === 'D') return 'text-orange-600 bg-orange-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0 mt-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
             <Award size={14} className="animate-pulse" /> Bảng điểm sinh viên
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Kết quả học tập</h1>
          <p className="text-slate-500 font-bold text-sm md:text-base max-w-lg">
            Hệ thống tự động cập nhật điểm số và tiến độ học tập chi tiết của bạn qua từng học kỳ.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchGrades}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
          >
            <TrendingUp size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingSkeleton />
        ) : grades.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-8"
          >
            {/* Stats Cards */}
            <GradeStats stats={stats} />

            {/* Desktop Table View */}
            <GradeTable grades={grades} getGradeColor={getGradeColor} />

            {/* Mobile Cards View */}
            <GradeMobileCard grades={grades} getGradeColor={getGradeColor} />

          </motion.div>
        ) : (
          <EmptyState />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Grades;
