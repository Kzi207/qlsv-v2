import { Plus, ChevronDown, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';
import SubjectCard from './SubjectCard.tsx';
import { motion, AnimatePresence } from 'framer-motion';

interface SemesterGridProps {
  curriculum: any;
  isAdmin: boolean;
  onAdd: (id: number) => void;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onAddSemester?: () => void;
}

const SemesterGrid = ({ curriculum, isAdmin, onAdd, onEdit, onDelete, onAddSemester }: SemesterGridProps) => {
  const [expandedSemesters, setExpandedSemesters] = useState<number[]>([1]); 

  const toggleSemester = (id: number) => {
    setExpandedSemesters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!curriculum) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {(curriculum.curriculumSemesters || []).map((semester: any) => {
        // Safe credit calculation
        const totalCredits = (semester.subjects || []).reduce((acc: number, s: any) => {
          const credits = s.credits || s.subject?.credits || 0;
          return acc + credits;
        }, 0);

        const isOverloaded = totalCredits > 16;
        const isUnderloaded = totalCredits < 9 && semester.semesterNumber < 13;

        return (
          <div 
            key={semester.id} 
            className={`bg-white rounded-2xl border transition-all overflow-hidden h-fit shadow-sm ${
              isOverloaded ? 'border-rose-200 shadow-rose-100/50' : 'border-slate-100'
            }`}
          >
            {/* Semester Header - Standardized size */}
            <div 
              className={`p-4 flex items-center justify-between cursor-pointer md:cursor-default ${
                isOverloaded ? 'bg-rose-50/30' : 'bg-slate-50/30'
              }`}
              onClick={() => toggleSemester(semester.id)}
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  Học kỳ {semester.semesterNumber}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                     isOverloaded ? 'bg-rose-100 text-rose-600' : 
                     isUnderloaded ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                   }`}>
                     {totalCredits} Tín chỉ
                   </span>
                   {isOverloaded && <AlertCircle size={12} className="text-rose-500 animate-pulse" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAdd(semester.id); }}
                    className="h-7 w-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                )}
                <div className="md:hidden text-slate-400">
                  {expandedSemesters.includes(semester.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
            </div>

            {/* Subject List */}
            <AnimatePresence initial={false}>
              {(expandedSemesters.includes(semester.id) || window.innerWidth >= 768) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 space-y-2">
                    {(semester.subjects || []).map((item: any) => (
                      <SubjectCard 
                        key={item.id}
                        item={item}
                        isAdmin={isAdmin}
                        onEdit={() => onEdit(item)}
                        onDelete={() => onDelete(item.id)}
                      />
                    ))}
                    {(semester.subjects?.length || 0) === 0 && (
                      <div className="py-6 text-center text-slate-300">
                        <Info size={20} className="mx-auto mb-1 opacity-20" />
                        <p className="text-[9px] font-bold uppercase tracking-widest">Chưa có môn học</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Add Semester Button - Standardized size */}
      {isAdmin && (
        <button 
          onClick={onAddSemester}
          className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all group"
        >
           <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Plus size={20} />
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest">Thêm học kỳ mới</p>
        </button>
      )}
    </div>
  );
};

export default SemesterGrid;
