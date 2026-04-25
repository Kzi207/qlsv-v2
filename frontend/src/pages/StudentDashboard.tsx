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
  AlertCircle,
  FileText,
  Download,
  Plus
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
    <div className="p-6 flex-1">{children}</div>
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
    <div className="max-w-[1600px] mx-auto animate-fade-up">
      {/* 3-Column Layout Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT & MIDDLE CONTENT (Dashboard Main) - 9 columns on XL */}
        <div className="xl:col-span-9 space-y-8">
          
          {/* Row 1: Welcome & Overview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Welcome Card */}
            <div className="md:col-span-6 bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
               <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
               <div className="relative z-10 flex items-center gap-6">
                  <div className="h-20 w-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden shrink-0">
                     <span className="text-3xl font-black">{userName[0]}</span>
                  </div>
                  <div className="space-y-1">
                     <h2 className="text-2xl font-black tracking-tight">Chào {userName},</h2>
                     <p className="text-blue-100 text-sm font-medium opacity-90">Chúc bạn một ngày học tập hiệu quả!</p>
                  </div>
               </div>
               <div className="mt-8 flex gap-3 relative z-10">
                  <Link to="/attendance/scan" className="px-5 py-2.5 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
                     <QrCode size={16} /> Điểm danh ngay
                  </Link>
               </div>
            </div>

            {/* Progress Card */}
            <div className="md:col-span-3">
               <Card title="Tiến độ tốt nghiệp">
                  <div className="space-y-6 pt-2">
                     <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{progressPercent}<span className="text-lg ml-0.5 text-slate-400">%</span></span>
                        <div className="text-right">
                           <p className="text-xs font-black text-slate-900">{statsData?.earnedCredits || 0}/{statsData?.totalCredits || 160}</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tín chỉ</p>
                        </div>
                     </div>
                     <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${progressPercent}%` }}
                           transition={{ duration: 1, ease: 'easeOut' }}
                           className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]" 
                        />
                     </div>
                  </div>
               </Card>
            </div>

            {/* GPA Card */}
            <div className="md:col-span-3">
               <Card title="GPA Tích lũy">
                  <div className="space-y-4 pt-2">
                     <div className="flex items-center justify-between">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{statsData?.gpa || '0.00'}</span>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                           <TrendingUp size={24} />
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-md">+0.15</span>
                        <span className="text-[10px] font-bold text-slate-400">So với kỳ trước</span>
                     </div>
                  </div>
               </Card>
            </div>
          </div>

          {/* Row 2: Schedule & DRL */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Today's Schedule */}
            <div className="md:col-span-7">
               <Card title="Lịch học hôm nay" to="/schedule">
                  <div className="space-y-4 pt-2">
                      {statsData?.schedule?.length > 0 ? (
                        statsData.schedule.map((item: any, i: number) => (
                           <div key={i} className="flex items-center gap-5 p-4 rounded-[1.5rem] border border-slate-50 hover:bg-slate-50 transition-colors group">
                              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                                 <span className="text-[8px] font-black uppercase">Tiết</span>
                                 <span className="text-xl font-black leading-none">{item.periods}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-black text-slate-900 truncate">{item.name}</h4>
                                 <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                    <div className="flex items-center gap-1"><Clock size={12} /> {item.time}</div>
                                    <div className="flex items-center gap-1"><MapPin size={12} /> {item.room}</div>
                                 </div>
                              </div>
                              {item.type === 'Hybrid' && (
                                 <a href={item.link} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">Vào lớp Online</a>
                              )}
                           </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-slate-400 font-bold text-xs">Hôm nay không có lịch học</div>
                      )}
                  </div>
               </Card>
            </div>

            {/* DRL Chart */}
            <div className="md:col-span-5">
               <Card title="Điểm rèn luyện Realtime" to="/training">
                  <div className="flex items-center gap-8 pt-2">
                     <div className="relative h-32 w-32 shrink-0">
                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                           <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                           <motion.circle 
                              cx="18" cy="18" r="16" fill="transparent" stroke="#10b981" strokeWidth="4" 
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
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-700">Tiêu chí còn thiếu:</p>
                           <ul className="space-y-1.5">
                              <li className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
                                 <AlertCircle size={12} /> Thiếu 5 điểm Thể chất
                              </li>
                              <li className="flex items-center gap-2 text-[10px] font-bold text-amber-500">
                                 <AlertCircle size={12} /> Chưa nộp minh chứng Đoàn
                              </li>
                           </ul>
                        </div>
                        <Link to="/training/evaluation/self" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                           Cập nhật ngay <ChevronRight size={12} />
                        </Link>
                     </div>
                  </div>
               </Card>
            </div>
          </div>

          {/* Row 3: Finance & Services */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             {/* Finance Warning */}
             <div className="md:col-span-6">
                <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex items-center justify-between shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                   <div className="flex items-center gap-6 relative z-10">
                      <div className="h-16 w-16 rounded-3xl bg-white flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                         <Wallet size={32} />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-lg font-black text-slate-900">Nhắc nợ học phí</h4>
                         <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Hạn nộp: 30/04/2026</p>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-2 relative z-10">
                      <span className="text-2xl font-black text-slate-900">8.450.000đ</span>
                      <Link to="/tuition" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 transition-transform">Thanh toán ngay</Link>
                   </div>
                </div>
             </div>

             {/* Administrative Services */}
             <div className="md:col-span-6">
                <Card title="Dịch vụ hành chính" to="/services">
                   <div className="space-y-4 pt-1">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all group/item">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-blue-600 transition-colors">
                               <FileText size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900">Xác nhận sinh viên</p>
                               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Đã hoàn thành</span>
                            </div>
                         </div>
                         <button className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <Download size={16} />
                         </button>
                      </div>
                   </div>
                </Card>
             </div>
          </div>

        </div>

        {/* RIGHT PANEL - 3 columns on XL */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Notifications Card */}
          <Card title="Thông báo mới" to="/notifications">
             <div className="space-y-5 pt-1">
                {statsData?.notifications?.length > 0 ? (
                  statsData.notifications.map((notif: any, i: number) => (
                    <div key={i} className="space-y-2 group cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                              notif.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                              notif.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>{notif.tag}</span>
                          <span className="text-[9px] font-bold text-slate-400">{notif.time}</span>
                        </div>
                        <p className="text-xs font-black text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">{notif.title}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-400 font-bold text-xs">Không có thông báo mới</div>
                )}
             </div>
          </Card>

          {/* Timeline Card */}
          <Card title="Timeline 7 ngày tới">
             <div className="space-y-6 pt-2">
                {statsData?.timeline?.length > 0 ? (
                  statsData.timeline.map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 relative">
                        {i < statsData.timeline.length - 1 && <div className="absolute top-10 left-5 bottom-0 w-px bg-slate-100" />}
                        <div className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm border ${
                          item.type === 'assignment' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          item.type === 'event' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          <span className="text-[10px] font-black leading-none">{item.day}</span>
                          <span className="text-[8px] font-bold mt-0.5">{item.date}</span>
                        </div>
                        <div className="flex-1 space-y-2 pb-6">
                          <p className="text-xs font-black text-slate-800 leading-tight">{item.title}</p>
                          {item.join && (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
                                <Plus size={10} /> Đăng ký tham gia
                              </button>
                          )}
                        </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-400 font-bold text-xs">Không có sự kiện sắp tới</div>
                )}
             </div>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
