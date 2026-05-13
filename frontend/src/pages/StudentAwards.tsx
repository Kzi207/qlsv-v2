import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award as AwardIcon, 
  Star, 
  Medal, 
  Calendar, 
  Search,
  Sparkles,
  ArrowLeft,
  TrendingUp,
  ShieldCheck,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';

interface Award {
  id: number;
  title: string;
  description: string;
  type: 'AWARD' | 'SCHOLARSHIP' | 'COMMENDATION';
  date: string;
}

const StudentAwards = () => {
  const navigate = useNavigate();
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const res = await axios.get('/students/awards');
        setAwards(res.data);
      } catch (error) {
        console.error('Failed to fetch awards', error);
        toast.error('Không thể tải danh sách khen thưởng');
      } finally {
        setLoading(false);
      }
    };
    fetchAwards();
  }, []);

  const filteredAwards = awards.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAwardIcon = (type: string) => {
    switch (type) {
      case 'SCHOLARSHIP': return <Medal className="text-amber-500" size={24} />;
      case 'COMMENDATION': return <Star className="text-blue-500" size={24} />;
      default: return <Trophy className="text-emerald-500" size={24} />;
    }
  };

  const getAwardBg = (type: string) => {
    switch (type) {
      case 'SCHOLARSHIP': return 'bg-amber-50 border-amber-100';
      case 'COMMENDATION': return 'bg-blue-50 border-blue-100';
      default: return 'bg-emerald-50 border-emerald-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Premium Header Banner - Compact Version */}
      <div className="relative py-4 px-6 md:py-6 md:px-10 w-full overflow-hidden bg-slate-900 text-white shadow-2xl shadow-blue-900/20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-emerald-600/20" />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" 
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft size={12} /> Quay lại
          </motion.button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md border border-white/10">
                <Sparkles size={10} className="text-amber-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-100">Vinh danh & Thành tích</span>
              </div>
              <h1 className="text-xl md:text-3xl font-black tracking-tight text-white uppercase leading-tight">
                Danh hiệu <span className="text-blue-400">& Khen thưởng</span>
              </h1>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-[1.25rem] bg-white/5 p-4 backdrop-blur-xl border border-white/10"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 shadow-xl shadow-amber-400/20">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Tổng giải thưởng</p>
                <p className="text-xl font-black text-white leading-none">{awards.length}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto mt-6 max-w-5xl px-4 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: List & Search */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm danh hiệu, học bổng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-100 bg-white py-3.5 pl-12 pr-6 text-xs font-bold text-slate-900 shadow-sm outline-none ring-2 ring-transparent transition-all focus:ring-blue-500/20 placeholder:text-slate-400"
              />
            </div>

            {/* Awards List */}
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 w-full animate-pulse rounded-[2rem] bg-white shadow-sm" />
                ))
              ) : filteredAwards.length > 0 ? (
                filteredAwards.map((award, index) => (
                  <motion.div 
                    key={award.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-500"
                  >
                    <div className="flex gap-5">
                      <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center border ${getAwardBg(award.type)} group-hover:scale-110 transition-transform duration-500`}>
                        {getAwardIcon(award.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                              {award.type === 'SCHOLARSHIP' ? 'Học bổng' : award.type === 'COMMENDATION' ? 'Giấy khen' : 'Danh hiệu'}
                            </p>
                            <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                              {award.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <Calendar size={10} />
                            {new Date(award.date).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2 italic">
                          "{award.description || 'Vinh danh những nỗ lực và thành tích xuất sắc.'}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[2.5rem] bg-white p-20 text-center border-2 border-dashed border-slate-100">
                   <div className="mx-auto mb-6 h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300">
                      <Trophy size={40} />
                   </div>
                   <h3 className="text-lg font-black text-slate-900 uppercase">Chưa có dữ liệu</h3>
                   <p className="text-sm font-medium text-slate-400 mt-2">Bạn hãy nỗ lực hơn nữa để nhận được những danh hiệu cao quý nhé!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Insights */}
          <div className="space-y-8">
             <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white shadow-xl shadow-slate-900/30 relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40">Phân tích</h3>
                     <TrendingUp className="text-emerald-400" size={16} />
                  </div>
                  
                  <div className="space-y-5">
                     <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black text-white/60 uppercase tracking-widest">
                           <span>Cấp trường</span>
                           <span>{awards.filter(a => a.type === 'AWARD').length} giải</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 w-[60%] rounded-full" />
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Học bổng</p>
                           <p className="text-xl font-black text-amber-400">
                              {awards.filter(a => a.type === 'SCHOLARSHIP').length} <span className="text-[10px] uppercase text-white/40 ml-1">Lần</span>
                           </p>
                        </div>
                        <Medal size={24} className="text-white/10" />
                     </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                     <div className="flex items-center gap-2.5 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                           <ShieldCheck size={14} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Xác thực</p>
                     </div>
                     <p className="text-[10px] font-bold text-white/60 leading-relaxed italic">
                       "Tất cả danh hiệu đều được xác thực bởi Hội đồng khen thưởng."
                     </p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                   <AwardIcon size={180} />
                </div>
             </div>

             <button className="w-full py-4 bg-white border border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Download size={16} className="text-blue-600" /> Tải vinh danh (.PDF)
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentAwards;
