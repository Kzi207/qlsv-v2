import { Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const TopbarV2 = () => {
  const { user } = useAuthStore();
  
  return (
    <div className="hidden lg:flex items-center justify-end gap-6 mb-8 px-2">
      {/* Notifications */}
      <button className="relative h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all hover:shadow-md">
        <Bell size={22} strokeWidth={2} />
        <span className="absolute top-2 right-2 h-4 w-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black text-white">
          3
        </span>
      </button>

      {/* User Profile */}
      <div className="flex items-center gap-3 py-2 px-3 bg-white shadow-sm border border-slate-50 rounded-2xl hover:shadow-md transition-all cursor-pointer group">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          <User size={20} />
        </div>
        <div className="text-left pr-2">
          <p className="text-[13px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">
            {(user?.student as any)?.mssv || 'CNDT2411081'}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sinh viên</p>
        </div>
        <ChevronDown size={14} className="text-slate-300" />
      </div>
    </div>
  );
};

import { User } from 'lucide-react';
export default TopbarV2;
