import { Edit3, Trash2, Book, AlertCircle, Bookmark } from 'lucide-react';

interface SubjectCardProps {
  item: any;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SubjectCard = ({ item, isAdmin, onEdit, onDelete }: SubjectCardProps) => {
  const { subject, isRequired, prerequisite } = item;

  return (
    <div className={`p-4 rounded-2xl border transition-all group relative ${
      isRequired ? 'bg-white border-slate-100 hover:border-blue-200' : 'bg-slate-50 border-transparent italic'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 overflow-hidden">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{subject.code}</p>
          <h5 className="text-xs font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
            {subject.name}
          </h5>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
           <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
             {subject.credits} TC
           </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
         <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-lg">
            <Book size={10} /> {subject.theoryPeriods}T / {subject.practicePeriods}H
         </div>
         {isRequired && (
            <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-lg">
               <Bookmark size={10} /> Bắt buộc
            </div>
         )}
      </div>

      {prerequisite && (
        <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
           <AlertCircle size={10} className="text-amber-600" />
           <p className="text-[8px] font-black text-amber-700 uppercase leading-tight truncate">
             Tiên quyết: {prerequisite.name}
           </p>
        </div>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg">
           <button onClick={onEdit} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              <Edit3 size={14} />
           </button>
           <button onClick={onDelete} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
              <Trash2 size={14} />
           </button>
        </div>
      )}
    </div>
  );
};

export default SubjectCard;
