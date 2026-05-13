import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

// V2 Composite Components
import StudentHeader from '../../components/v2/StudentHeader';
import StatisticCards from '../../components/v2/StatisticCards';
import TodaySchedule from '../../components/v2/TodaySchedule';
import Notifications from '../../components/v2/Notifications';
import QuickActions from '../../components/v2/QuickActions';
import TopbarV2 from '../../components/v2/Topbar';

const StudentDashboardV2 = () => {
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/students/dashboard-stats');
        setStatsData(response.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats', err);
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 relative z-10" size={60} strokeWidth={2.5} />
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">
          Đang tải dữ liệu hệ thống...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-sm border border-rose-100">
          <AlertCircle size={40} strokeWidth={2.5} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Đã có lỗi xảy ra</h3>
        <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-[#0046a8] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#003580] transition-all shadow-lg active:scale-95"
        >
          Thử lại ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700">
      {/* Topbar for internal navigation & info */}
      <TopbarV2 />

      {/* Hero Section */}
      <StudentHeader />

      {/* Overview Stats Row */}
      <StatisticCards stats={statsData} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Left Column: Today's Schedule (8/12) */}
        <div className="lg:col-span-8">
          <TodaySchedule schedule={statsData?.schedule || []} />
        </div>

        {/* Right Column: Notifications (4/12) */}
        <div className="lg:col-span-4">
          <Notifications notifications={statsData?.notifications || []} />
        </div>
      </div>

      {/* Bottom Section: Quick Actions */}
      <section>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Truy cập nhanh</h3>
        </div>
        <QuickActions />
      </section>

      {/* Footer / Credits Spacer for Bottom Nav on Mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

export default StudentDashboardV2;
