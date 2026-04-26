import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  QrCode, 
  User 
} from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Calendar, label: 'Lịch học', path: '/schedule' },
    { icon: QrCode, label: 'Điểm danh', path: '/attendance/scan' }, // Assuming attendance is QR scan
    { icon: User, label: 'Cá nhân', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-3 z-40 lg:hidden safe-area-bottom">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative group ${
                isActive ? 'text-[#0046a8]' : 'text-slate-400'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-blue-50 scale-110' : 'group-active:scale-90'
              }`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-black tracking-tight ${
                isActive ? 'opacity-100' : 'opacity-60'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
