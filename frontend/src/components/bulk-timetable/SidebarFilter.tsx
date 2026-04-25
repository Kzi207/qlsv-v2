import { Search, Filter, CheckCircle2 } from 'lucide-react';

interface SidebarFilterProps {
  classes: any[];
  selectedClasses: string[];
  toggleClass: (name: string) => void;
  onClear: () => void;
}

const SidebarFilter = ({ classes, selectedClasses, toggleClass, onClear }: SidebarFilterProps) => {
  return (
    <aside className="hidden md:flex w-72 lg:w-80 bg-white border-r border-slate-200 flex-col shrink-0 overflow-hidden">
      <div className="p-6 border-b border-slate-100 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bộ lọc lớp học</label>
            <Filter size={14} className="text-slate-300" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm mã lớp..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <div className="px-2 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Chọn lớp ({selectedClasses.length})
          </span>
          {selectedClasses.length > 0 && (
            <button onClick={onClear} className="text-[9px] font-black text-rose-500 uppercase hover:underline">
              Xóa tất cả
            </button>
          )}
        </div>
        
        {classes.map(c => {
          const isSelected = selectedClasses.includes(c.name);
          return (
            <button 
              key={c.name}
              onClick={() => toggleClass(c.name)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                isSelected 
                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                : 'bg-white border-transparent hover:bg-slate-50'
              }`}
            >
              <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-transparent border border-slate-200'
              }`}>
                <CheckCircle2 size={14} />
              </div>
              <div className="text-left overflow-hidden">
                <p className={`text-sm font-black truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{c.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">Khoa CNTT • K20</p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default SidebarFilter;
