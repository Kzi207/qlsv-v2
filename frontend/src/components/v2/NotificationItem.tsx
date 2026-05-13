import type { LucideIcon } from 'lucide-react';

interface NotificationItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  date: string;
  isNew?: boolean;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple';
}

const colors = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
};

const NotificationItem = ({ icon: Icon, title, description, date, isNew, color }: NotificationItemProps) => {
  const theme = colors[color] || colors.blue;

  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
      <div className={`h-10 w-10 rounded-xl ${theme.bg} ${theme.icon} flex items-center justify-center shrink-0 border ${theme.border} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={18} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h5 className="text-[13px] font-black text-slate-800 leading-tight mb-1 truncate group-hover:text-blue-600 transition-colors">
          {title}
        </h5>
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold text-slate-400 line-clamp-1 truncate uppercase tracking-tight">
            {description}
          </p>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            {date}
          </p>
        </div>
      </div>

      {isNew && (
        <div className="shrink-0 flex items-center">
          <span className="px-2 py-0.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
            Mới
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
