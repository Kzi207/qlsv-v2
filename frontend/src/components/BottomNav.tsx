import { NavLink } from 'react-router-dom';
import { Home, Calendar, Award, QrCode, User } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Calendar, label: 'Lịch học', path: '/schedule', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: Award, label: 'Bảng điểm', path: '/grades', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: QrCode, label: 'Điểm danh', path: '/attendance/scan', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: User, label: 'Tài khoản', path: '/profile', color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/80 backdrop-blur-2xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      <div className="mx-auto grid grid-cols-5 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                isActive ? 'scale-105' : 'opacity-60 active:scale-95'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive ? `${item.bg} ${item.color} shadow-sm border border-white` : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.05em] transition-all duration-300 ${
                    isActive ? 'text-slate-900 opacity-100' : 'text-slate-400 opacity-80'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
