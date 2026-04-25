import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  PieChart, 
  TrendingUp, 
  Plus, 
  Download, 
  Sparkles,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import ELearningRightPanel from '../../components/elearning/ELearningRightPanel';

const AdminDashboard: React.FC = () => {
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/elearning/stats');
      setStatsData(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    }
  };

  const stats = [
    { label: 'Tổng số môn học', value: statsData?.totalSubjects || 0, icon: BookOpen, color: 'bg-blue-600' },
    { label: 'Lớp E-Learning', value: statsData?.totalCourses || 0, icon: Layers, color: 'bg-indigo-600' },
    { label: 'Giảng viên', value: statsData?.totalTeachers || 0, icon: Users, color: 'bg-emerald-500' },
    { label: 'Sinh viên', value: statsData?.totalStudents || 0, icon: GraduationCap, color: 'bg-slate-900' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        
        {/* Main Content */}
        <div className="space-y-10">
          
          {/* Admin Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <ShieldAlert size={12} /> E-Learning Administrator
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hệ thống Đào tạo</h1>
              <p className="text-slate-500 font-bold text-sm">Giám sát hoạt động đào tạo trực tuyến trên toàn hệ thống.</p>
            </div>

            <div className="flex items-center gap-3">
               <button className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                  <Plus size={18} /> Tạo lớp học
               </button>
               <button className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-xl shadow-slate-200/20">
                  <Download size={20} />
               </button>
            </div>
          </div>

          {/* Global Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {stats.map((stat, idx) => (
               <motion.div 
                 key={idx}
                 whileHover={{ y: -5 }}
                 className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-4"
               >
                  <div className="flex items-center justify-between">
                     <div className={`h-10 w-10 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                        <stat.icon size={20} />
                     </div>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                     <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
                  </div>
               </motion.div>
             ))}
          </div>

          {/* Performance Charts Placeholder Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <TrendingUp size={18} className="text-blue-600" /> Tỷ lệ hoàn thành học tập
                   </h3>
                   <PieChart size={18} className="text-slate-400" />
                </div>
                <div className="h-64 w-full bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-dashed border-slate-200 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="text-center space-y-2">
                      <Sparkles className="mx-auto text-blue-200" size={32} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dữ liệu đang được tổng hợp</p>
                   </div>
                </div>
             </div>
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <TrendingUp size={18} className="text-emerald-600" /> Hoạt động theo Khoa
                   </h3>
                   <PieChart size={18} className="text-slate-400" />
                </div>
                <div className="h-64 w-full bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-dashed border-slate-200 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="text-center space-y-2">
                      <Users className="mx-auto text-emerald-200" size={32} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dữ liệu đang được tổng hợp</p>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* Right Sidebar Panel */}
        <div className="hidden lg:block">
           <div className="sticky top-8">
              <ELearningRightPanel role="QTV" />
           </div>
        </div>

      </div>
    </div>
  );
};

// Required for GraduationCap icon that was missing in some imports
const GraduationCap = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

export default AdminDashboard;
