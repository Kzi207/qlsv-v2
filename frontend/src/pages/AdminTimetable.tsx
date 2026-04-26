import { useState, useEffect } from 'react';
import { 
  Calendar, 
  List, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterBar from '../components/timetable/FilterBar';
import TimetableCalendar from '../components/timetable/TimetableCalendar';
import TimetableTable from '../components/timetable/TimetableTable';
import TimetableFormModal from '../components/timetable/TimetableFormModal';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const AdminTimetable = () => {
  const { user } = useAuthStore();
  const isLecturer = user?.role?.toUpperCase() === 'LECTURER';
  
  const [view, setView] = useState<'calendar' | 'table'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    semesterId: '',
    classId: '',
    subject: '',
    teacher: '',
    room: ''
  });

  useEffect(() => {
    fetchTimetables();
  }, [filters]);

  const fetchTimetables = async () => {
    try {
      const res = await axios.get('/timetable', { params: filters });
      setTimetables(res.data);
    } catch (error) {
      toast.error('Lỗi tải thời khóa biểu');
    }
  };

  const handleSave = async (data: any) => {
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
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa lịch này?')) return;
    try {
      await axios.delete(`/timetable/${id}`);
      toast.success('Đã xóa');
      fetchTimetables();
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/timetable/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ThoiKhoaBieu.xlsx');
      document.body.appendChild(link);
      link.click();
      toast.success('Đã xuất file thành công');
    } catch (error) {
      toast.error('Lỗi khi xuất file');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await axios.post('/timetable/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data.errors && res.data.errors.length > 0) {
          toast.success(`Import thành công ${res.data.success || 0} tiết học.`);
          // Show errors in console or a more detailed UI if needed
          console.error('Import conflicts:', res.data.errors);
          toast.error(`Có ${res.data.errors.length} dòng bị trùng lịch và đã bị bỏ qua.`, { duration: 5000 });
        } else {
          toast.success(res.data.message || 'Import thành công');
        }
        fetchTimetables();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Lỗi khi import');
      }
    };
    input.click();
  };

  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  
  const getWeekRange = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  };

  const weekRange = getWeekRange(currentWeekDate);

  return (
    <>
      <div className="max-w-[1600px] mx-auto animate-fade-up pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          
          {/* Main Content */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                   <Clock size={12} /> {isLecturer ? 'Cổng thông tin Giảng viên' : 'Hệ thống Quản lý Thời khóa biểu'}
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight text-gradient">
                  {isLecturer ? `Chào buổi sáng, ${user?.name || 'Giảng viên'}!` : 'Lịch học & Giảng dạy'}
                </h1>
                <p className="text-slate-500 font-bold text-sm">
                  {isLecturer ? 'Theo dõi và quản lý các tiết dạy trong tuần của bạn' : 'Quản lý tiết học, phòng học và giảng viên theo quy chuẩn'}
                </p>
              </div>

              <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}><Calendar size={16} /> Calendar</button>
                <button onClick={() => setView('table')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /> Table</button>
              </div>
            </div>

            <FilterBar 
              onSearch={(q) => setFilters(prev => ({ ...prev, subject: q }))}
              onCreate={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              onImport={handleImport}
              onExport={handleExport}
              onPrevWeek={() => {
                 const d = new Date(currentWeekDate);
                 d.setDate(d.getDate() - 7);
                 setCurrentWeekDate(d);
              }}
              onNextWeek={() => {
                 const d = new Date(currentWeekDate);
                 d.setDate(d.getDate() + 7);
                 setCurrentWeekDate(d);
              }}
              weekRangeText={`${weekRange.monday.toLocaleDateString('vi-VN')} - ${weekRange.sunday.toLocaleDateString('vi-VN')}`}
              isAdmin={!isLecturer}
            />

            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                {view === 'calendar' ? (
                  <TimetableCalendar 
                    events={timetables} 
                    currentDate={currentWeekDate}
                    onEventClick={(e) => { 
                      setSelectedEvent(e); 
                      setIsModalOpen(true); 
                    }} 
                  />
                ) : (
                  <TimetableTable 
                    events={timetables} 
                    onEdit={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} 
                    onDelete={handleDelete} 
                    isAdmin={!isLecturer}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Panel */}
          <div className="space-y-8 lg:sticky lg:top-8 self-start">
            {/* Statistics Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-6">
              <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{isLecturer ? 'Chỉ số giảng dạy' : 'Thống kê hệ thống'}</h3>
                  <TrendingUp size={20} className="text-emerald-500" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-blue-50 rounded-[2rem] flex items-center gap-5 group hover:bg-blue-600 transition-all duration-500">
                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><Users size={24} /></div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase group-hover:text-blue-100">{isLecturer ? 'Tổng tiết trong tuần' : 'Tiết đã xếp'}</p>
                      <h4 className="text-2xl font-black text-slate-900 group-hover:text-white">{timetables.length} Tiết</h4>
                    </div>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-[2rem] flex items-center gap-5 group hover:bg-emerald-600 transition-all duration-500">
                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform"><Calendar size={24} /></div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase group-hover:text-emerald-100">{isLecturer ? 'Tiết dạy hôm nay' : 'Phòng đang mở'}</p>
                      <h4 className="text-2xl font-black text-slate-900 group-hover:text-white">
                        {timetables.filter(t => {
                          const today = new Date().getDay() + 1; // 1-7
                          const ttDay = today === 1 ? 8 : today;
                          return Number(t.day) === ttDay;
                        }).length} Tiết
                      </h4>
                    </div>
                  </div>
              </div>
            </div>

            {/* Warnings Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 space-y-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={120} /></div>
              <h3 className="text-sm font-black uppercase tracking-widest relative">Cảnh báo trùng</h3>
              <div className="space-y-4 relative">
                  {timetables.filter(t => t.isConflict).length === 0 ? (
                    <p className="text-xs font-bold text-slate-400">Không có xung đột lịch học</p>
                  ) : (
                    timetables.filter(t => t.isConflict).map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start group">
                        <div className="mt-0.5 text-rose-400"><AlertCircle size={14} /></div>
                        <p className="text-[11px] font-bold text-slate-300">Trùng tại phòng {item.room} - Tiết {item.startPeriod}</p>
                      </div>
                    ))
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TimetableFormModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }}
        onSubmit={handleSave}
        onDelete={handleDelete}
        initialData={selectedEvent}
        currentWeekDate={currentWeekDate}
        isAdmin={!isLecturer}
      />
    </>
  );
};

export default AdminTimetable;
