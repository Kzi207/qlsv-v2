import { ChevronRight, ChevronDown, BookOpen, Layers, Plus, Edit3, Trash2, X } from 'lucide-react';
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
      fixed lg:relative top-0 left-0 lg:top-auto lg:left-auto z-[100] lg:z-50 h-full bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden flex flex-col shadow-2xl lg:shadow-none
      ${isOpen ? 'w-80 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
        {isOpen ? (
          <>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Layers size={18} className="text-blue-600" /> Khoa & Ngành
            </h3>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={onAddFaculty}
                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Plus size={14} />
                </button>
              )}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('close-sidebar'))}
                className="p-1.5 bg-slate-100 text-slate-500 rounded-lg lg:hidden"
              >
                <X size={18} />
              </button>
            </div>
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
                className={`flex-1 flex items-center justify-between p-4 rounded-2xl transition-all ${
                  expandedFaculties.includes(faculty.id) ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <BookOpen size={20} className="shrink-0 text-blue-500" />
                  {isOpen && <span className="text-[12px] font-black uppercase truncate tracking-tight">{faculty.name}</span>}
                </div>
                {isOpen && (expandedFaculties.includes(faculty.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </button>
              
              {isAdmin && isOpen && (
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => onEditFaculty?.(faculty)} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={14}/></button>
                  <button onClick={() => onDeleteFaculty?.(faculty.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button>
                  <button onClick={() => onAddMajor?.(faculty.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"><Plus size={14}/></button>
                </div>
              )}
            </div>

            {expandedFaculties.includes(faculty.id) && (
              <div className="space-y-1 ml-6 border-l-2 border-slate-100 pl-3">
                {faculty.majors.map((major: any) => (
                  <div key={major.id} className="flex items-center group">
                    <button 
                      onClick={() => onSelectMajor(major.id)}
                      className={`flex-1 text-left p-4 rounded-2xl text-[11px] font-black uppercase transition-all ${
                        selectedMajorId === major.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isOpen ? major.name : major.code}
                    </button>
                    {isAdmin && isOpen && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onEditMajor?.(major)} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={14}/></button>
                        <button onClick={() => onDeleteMajor?.(major.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button>
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
