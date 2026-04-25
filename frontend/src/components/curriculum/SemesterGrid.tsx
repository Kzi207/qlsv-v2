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
  const [expandedSemesters, setExpandedSemesters] = useState<number[]>([1]); // Expand first by default on mobile

  const toggleSemester = (id: number) => {
    setExpandedSemesters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!curriculum) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
      {curriculum.curriculumSemesters.map((semester: any) => {
        const totalCredits = semester.subjects.reduce((acc: number, s: any) => acc + s.subject.credits, 0);
        const isOverloaded = totalCredits > 16;
        const isUnderloaded = totalCredits < 9 && semester.semesterNumber < 13;

        return (
          <div 
            key={semester.id} 
            className={`bg-white rounded-[2rem] border transition-all overflow-hidden h-fit ${
              isOverloaded ? 'border-rose-200' : 'border-slate-100'
            }`}
          >
            {/* Semester Header */}
            <div 
              className={`p-6 flex items-center justify-between cursor-pointer md:cursor-default ${
                isOverloaded ? 'bg-rose-50/50' : 'bg-slate-50/30'
              }`}
              onClick={() => toggleSemester(semester.id)}
            >
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Học kỳ {semester.semesterNumber}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                     isOverloaded ? 'bg-rose-100 text-rose-600' : 
                     isUnderloaded ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                   }`}>
                     {totalCredits} Tín chỉ
                   </span>
                   {isOverloaded && <AlertCircle size={14} className="text-rose-500 animate-pulse" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAdd(semester.id); }}
                    className="h-8 w-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Plus size={16} />
                  </button>
                )}
                <div className="md:hidden text-slate-400">
                  {expandedSemesters.includes(semester.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
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
                  <div className="p-4 space-y-3">
                    {semester.subjects.map((item: any) => (
                      <SubjectCard 
                        key={item.id}
                        item={item}
                        isAdmin={isAdmin}
                        onEdit={() => onEdit(item)}
                        onDelete={() => onDelete(item.id)}
                      />
                    ))}
                    {semester.subjects.length === 0 && (
                      <div className="py-8 text-center text-slate-300">
                        <Info size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Chưa có môn học</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Add Semester Button */}
      {isAdmin && (
        <button 
          onClick={onAddSemester}
          className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 text-slate-400 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all group"
        >
           <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Plus size={32} />
           </div>
           <p className="text-xs font-black uppercase tracking-[0.2em]">Thêm học kỳ mới</p>
        </button>
      )}
    </div>
  );
};

export default SemesterGrid;
