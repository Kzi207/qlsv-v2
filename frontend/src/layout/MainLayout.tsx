import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} />
      
      <div className="lg:ml-80 min-h-screen flex flex-col transition-all duration-500">
        {/* Mobile Header - Ultra Clean */}
        <header className="lg:hidden bg-blue-600 border-b border-blue-500 p-4 sticky top-0 z-30 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="h-11 w-11 flex items-center justify-center bg-white/10 text-white rounded-xl active:scale-90 transition-all border border-white/20 shadow-sm"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center">
               <h2 className="text-white font-black text-sm uppercase tracking-widest">Lịch học/ lịch thi</h2>
            </div>
          </div>
          
          <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-white text-sm shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </header>

        <main className="flex-1 p-3 md:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
