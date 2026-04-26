import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Save, Search } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Sub-components
import ScheduleGrid from '../components/bulk-timetable/ScheduleGrid';
import ScheduleDayList from '../components/bulk-timetable/ScheduleDayList';
import CreateSchedulePanel from '../components/bulk-timetable/CreateSchedulePanel';
import ConflictAlert from '../components/bulk-timetable/ConflictAlert';
import TimetableTable from '../components/timetable/TimetableTable';
import TimetableFormModal from '../components/timetable/TimetableFormModal';
import TimetableCalendar from '../components/timetable/TimetableCalendar';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);

const AdminTimetableManagement = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'QTV';

  // Global Data
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Page Mode: 'existing' | 'bulk'
  const [mode, setMode] = useState<'existing' | 'bulk'>('existing');
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

  // Bulk State
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    room: '',
    day: 1,
    startPeriod: 1,
    endPeriod: 3,
    startDate: '',
    endDate: '',
    sessionsPerWeek: 1
  });
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentWeekDate] = useState(new Date());

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (mode === 'existing') {
       fetchTimetables();
    }
  }, [mode, filters]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [semRes, classRes, subRes, roomRes] = await Promise.all([
        axios.get('/semesters'),
        axios.get('/classes'),
        axios.get('/academic/subjects'),
        axios.get('/rooms')
      ]);
      setSemesters(semRes.data);
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setRooms(roomRes.data);
      if (semRes.data.length > 0) {
        setSelectedSemester(semRes.data[0].name);
        setFilters(f => ({ ...f, semesterId: semRes.data[0].name }));
      }
      setTeachers(['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Minh D']);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
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

  const handleAddPreview = async () => {
    if (!formData.subject || !selectedClasses.length || !formData.teacher || !formData.room) {
      return toast.error('Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 lớp');
    }

    const newEvents = selectedClasses.map(cId => ({
      ...formData,
      classId: cId,
      id: Math.random().toString(36).substr(2, 9),
      semesterId: selectedSemester
    }));

    try {
      const res = await axios.post('/timetable/check-conflicts', { events: [...previewEvents, ...newEvents] });
      const validatedEvents = newEvents.map(e => {
         const conflict = res.data.conflicts.find((c: any) => c.event.id === e.id);
         return { ...e, isConflict: !!conflict };
      });
      setPreviewEvents([...previewEvents, ...validatedEvents]);
      setIsPanelOpen(false);
      toast.success(`Đã thêm ${newEvents.length} lịch dự kiến`);
    } catch (error) {
      toast.error('Lỗi kiểm tra xung đột');
    }
  };

  const handleSaveBulk = async () => {
    if (previewEvents.length === 0) return toast.error('Chưa có lịch để lưu');
    if (previewEvents.some(e => e.isConflict)) return toast.error('Vui lòng sửa các lỗi trùng lịch');

    setLoading(true);
    try {
      await axios.post('/timetable/bulk', { events: previewEvents });
      toast.success('Đã lưu toàn bộ lịch học thành công');
      setPreviewEvents([]);
      setMode('existing');
      fetchTimetables();
    } catch (error) {
      toast.error('Lỗi khi lưu lịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Universal Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
            <Calendar size={24} />
          </div>
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-sm md:text-xl font-black text-slate-900 tracking-tight uppercase">Quản lý đào tạo</h1>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl mt-1">
                <button 
                  onClick={() => setMode('existing')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === 'existing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                  }`}
                >Lịch hiện tại</button>
                <button 
                  onClick={() => setMode('bulk')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === 'bulk' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                  }`}
                >Lập lịch hàng loạt</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'existing' && isAdmin && (
            <button 
              onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              <Plus size={18} /> Tạo lịch mới
            </button>
          )}
          {mode === 'bulk' && (
            <button 
              onClick={handleSaveBulk}
              disabled={loading}
              className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
            >
              <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu tất cả'}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Universal Sidebar Filter */}
        <aside className="hidden md:flex w-72 lg:w-80 bg-white border-r border-slate-200 flex-col shrink-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Học kỳ</label>
              <select 
                value={mode === 'bulk' ? selectedSemester : filters.semesterId}
                onChange={e => {
                  if (mode === 'bulk') setSelectedSemester(e.target.value);
                  else setFilters(f => ({ ...f, semesterId: e.target.value }));
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tìm kiếm</label>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Tên môn, GV..."
                    onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            <p className="px-2 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách lớp ({classes.length})</p>
            {classes.map(c => {
              const isSelected = mode === 'bulk' ? selectedClasses.includes(c.name) : filters.classId === c.name;
              return (
                <button 
                  key={c.name}
                  onClick={() => {
                    if (mode === 'bulk') {
                      setSelectedClasses(prev => prev.includes(c.name) ? prev.filter(x => x !== c.name) : [...prev, c.name]);
                    } else {
                      setFilters(f => ({ ...f, classId: f.classId === c.name ? '' : c.name }));
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                    isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-transparent'
                  }`}>
                    <Plus size={14} />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className={`text-sm font-black truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{c.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Sub Header for View Toggle */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
               <button 
                 onClick={() => setView('calendar')}
                 className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                   view === 'calendar' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'
                 }`}
               >Lưới thời gian</button>
               <button 
                 onClick={() => setView('table')}
                 className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                   view === 'table' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'
                 }`}
               >Dạng bảng</button>
            </div>
            
            <div className="lg:hidden">
               <button onClick={() => setIsPanelOpen(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20"><Plus size={20}/></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {mode === 'bulk' ? (
              <>
                {view === 'calendar' ? <ScheduleGrid previewEvents={previewEvents} /> : <ScheduleDayList previewEvents={previewEvents} onRemove={id => setPreviewEvents(p => p.filter(x => x.id !== id))} />}
              </>
            ) : (
              <>
                {view === 'calendar' ? (
                  <TimetableCalendar 
                    events={timetables} 
                    currentDate={currentWeekDate}
                    onEventClick={(e) => { setSelectedEvent(e); setIsModalOpen(true); }}
                  />
                ) : (
                  <div className="p-6">
                    <TimetableTable events={timetables} onEdit={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} onDelete={(id) => {
                      if(window.confirm('Xóa lịch này?')) {
                        axios.delete(`/timetable/${id}`).then(() => {
                          toast.success('Đã xóa');
                          fetchTimetables();
                        });
                      }
                    }} isAdmin={isAdmin} />
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {mode === 'bulk' && (
          <CreateSchedulePanel 
            formData={formData} setFormData={setFormData}
            subjects={subjects} teachers={teachers} rooms={rooms}
            DAYS={DAYS} PERIODS={PERIODS}
            onAutoSuggest={() => {}}
            onAddPreview={handleAddPreview}
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
          />
        )}

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
          isAdmin={isAdmin}
        />
      </div>

      <AnimatePresence>
        {mode === 'bulk' && previewEvents.filter(e => e.isConflict).length > 0 && (
          <ConflictAlert 
            conflictCount={previewEvents.filter(e => e.isConflict).length} 
            onViewDetails={() => setView('table')} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTimetableManagement;
