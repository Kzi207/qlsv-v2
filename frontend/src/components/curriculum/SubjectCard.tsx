import { Edit3, Trash2, Book, AlertCircle, Bookmark, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubjectCardProps {
  item: any;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isPassed?: boolean;
}

const SubjectCard = ({ item, isAdmin, onEdit, onDelete, isPassed }: SubjectCardProps) => {
  // Safe access for both flattened and nested structures
  const code = item.code || item.subject?.code || 'N/A';
  const name = item.name || item.subject?.name || 'Chưa rõ tên';
  const credits = item.credits || item.subject?.credits || 0;
  const theory = item.theoryPeriods || item.subject?.theoryPeriods || 0;
  const practice = item.practicePeriods || item.subject?.practicePeriods || 0;
  const isRequired = item.isRequired;
  const prerequisite = item.prerequisite;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-5 rounded-[2rem] border transition-all group relative overflow-hidden ${
        isPassed 
          ? 'bg-emerald-50/50 border-emerald-100' 
          : isRequired 
            ? 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5' 
            : 'bg-slate-50 border-transparent'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{code}</p>
            {isPassed && (
              <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase bg-emerald-100/50 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Đã đạt
              </span>
            )}
          </div>
          <h5 className="text-[13px] font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {name}
          </h5>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-3">
           <span className="text-[10px] font-black text-blue-600 bg-white border border-blue-100 px-2.5 py-1 rounded-xl shadow-sm uppercase">
             {credits} TC
           </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100/50">
         <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase bg-slate-100/50 px-2.5 py-1 rounded-xl">
            <Book size={12} className="text-slate-400" /> {theory} Lý thuyết • {practice} Thực hành
         </div>
         {isRequired && (
            <div className="flex items-center gap-1.5 text-[8px] font-black text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
               <Bookmark size={12} /> Bắt buộc
            </div>
         )}
      </div>

      {prerequisite && (
        <div className="mt-3 p-2.5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center gap-2">
           <AlertCircle size={12} className="text-amber-600 shrink-0" />
           <p className="text-[9px] font-bold text-amber-700 uppercase leading-tight truncate">
             Tiên quyết: {prerequisite.name}
           </p>
        </div>
      )}

      {/* Admin Actions - Compact */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white shadow-xl shadow-slate-200 border border-slate-100 p-1.5 rounded-2xl">
           <button onClick={onEdit} className="h-8 w-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-xl transition-colors active:scale-90">
              <Edit3 size={14} />
           </button>
           <button onClick={onDelete} className="h-8 w-8 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-90">
              <Trash2 size={14} />
           </button>
        </div>
      )}

      {/* Decorative Gradient Overlay for Passed */}
      {isPassed && (
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <CheckCircle2 size={80} />
        </div>
      )}
    </motion.div>
  );
};

export default SubjectCard;
