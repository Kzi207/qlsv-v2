import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Calendar, Search } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

import TimetableTable from '../components/timetable/TimetableTable';
import TimetableFormModal from '../components/timetable/TimetableFormModal';
import TimetableCalendar from '../components/timetable/TimetableCalendar';

const AdminTimetableManagement = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'QTV';

  // Global Data
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Page Mode
  const [view, setView] = useState<'calendar' | 'table'>('calendar');

  // Existing Timetables
  const [timetables, setTimetables] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    semesterId: '',
    classId: '',
    subject: '',
    teacher: '',
    room: ''
  });

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentWeekDate] = useState(new Date());

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [semRes, classRes] = await Promise.all([
        axios.get('/semesters'),
        axios.get('/classes'),
      ]);
      setSemesters(semRes.data);
      setClasses(classRes.data);
      if (semRes.data.length > 0) {
        setFilters(f => ({ ...f, semesterId: semRes.data[0].name }));
      }
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    }
  };

  const fetchTimetables = async () => {
    try {
      const res = await axios.get('/timetable', { params: filters });
      setTimetables(res.data);
    } catch (error) {
      toast.error('Lỗi tải thời khóa biểu');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Universal Header - High Density */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
            <Calendar size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Quản lý đào tạo</h1>
            <p className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
               <span className="h-1 w-1 rounded-full bg-emerald-500" />
               Hệ thống quản lý lịch học thông minh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
             <button 
               onClick={() => setView('calendar')}
               className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                 view === 'calendar' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >Lưới thời gian</button>
             <button 
               onClick={() => setView('table')}
               className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                 view === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >Dạng bảng</button>
          </div>

          {isAdmin && (
            <button 
              onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-500/10"
            >
              <Plus size={14} /> 
              <span>Tạo lịch mới</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 space-y-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ</label>
              <select 
                value={filters.semesterId}
                onChange={e => setFilters(f => ({ ...f, semesterId: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none"
              >
                {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tìm kiếm</label>
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Môn, GV..."
                    onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                  />
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-white dark:bg-slate-900 custom-scrollbar">
            <p className="px-2 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Lớp ({classes.length})</p>
            {classes.map(c => {
              const isSelected = filters.classId === c.name;
              return (
                <button 
                  key={c.name}
                  onClick={() => setFilters(f => ({ ...f, classId: f.classId === c.name ? '' : c.name }))}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                    isSelected ? 'bg-slate-900 dark:bg-blue-600 border-slate-900 shadow-lg' : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Plus size={12} />
                  </div>
                  <p className={`text-[11px] font-black truncate tracking-tight ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{c.name}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {view === 'calendar' ? (
              <TimetableCalendar 
                events={timetables} 
                currentDate={currentWeekDate}
                onEventClick={(e) => { setSelectedEvent(e); setIsModalOpen(true); }}
              />
            ) : (
              <div className="p-6">
                <TimetableTable 
                  events={timetables} 
                  onEdit={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} 
                  onDelete={async (id) => {
                    if(window.confirm('Xóa?')) {
                      await axios.delete(`/timetable/${id}`);
                      toast.success('Đã xóa');
                      fetchTimetables();
                    }
                  }} 
                  isAdmin={isAdmin} 
                />
              </div>
            )}
          </div>
        </main>

        <TimetableFormModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }}
          onSubmit={async (data) => {
             try {
                if (selectedEvent) {
                   await axios.put(`/timetable/${selectedEvent.id}`, data);
                   toast.success('Cập nhật thành công');
                } else {
                   await axios.post('/timetable', data);
                   toast.success('Tạo thành công');
                }
                setIsModalOpen(false);
                setSelectedEvent(null);
                fetchTimetables();
             } catch (error: any) {
                toast.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
             }
          }}
          onDelete={async (id) => {
             try {
                await axios.delete(`/timetable/${id}`);
                toast.success('Đã xóa');
                fetchTimetables();
             } catch (error) {}
          }}
          initialData={selectedEvent}
          currentWeekDate={currentWeekDate}
        />
      </div>
    </div>
  );
};

export default AdminTimetableManagement;
