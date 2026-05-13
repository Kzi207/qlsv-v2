import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  trend?: {
    text: string;
    isUp: boolean;
  };
  progress?: number;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple' | 'sky';
}

const colors = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100', bar: 'bg-blue-600' },
  sky: { bg: 'bg-sky-50', icon: 'text-sky-600', border: 'border-sky-100', bar: 'bg-sky-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100', bar: 'bg-emerald-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100', bar: 'bg-amber-600' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100', bar: 'bg-rose-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100', bar: 'bg-indigo-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100', bar: 'bg-purple-600' },
};

const StatCard = ({ icon: Icon, label, value, unit, subValue, trend, progress, color }: StatCardProps) => {
  const theme = colors[color];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl p-5 border border-slate-100/60 shadow-sm flex flex-col h-full group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-xl ${theme.bg} ${theme.icon} flex items-center justify-center border ${theme.border} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight leading-none">{label}</p>
      </div>
      
      <div className="mt-1 flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</span>
          {unit && <span className="text-sm font-black text-slate-400 uppercase tracking-tight">{unit}</span>}
        </div>
        
        {trend && (
          <div className="flex flex-col mt-2">
            <div className={`text-xs font-black ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.isUp ? '+' : '-'}{trend.text}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">so với học kỳ trước</p>
          </div>
        )}

        {subValue && !trend && !progress && (
          <p className="text-[11px] font-bold text-slate-400 tracking-tight mt-2">{subValue}</p>
        )}

        {progress !== undefined && (
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={`h-full ${theme.bar}`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
