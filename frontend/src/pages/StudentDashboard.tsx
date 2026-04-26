import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  ChevronRight, 
  TrendingUp, 
  Wallet, 
  Clock,
  MapPin,
  Calendar,
  Award as AwardIcon,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';

// --- Sub-components ---

const Card = ({ 
  title, 
  children, 
  to, 
  className = "",
  footer
}: { 
  title?: string; 
  children: React.ReactNode; 
  to?: string;
  className?: string;
  footer?: React.ReactNode;
}) => (
  <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{title}</h3>
        {to && <Link to={to} className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors"><ChevronRight size={14} /></Link>}
      </div>
    )}
    <div className="p-5 md:p-6 flex-1">{children}</div>
    {footer && <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50">{footer}</div>}
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/students/dashboard-stats');
      setStatsData(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    }
  };

  const userName = user?.name || "Sinh viên";
  const progressPercent = statsData ? Math.round((statsData.earnedCredits / statsData.totalCredits) * 100) : 0;

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-up space-y-8 pb-10 px-4 md:px-0">
      
      {/* Mobile Hero Welcome */}
      <section className="relative">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] md:rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-2xl md:text-3xl font-black">{userName[0]}</span>
              </div>
              <div className="space-y-1">
                <p className="text-blue-100 text-[10px] md:text-xs font-black uppercase tracking-widest opacity-80">Xin chào</p>
                <h2 className="text-xl md:text-3xl font-black tracking-tight">{userName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-blue-100 text-[10px] md:text-sm font-bold opacity-90">Hệ thống học vụ đã sẵn sàng</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <Link to="/attendance/scan" className="flex-1 md:flex-none px-6 py-3.5 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
                <QrCode size={18} /> Quét mã QR
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Grid for Mobile */}
      <div className="grid grid-cols-4 gap-3 md:hidden">
        {[
          { icon: Calendar, label: 'Lịch học', to: '/schedule', color: 'bg-blue-50 text-blue-600' },
          { icon: AwardIcon, label: 'Điểm', to: '/grades', color: 'bg-rose-50 text-rose-600' },
          { icon: Clock, label: 'Nộp DRL', to: '/training/evaluation/self', color: 'bg-emerald-50 text-emerald-600' },
          { icon: Wallet, label: 'Học phí', to: '/tuition', color: 'bg-amber-50 text-amber-600' },
        ].map((action, i) => (
          <Link key={i} to={action.to} className="flex flex-col items-center gap-2 group">
            <div className={`h-14 w-14 rounded-2xl ${action.color} flex items-center justify-center shadow-sm border border-white group-active:scale-90 transition-all`}>
              <action.icon size={22} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight text-slate-500 text-center">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        
        {/* LEFT & MIDDLE CONTENT */}
        <div className="xl:col-span-9 space-y-6 md:space-y-8">
          
          {/* Progress & GPA Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Tiến độ tốt nghiệp">
               <div className="space-y-6">
                  <div className="flex items-end justify-between">
                     <span className="text-4xl font-black text-slate-900 tracking-tighter">{progressPercent}<span className="text-lg ml-0.5 text-slate-400">%</span></span>
                     <div className="text-right">
                        <p className="text-xs font-black text-slate-900">{statsData?.earnedCredits || 0}/{statsData?.totalCredits || 160}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tín chỉ tích lũy</p>
                     </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.3)]" 
                     />
                  </div>
               </div>
            </Card>

            <Card title="Kết quả học tập">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm trung bình (GPA)</p>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{statsData?.gpa || '0.00'}</span>
                     </div>
                     <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner border border-emerald-100">
                        <TrendingUp size={28} />
                     </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/50 rounded-xl w-fit">
                     <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase">+0.15</span>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">So với học kỳ trước</span>
                  </div>
               </div>
            </Card>
          </div>

          {/* Schedule Section */}
          <Card title="Lịch học & Sự kiện hôm nay" to="/schedule">
             <div className="space-y-4">
                 {statsData?.schedule?.length > 0 ? (
                   statsData.schedule.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 md:gap-5 p-4 rounded-3xl border border-slate-50 hover:bg-slate-50/50 transition-all group relative overflow-hidden bg-white shadow-sm">
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <span className="text-[8px] font-black uppercase">Tiết</span>
                            <span className="text-xl font-black leading-none">{item.periods}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-sm md:text-base font-black text-slate-900 truncate tracking-tight">{item.name}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                               <div className="flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> {item.time}</div>
                               <div className="flex items-center gap-1.5"><MapPin size={12} className="text-rose-500" /> {item.room}</div>
                            </div>
                         </div>
                         <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-colors shrink-0" />
                      </div>
                   ))
                 ) : (
                   <div className="py-16 text-center space-y-3 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm text-slate-300"><Calendar size={24} /></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hôm nay không có lịch học</p>
                   </div>
                 )}
             </div>
          </Card>

          {/* DRL & Finance Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card title="Kết quả rèn luyện" to="/training/results">
                <div className="flex items-center gap-6 md:gap-8">
                   <div className="relative h-28 w-28 md:h-32 md:w-32 shrink-0">
                      <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                         <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="3.5" />
                         <motion.circle 
                            cx="18" cy="18" r="16" fill="transparent" stroke="#10b981" strokeWidth="3.5" 
                            strokeDasharray="100" strokeDashoffset={100 - (statsData?.trainingScore || 0)} strokeLinecap="round"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 100 - (statsData?.trainingScore || 0) }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-black text-slate-900 tracking-tighter">{statsData?.trainingScore || 0}</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase">
                            {statsData?.trainingScore >= 90 ? 'X.Sắc' : statsData?.trainingScore >= 80 ? 'Giỏi' : statsData?.trainingScore >= 65 ? 'Khá' : 'TB'}
                         </span>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Tiêu chí còn thiếu:</p>
                         <ul className="space-y-1.5">
                            <li className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
                               <div className="h-1 w-1 rounded-full bg-rose-500" /> Thiếu điểm Thể chất
                            </li>
                            <li className="flex items-center gap-2 text-[10px] font-bold text-amber-500">
                               <div className="h-1 w-1 rounded-full bg-amber-500" /> Chưa nộp minh chứng
                            </li>
                         </ul>
                      </div>
                   </div>
                </div>
             </Card>

             <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                         <Wallet size={24} />
                      </div>
                      <div className="space-y-0.5">
                         <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Học phí cần nộp</h4>
                         <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Hạn chót: 30/04/2026</p>
                      </div>
                   </div>
                </div>
                <div className="flex items-end justify-between gap-4 relative z-10">
                   <span className="text-2xl font-black text-slate-900 tracking-tighter">8.450.000đ</span>
                   <Link to="/tuition" className="px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">Nộp ngay</Link>
                </div>
             </div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-3 space-y-6 md:space-y-8">
          
          {/* Notifications Card */}
          <Card title="Thông báo quan trọng" to="/notifications">
             <div className="space-y-6 pt-1">
                {statsData?.notifications?.length > 0 ? (
                  statsData.notifications.map((notif: any, i: number) => (
                    <div key={i} className="space-y-2.5 group cursor-pointer border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                              notif.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                              notif.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>{notif.tag}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{notif.time}</span>
                        </div>
                        <p className="text-xs font-black text-slate-800 leading-snug group-hover:text-blue-600 transition-colors tracking-tight">{notif.title}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center opacity-40">
                     <Bell size={32} className="mx-auto mb-2" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Không có thông báo</p>
                  </div>
                )}
             </div>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
