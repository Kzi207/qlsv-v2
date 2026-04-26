import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, QrCode, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Calendar, label: 'Lịch học', path: '/schedule' },
    { icon: QrCode, label: 'Điểm danh', path: '/attendance/scan' },
    { icon: User, label: 'Cá nhân', path: '/profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 z-[100] flex items-center justify-between pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={index}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'scale-110' : ''}`}>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
