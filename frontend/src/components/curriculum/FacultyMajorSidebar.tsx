import { ChevronRight, ChevronDown, BookOpen, Layers, Plus, Edit3, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FacultyMajorSidebarProps {
  faculties: any[];
  selectedMajorId: number | null;
  onSelectMajor: (id: number) => void;
  isOpen: boolean;
  isAdmin?: boolean;
  onAddFaculty?: () => void;
  onEditFaculty?: (faculty: any) => void;
  onDeleteFaculty?: (id: number) => void;
  onAddMajor?: (facultyId: number) => void;
  onEditMajor?: (major: any) => void;
  onDeleteMajor?: (id: number) => void;
}

const FacultyMajorSidebar = ({ 
  faculties, 
  selectedMajorId, 
  onSelectMajor, 
  isOpen, 
  isAdmin,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
  onAddMajor,
  onEditMajor,
  onDeleteMajor
}: FacultyMajorSidebarProps) => {
  const [expandedFaculties, setExpandedFaculties] = useState<number[]>(faculties.map(f => f.id));

  const toggleFaculty = (id: number) => {
    setExpandedFaculties(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <aside className={`
      fixed lg:relative z-50 h-full bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden flex flex-col
      ${isOpen ? 'w-80 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
        {isOpen ? (
          <>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Layers size={18} className="text-blue-600" /> Khoa & Ngành
            </h3>
            {isAdmin && (
              <button 
                onClick={onAddFaculty}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
              >
                <Plus size={14} />
              </button>
            )}
          </>
        ) : (
          <Layers size={24} className="text-blue-600 mx-auto" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {faculties.map(faculty => (
          <div key={faculty.id} className="space-y-1">
            <div className="flex items-center group">
              <button 
                onClick={() => toggleFaculty(faculty.id)}
                className={`flex-1 flex items-center justify-between p-3 rounded-xl transition-all ${
                  expandedFaculties.includes(faculty.id) ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <BookOpen size={18} className="shrink-0" />
                  {isOpen && <span className="text-[11px] font-black uppercase truncate">{faculty.name}</span>}
                </div>
                {isOpen && (expandedFaculties.includes(faculty.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </button>
              
              {isAdmin && isOpen && (
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => onEditFaculty?.(faculty)} className="p-1 text-slate-400 hover:text-blue-600"><Edit3 size={12}/></button>
                  <button onClick={() => onDeleteFaculty?.(faculty.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12}/></button>
                  <button onClick={() => onAddMajor?.(faculty.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"><Plus size={12}/></button>
                </div>
              )}
            </div>

            {expandedFaculties.includes(faculty.id) && (
              <div className="space-y-1 ml-4 border-l-2 border-slate-100 pl-2">
                {faculty.majors.map((major: any) => (
                  <div key={major.id} className="flex items-center group">
                    <button 
                      onClick={() => onSelectMajor(major.id)}
                      className={`flex-1 text-left p-3 rounded-xl text-[10px] font-bold uppercase transition-all ${
                        selectedMajorId === major.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isOpen ? major.name : major.code}
                    </button>
                    {isAdmin && isOpen && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onEditMajor?.(major)} className="p-1 text-slate-400 hover:text-blue-600"><Edit3 size={12}/></button>
                        <button onClick={() => onDeleteMajor?.(major.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12}/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default FacultyMajorSidebar;
