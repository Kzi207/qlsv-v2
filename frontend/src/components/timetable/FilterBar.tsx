import React from 'react';
import { Search, Download, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface FilterBarProps {
  onSearch: (q: string) => void;
  onCreate: () => void;
  onImport: () => void;
  onExport: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  weekRangeText: string;
  isAdmin?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  onSearch, 
  onCreate, 
  onImport, 
  onExport,
  onPrevWeek,
  onNextWeek,
  weekRangeText,
  isAdmin = true
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Week Navigation */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 w-full lg:w-auto overflow-x-auto">
           <button 
             onClick={onPrevWeek}
             className="flex items-center gap-2 pl-2 pr-4 lg:pl-4 lg:pr-6 py-3 bg-slate-50 hover:bg-slate-100 rounded-[1.5rem] text-[10px] lg:text-xs font-black text-slate-600 uppercase tracking-widest transition-all group shrink-0"
           >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:-translate-x-1 transition-transform">
                <ChevronLeft size={18} />
              </div>
              <span className="hidden sm:inline">Tuần trước</span>
           </button>
           
           <div className="px-4 lg:px-8 py-2 text-center flex-1 lg:min-w-[240px]">
              <p className="text-[8px] lg:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">Đang hiển thị</p>
              <h4 className="text-[11px] lg:text-sm font-black text-slate-900 whitespace-nowrap">{weekRangeText}</h4>
           </div>
 
           <button 
             onClick={onNextWeek}
             className="flex items-center gap-2 pr-2 pl-4 lg:pr-4 lg:pl-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-[1.5rem] text-[10px] lg:text-xs font-black text-white uppercase tracking-widest transition-all group shadow-lg shadow-blue-500/20 shrink-0"
           >
              <span className="hidden sm:inline">Tuần sau</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight size={18} />
              </div>
           </button>
        </div>

        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            onChange={(e) => onSearch(e.target.value)}
            className="block w-full pl-12 pr-4 py-4.5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-xl shadow-slate-200/30"
            placeholder="Tìm kiếm môn học, giảng viên..."
          />
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button onClick={onImport} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
              <Upload size={20} />
            </button>
            <button onClick={onExport} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm">
              <Download size={20} />
            </button>
            <button onClick={onCreate} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-95">
              <Plus size={20} />
              <span>Tạo lịch</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
