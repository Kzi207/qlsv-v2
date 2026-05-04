import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from '../components/BottomNav';
import AdminTopBar from '../components/navigation/AdminTopBar';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

const ADMIN_ROLES = new Set(['QTV', 'BCH', 'LECTURER']);

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mobileUnreadCount, setMobileUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const role = String(user?.role || '').toUpperCase();
  const isAdmin = ADMIN_ROLES.has(role);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setMobileUnreadCount(0);
      return;
    }

    const loadNotificationCenter = async () => {
      try {
        const response = await api.get<{ unreadCount?: number }>('/notifications/center', {
          params: { limit: 8 },
        });
        setMobileUnreadCount(Number(response.data?.unreadCount || 0));
      } catch (error) {
        console.error('Failed to load mobile unread count', error);
      }
    };

    loadNotificationCenter();
    const timer = window.setInterval(loadNotificationCenter, 30000);
    return () => window.clearInterval(timer);
  }, [isAdmin]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    if (path === '/') return 'Trang chu';
    if (path.includes('elearning')) return 'E-Learning';
    if (path.includes('schedule') || path.includes('timetable')) return 'Thoi khoa bieu';
    if (path.includes('grades')) return 'Bang diem';
    if (path.includes('profile')) return 'Ca nhan';
    if (path.includes('notifications')) return 'Thong bao';
    if (path.includes('tuition') || path.includes('finance')) return 'Hoc phi';
    if (path.includes('training')) return 'Diem ren luyen';
    if (path.includes('curriculum')) return 'Chuong trinh hoc';
    if (path.includes('attendance')) return 'Diem danh';

    return 'He thong';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

      <div className="min-h-screen flex flex-col transition-[margin] duration-300 lg:ml-[260px]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0046a8]/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-lg shadow-blue-900/15 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-white transition-all active:scale-95 active:bg-white/10"
              aria-label="Mo menu"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <h1 className="text-base font-bold leading-none tracking-tight text-white sm:text-lg">{pageTitle}</h1>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="relative rounded-xl p-2 text-white transition-all active:scale-95 active:bg-white/10"
            aria-label="Mo thong bao"
          >
            <Bell size={24} />
            {mobileUnreadCount > 0 && (
              <div className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#0046a8] bg-rose-500 px-1">
                <span className="text-[8px] font-black">
                  {mobileUnreadCount > 99 ? '99+' : mobileUnreadCount}
                </span>
              </div>
            )}
          </button>
        </header>

        <AdminTopBar />

        <main className="page-shell flex-1 px-3 pt-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] sm:px-4 md:px-6 lg:px-8 lg:pt-3 lg:pb-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1760px] min-w-0">
            <Outlet />
          </div>
        </main>

        {!isSidebarOpen && <BottomNav />}
      </div>
    </div>
  );
};

export default MainLayout;

