import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { 
  Award, 
  TrendingUp, 
  History as HistoryIcon, 
  ChevronRight, 
  Loader2, 
  Target, 
  ShieldCheck, 
  Star,
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TrainingScore {
  id: number;
  semester_id: string;
  total: number;
  admin_total: number | null;
  y_thuc: number;
  hoat_dong: number;
  ky_luat: number;
  admin_y_thuc: number | null;
  admin_hoat_dong: number | null;
  admin_ky_luat: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  updatedAt: string;
}

const StudentTrainingResults = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [scores, setScores] = useState<TrainingScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentId) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/training/student/${user?.studentId}`);
      // Sort by semester_id descending (latest first)
      const sortedData = res.data.sort((a: TrainingScore, b: TrainingScore) => 
        b.semester_id.localeCompare(a.semester_id)
      );
      setScores(sortedData);
    } catch (error) {
      console.error('Error fetching training results:', error);
      toast.error('Không thể tải kết quả rèn luyện');
    } finally {
      setLoading(false);
    }
  };

  const getRank = (total: number) => {
    if (total >= 90) return { label: 'Xuất sắc', color: 'text-purple-600 bg-purple-50', border: 'border-purple-200', icon: <Star size={14} /> };
    if (total >= 80) return { label: 'Tốt', color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-200', icon: <ShieldCheck size={14} /> };
    if (total >= 65) return { label: 'Khá', color: 'text-blue-600 bg-blue-50', border: 'border-blue-200', icon: <Target size={14} /> };
    if (total >= 50) return { label: 'Trung bình', color: 'text-amber-600 bg-amber-50', border: 'border-amber-200', icon: <AlertCircle size={14} /> };
    return { label: 'Yếu/Kém', color: 'text-red-600 bg-red-50', border: 'border-red-200', icon: <AlertCircle size={14} /> };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Từ chối</span>;
      default:
        return <span className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Chờ duyệt</span>;
    }
  };

  const calculateStats = () => {
    if (scores.length === 0) return { average: 0, highest: 0, count: 0 };
    const approvedScores = scores.filter(s => s.status === 'APPROVED');
    const sourceScores = approvedScores.length > 0 ? approvedScores : scores;
    
    const totalPoints = sourceScores.reduce((acc, curr) => acc + (curr.admin_total || curr.total), 0);
    const highest = Math.max(...sourceScores.map(s => s.admin_total || s.total));
    
    return {
      average: Math.round((totalPoints / sourceScores.length) * 10) / 10,
      highest,
      count: scores.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-bold animate-pulse">Đang chuẩn bị bảng điểm của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
            <Award size={12} />
            Academic Achievement
          </div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Kết quả <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Rèn luyện</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl">
            Theo dõi quá trình rèn luyện và phấn đấu của bạn qua từng học kỳ tại trường.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-blue-50 opacity-20 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm trung bình</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{stats.average}</span>
              <span className="text-lg font-bold text-slate-300">/ 100</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRank(stats.average).color} ${getRank(stats.average).border}`}>
                Xếp loại: {getRank(stats.average).label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Học kỳ đã học</p>
          <p className="text-2xl font-black text-slate-900">{stats.count}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Điểm cao nhất</p>
          <p className="text-2xl font-black text-emerald-600">{stats.highest}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mục tiêu kỳ tới</p>
          <p className="text-2xl font-black text-blue-600">90+</p>
        </div>
        <button 
          className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl shadow-slate-200/50 flex flex-col justify-center items-center gap-1 hover:bg-slate-800 transition-all active:scale-95 group"
          onClick={() => toast.success('Đang chuẩn bị tệp PDF...')}
        >
          <Download size={20} className="mb-1 group-hover:-translate-y-1 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Xuất bảng điểm</span>
        </button>
      </div>

      {/* History List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
              <HistoryIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Lịch sử rèn luyện</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Training History</p>
            </div>
          </div>
          <div className="h-px flex-1 mx-8 bg-slate-100 hidden md:block" />
          <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
            <Calendar size={14} />
            Cập nhật: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>

        {scores.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Award size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Chưa có dữ liệu</h3>
              <p className="text-slate-500 font-medium">Bạn chưa thực hiện đánh giá rèn luyện cho học kỳ nào.</p>
            </div>
            <button 
              onClick={() => navigate('/training/evaluation/self')}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Đánh giá ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scores.map((s, index) => {
              const displayTotal = s.admin_total !== null ? s.admin_total : s.total;
              const rank = getRank(displayTotal);
              
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/training/evaluation/self?semester=${s.semester_id}`)}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${displayTotal >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Học kỳ</span>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                          {s.semester_id}
                        </h3>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl border flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider shadow-sm ${rank.color} ${rank.border}`}>
                        {rank.icon}
                        {rank.label}
                      </div>
                    </div>

                    <div className="flex items-end gap-2">
                      <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{displayTotal}</span>
                      <div className="flex flex-col pb-1">
                        <span className="text-lg font-bold text-slate-300 leading-none">/ 100</span>
                        {getStatusBadge(s.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest text-center">Học tập</p>
                        <p className="text-lg font-black text-slate-800 text-center">{s.admin_y_thuc ?? s.y_thuc}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest text-center">H.Động</p>
                        <p className="text-lg font-black text-slate-800 text-center">{s.admin_hoat_dong ?? s.hoat_dong}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest text-center">Kỷ luật</p>
                        <p className="text-lg font-black text-slate-800 text-center">{s.admin_ky_luat ?? s.ky_luat}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between group/btn">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                        Xem chi tiết tiêu chí
                      </span>
                      <div className="h-8 w-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:translate-x-1">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decorative footer card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 rotate-12">
          <Award size={300} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Nâng cao điểm rèn luyện của bạn trong học kỳ tới!
          </h2>
          <p className="text-slate-400 font-medium">
            Tham gia các hoạt động ngoại khóa, câu lạc bộ và các phong trào sinh viên để tích lũy thêm điểm rèn luyện. Điểm rèn luyện cao là một lợi thế lớn khi xét học bổng và việc làm.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => navigate('/activities')}
              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all"
            >
              Xem các hoạt động
            </button>
            <button 
              onClick={() => navigate('/training/evidence')}
              className="px-8 py-4 bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-all"
            >
              Minh chứng của tôi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTrainingResults;

