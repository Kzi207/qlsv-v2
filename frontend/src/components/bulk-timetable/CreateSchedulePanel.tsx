import { Zap, Maximize2, Plus, X } from 'lucide-react';

interface CreateSchedulePanelProps {
  formData: any;
  setFormData: (val: any) => void;
  subjects: any[];
  teachers: any[];
  rooms: any[];
  DAYS: string[];
  PERIODS: number[];
  onAutoSuggest: () => void;
  onAddPreview: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CreateSchedulePanel = ({ 
  formData, setFormData, subjects, teachers, rooms, 
  DAYS, PERIODS, onAutoSuggest, onAddPreview,
  isOpen, onClose
}: CreateSchedulePanelProps) => {
  
  const content = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Zap size={20} className="text-amber-500" /> Tạo nhanh lịch học
        </h3>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn học</label>
            <select 
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">--- Chọn môn học ---</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giảng viên</label>
            <select 
              value={formData.teacher}
              onChange={e => setFormData({...formData, teacher: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">--- Chọn giảng viên ---</option>
              {teachers.map(t => (
                <option key={t.username || t.id} value={t.name}>
                  {t.name} {t.username ? `(${t.username})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phòng học</label>
            <select 
              value={formData.room}
              onChange={e => setFormData({...formData, room: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">--- Chọn phòng học ---</option>
              {rooms.map(r => <option key={r.id} value={r.name}>{r.name} ({r.capacity} chỗ)</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thứ học</label>
              <select 
                value={formData.day}
                onChange={e => setFormData({...formData, day: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              >
                {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số buổi/tuần</label>
              <select 
                value={formData.sessionsPerWeek}
                onChange={e => setFormData({...formData, sessionsPerWeek: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              >
                <option value="1">1 buổi</option>
                <option value="2">2 buổi</option>
                <option value="3">3 buổi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiết bắt đầu</label>
              <select 
                value={formData.startPeriod}
                onChange={e => setFormData({...formData, startPeriod: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              >
                {PERIODS.map(p => <option key={p} value={p}>Tiết {p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiết kết thúc</label>
              <select 
                value={formData.endPeriod}
                onChange={e => setFormData({...formData, endPeriod: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              >
                {PERIODS.map(p => <option key={p} value={p}>Tiết {p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 pb-10">
          <button 
            onClick={onAutoSuggest}
            className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
          >
            <Maximize2 size={16} /> Gợi ý lịch trống
          </button>
          <button 
            onClick={onAddPreview}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus size={20} /> Tạo lịch dự kiến
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <aside className="hidden lg:flex w-96 bg-white border-l border-slate-200 flex-col shrink-0">
        {content}
      </aside>

      {/* Mobile/Tablet Drawer */}
      <div className={`fixed inset-0 z-[100] lg:hidden transition-all duration-300 ${
        isOpen ? 'visible' : 'invisible'
      }`}>
        <div 
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {content}
        </div>
      </div>
    </>
  );
};

export default CreateSchedulePanel;

