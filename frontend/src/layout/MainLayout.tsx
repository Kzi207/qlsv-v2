import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from '../components/BottomNav';
import { Menu, Bell } from 'lucide-react';


const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Trang chủ';
    if (path.includes('elearning')) return 'E-Learning';
    if (path.includes('schedule')) return 'Lịch học';
    if (path.includes('grades')) return 'Bảng điểm';
    if (path.includes('profile')) return 'Cá nhân';
    if (path.includes('notifications')) return 'Thông báo';
    if (path.includes('tuition')) return 'Học phí';
    if (path.includes('training')) return 'Điểm rèn luyện';
    return 'Hệ thống';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} />
      
      <div className="lg:ml-[240px] min-h-screen flex flex-col transition-all duration-500">
        {/* Blue Mobile Header */}
        <header className="lg:hidden bg-[#0046a8] px-5 py-5 sticky top-0 z-30 flex items-center justify-between shadow-lg shadow-blue-900/10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-white active:scale-90 transition-all p-1"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">
              {getPageTitle()}
            </h1>
          </div>
          
          <button 
            onClick={() => navigate('/notifications')}
            className="text-white relative active:scale-90 transition-all p-1"
          >
             <Bell size={24} />
             <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 rounded-full border-2 border-[#0046a8] flex items-center justify-center">
               <span className="text-[8px] font-black">1</span>
             </div>
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-32 lg:pb-8">
          <Outlet />
        </main>

        {!isSidebarOpen && <BottomNav />}
      </div>
    </div>
  );
};

export default MainLayout;
