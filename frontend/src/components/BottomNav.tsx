import { NavLink } from 'react-router-dom';
import { Home, Calendar, QrCode, User } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Calendar, label: 'Lịch học', path: '/schedule' },
    { icon: QrCode, label: 'Điểm danh', path: '/attendance/scan' },
    { icon: User, label: 'Cá nhân', path: '/profile' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/92 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl px-1 transition-all duration-200 ${
                isActive ? 'text-[#0046a8]' : 'text-slate-400 active:scale-95'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`rounded-xl p-2 transition-all duration-200 ${
                    isActive ? 'bg-blue-50 text-[#0046a8]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  <item.icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-black tracking-tight ${
                    isActive ? 'opacity-100' : 'opacity-70'
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
