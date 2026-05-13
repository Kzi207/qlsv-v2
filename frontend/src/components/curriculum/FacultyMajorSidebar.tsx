import { 
  ChevronDown, 
  Search,
  Plus,
  Trash2,
  Layers,
  GraduationCap,
  X,
  Edit3
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  isPermanent?: boolean;
}

const FacultyMajorSidebar = ({ 
  faculties = [], 
  selectedMajorId, 
  onSelectMajor, 
  isOpen, 
  isAdmin,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
  onAddMajor,
  onEditMajor,
  onDeleteMajor,
  isPermanent
}: FacultyMajorSidebarProps) => {
  const [expandedFaculties, setExpandedFaculties] = useState<number[]>(faculties?.map(f => f.id) || []);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaculty = (id: number) => {
    setExpandedFaculties(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredFaculties = useMemo(() => {
    if (!faculties) return [];
    if (!searchQuery) return faculties;
    return faculties.map(f => ({
      ...f,
      majors: (f.majors || []).filter((m: any) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    })).filter(f => (f.majors?.length || 0) > 0 || f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [faculties, searchQuery]);

  return (
    <aside className={`
      fixed lg:relative top-0 left-0 lg:top-auto lg:left-auto z-[100] lg:z-10 h-full bg-white border-r border-slate-100 transition-all duration-500 ease-in-out flex flex-col shadow-2xl lg:shadow-none
      ${isOpen || isPermanent ? 'w-full sm:w-85 lg:w-[400px] translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'}
    `}>
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
        {isOpen ? (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between w-full"
          >
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Layers size={20} className="text-blue-600" /> Khoa & Ngành
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Danh mục đào tạo</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={onAddFaculty}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Plus size={16} />
                </button>
              )}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('close-sidebar'))}
                className="p-2 bg-slate-100 text-slate-500 rounded-xl lg:hidden hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full flex justify-center">
            <Layers size={24} className="text-blue-600" />
          </div>
        )}
      </div>

      {/* Search Bar */}
      {isOpen && (
        <div className="px-6 py-4 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Tìm khoa, ngành..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {(filteredFaculties || []).map(faculty => (
          <div key={faculty.id} className="space-y-1">
            <div className="flex items-center group">
              <button 
                onClick={() => toggleFaculty(faculty.id)}
                className={`flex-1 flex items-center justify-between p-4 rounded-2xl transition-all ${
                  expandedFaculties.includes(faculty.id) ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    expandedFaculties.includes(faculty.id) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isOpen ? <GraduationCap size={20} /> : <span className="font-black text-xs">{faculty.name?.charAt(0)}</span>}
                  </div>
                  {isOpen && (
                    <div className="flex flex-col items-start overflow-hidden">
                       <span className="text-[11px] font-black uppercase truncate tracking-tight w-full text-left">{faculty.name}</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{(faculty.majors?.length || 0)} chuyên ngành</span>
                    </div>
                  )}
                </div>
                {isOpen && (
                  <motion.div
                    animate={{ rotate: expandedFaculties.includes(faculty.id) ? 180 : 0 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                )}
              </button>
              
              {isAdmin && isOpen && (
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all bg-white/80 backdrop-blur-sm p-1 rounded-lg">
                  <button onClick={() => onEditFaculty?.(faculty)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={14}/></button>
                  <button onClick={() => onDeleteFaculty?.(faculty.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14}/></button>
                  <button onClick={() => onAddMajor?.(faculty.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Plus size={14}/></button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {expandedFaculties.includes(faculty.id) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 ml-6 border-l-2 border-slate-100 pl-4 py-2"
                >
                  {(faculty.majors || []).map((major: any) => (
                    <div key={major.id} className="flex items-center group">
                      <button 
                        onClick={() => onSelectMajor(major.id)}
                        className={`flex-1 text-left p-4 rounded-2xl text-[10px] font-black uppercase transition-all relative overflow-hidden ${
                          selectedMajorId === major.id 
                          ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                          : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between relative z-10">
                           <span className="truncate pr-4">{isOpen ? major.name : major.code}</span>
                           {selectedMajorId === major.id && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        </div>
                        {selectedMajorId === major.id && (
                          <motion.div 
                            layoutId="active-major"
                            className="absolute inset-0 bg-slate-900"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>
                      {isAdmin && isOpen && (
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => onEditMajor?.(major)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={14}/></button>
                          <button onClick={() => onDeleteMajor?.(major.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(faculty.majors?.length || 0) === 0 && (
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic pl-4">Chưa có chuyên ngành</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {isOpen && faculties && (
        <div className="p-6 bg-slate-50/50 border-t border-slate-50">
           <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thống kê</p>
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-lg font-black text-slate-900">{(faculties?.length || 0)}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Tổng số khoa</p>
                 </div>
                 <div className="text-right">
                    <p className="text-lg font-black text-blue-600">{(faculties || []).reduce((acc, f) => acc + (f.majors?.length || 0), 0)}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Chuyên ngành</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </aside>
  );
};

export default FacultyMajorSidebar;
