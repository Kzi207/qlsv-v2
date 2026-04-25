import { 
  Zap, 
  FileSpreadsheet, 
  Download, 
  Save 
} from 'lucide-react';

interface HeaderProps {
  selectedSemester: string;
  setSelectedSemester: (val: string) => void;
  semesters: any[];
  onSave: () => void;
  loading: boolean;
}

const Header = ({ selectedSemester, setSelectedSemester, semesters, onSave, loading }: HeaderProps) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-50">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
          <Zap size={24} />
        </div>
        <div>
          <h1 className="text-sm md:text-xl font-black text-slate-900 tracking-tight uppercase line-clamp-1">Tạo lịch hàng loạt</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <select 
              value={selectedSemester} 
              onChange={e => setSelectedSemester(e.target.value)}
              className="text-[9px] md:text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest outline-none border-none cursor-pointer"
            >
              {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <span className="hidden md:block h-1 w-1 rounded-full bg-slate-300"></span>
            <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hệ thống đào tạo</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
          <FileSpreadsheet size={16} /> Import
        </button>
        <button className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
          <Download size={16} /> Export
        </button>
        <div className="hidden lg:block h-8 w-px bg-slate-200 mx-2"></div>
        <button 
          onClick={onSave}
          disabled={loading}
          className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-3 bg-slate-900 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
        >
          <Save size={18} /> <span className="hidden md:inline">{loading ? 'Đang lưu...' : 'Lưu toàn bộ'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
