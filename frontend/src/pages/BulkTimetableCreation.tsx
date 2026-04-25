import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

// Sub-components
import Header from '../components/bulk-timetable/Header';
import SidebarFilter from '../components/bulk-timetable/SidebarFilter';
import ScheduleGrid from '../components/bulk-timetable/ScheduleGrid';
import ScheduleDayList from '../components/bulk-timetable/ScheduleDayList';
import CreateSchedulePanel from '../components/bulk-timetable/CreateSchedulePanel';
import ConflictAlert from '../components/bulk-timetable/ConflictAlert';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const PERIODS = Array.from({ length: 12 }, (_, i) => i + 1);

const BulkTimetableCreation = () => {
  // Global Data
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Selection & Form State
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

  // UI State
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      if (semRes.data.length > 0) setSelectedSemester(semRes.data[0].name);
      
      setTeachers(['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Minh D']);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
    );
  };

  const handleAddPreview = async () => {
    if (!formData.subject || !selectedClasses.length || !formData.teacher || !formData.room) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 lớp');
      return;
    }

    // Call Backend to check conflicts
    const newEvents = selectedClasses.map(cId => ({
      ...formData,
      classId: cId,
      id: Math.random().toString(36).substr(2, 9),
      semesterId: selectedSemester
    }));

    try {
      const res = await axios.post('/timetable/check-conflicts', { events: [...previewEvents, ...newEvents] });
      
      // Update local events with conflict status from server
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

  const handleSave = async () => {
    if (previewEvents.length === 0) return toast.error('Chưa có lịch để lưu');
    if (previewEvents.some(e => e.isConflict)) return toast.error('Vui lòng sửa các lỗi trùng lịch');

    setLoading(true);
    try {
      await axios.post('/timetable/bulk', { events: previewEvents });
      toast.success('Đã lưu toàn bộ lịch học thành công');
      setPreviewEvents([]);
    } catch (error) {
      toast.error('Lỗi khi lưu lịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <Header 
        semesters={semesters}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
        onSave={handleSave}
        loading={loading}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <SidebarFilter 
          classes={classes}
          selectedClasses={selectedClasses}
          toggleClass={toggleClass}
          onClear={() => setSelectedClasses([])}
        />

        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
             <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setActiveTab('grid')}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    activeTab === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400'
                  }`}
                >Lưới (Tablet)</button>
                <button 
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    activeTab === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'
                  }`}
                >Danh sách</button>
             </div>
             <button 
               onClick={() => setIsPanelOpen(true)}
               className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20"
             >
                <Plus size={20} />
             </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {/* Desktop View */}
            <ScheduleGrid previewEvents={previewEvents} />
            
            {/* Mobile/Tablet View */}
            <ScheduleDayList 
              previewEvents={previewEvents} 
              onRemove={(id) => setPreviewEvents(prev => prev.filter(e => e.id !== id))}
            />
          </div>
        </main>

        <CreateSchedulePanel 
          formData={formData}
          setFormData={setFormData}
          subjects={subjects}
          teachers={teachers}
          rooms={rooms}
          DAYS={DAYS}
          PERIODS={PERIODS}
          onAutoSuggest={() => {}}
          onAddPreview={handleAddPreview}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />
      </div>

      <AnimatePresence>
        <ConflictAlert 
          conflictCount={previewEvents.filter(e => e.isConflict).length}
          onViewDetails={() => setActiveTab('list')}
        />
      </AnimatePresence>
    </div>
  );
};

export default BulkTimetableCreation;
