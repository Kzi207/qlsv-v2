import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface QuickAccessCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  color: 'blue' | 'purple' | 'emerald' | 'rose' | 'amber' | 'indigo';
}

const colors = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
};

const QuickAccessCard = ({ icon: Icon, label, description, href, color }: QuickAccessCardProps) => {
  const theme = colors[color];

  return (
    <Link to={href} className="block group">
      <motion.div 
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-[2rem] p-6 border border-slate-100/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center gap-5 h-full"
      >
        <div className={`h-14 w-14 rounded-2xl ${theme.bg} ${theme.icon} flex items-center justify-center shrink-0 border ${theme.border} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-black text-slate-900 tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{label}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none truncate">{description}</p>
        </div>
      </motion.div>
    </Link>
  );
};

export default QuickAccessCard;
