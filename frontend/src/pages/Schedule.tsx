import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CalendarDays, Clock3, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import DayView from '../components/timetable/modern/DayView';
import HeaderBar from '../components/timetable/modern/HeaderBar';
import Legend from '../components/timetable/modern/Legend';
import MonthView from '../components/timetable/modern/MonthView';
import WeekView from '../components/timetable/modern/WeekView';
import TimetableDetailModal from '../components/timetable/TimetableDetailModal';
import { useAuthStore } from '../store/useAuthStore';
import { getPeriodTimes } from '../utils/timetable';

interface TimetableEvent {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  classId: string;
  day: number | string;
  startPeriod: number | string;
  endPeriod: number | string;
  type: string;
}

const getTimetableDay = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 8 : day + 1;
};

const Schedule = () => {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timetables, setTimetables] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimetableEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const fetchMySchedule = async () => {
      const isLecturer = user?.role?.toUpperCase() === 'LECTURER';
      if (!user?.class_id && !isLecturer) return;

      try {
        setLoading(true);
        const params = isLecturer ? {} : { classId: user.class_id };
        const res = await axios.get('/timetable', { params });
        setTimetables(res.data);
      } catch {
        toast.error('Không thể tải lịch học');
      } finally {
        setLoading(false);
      }
    };

    fetchMySchedule();
  }, [user]);

  const todayEvents = useMemo(() => {
    return timetables
      .filter((event) => Number(event.day) === getTimetableDay(new Date()))
      .sort((a, b) => Number(a.startPeriod) - Number(b.startPeriod));
  }, [timetables]);

  const weekEventsCount = useMemo(() => {
    return timetables.filter((event) => Number(event.day) >= 2 && Number(event.day) <= 8).length;
  }, [timetables]);

  const nextEvent = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return todayEvents.find((event) => {
      const { start } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
      const [hour, minute] = start.split(':').map(Number);
      return hour * 60 + minute >= currentMinutes;
    }) || todayEvents[0];
  }, [todayEvents]);

  const openEventDetail = (event: TimetableEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const nextEventTime = nextEvent ? getPeriodTimes(Number(nextEvent.startPeriod), Number(nextEvent.endPeriod)) : null;
  const isLecturer = user?.role?.toUpperCase() === 'LECTURER';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-6 md:space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-black">
              <CalendarDays size={14} />
              {isLecturer ? 'Lịch giảng dạy' : 'Thời khóa biểu sinh viên'}
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-950 tracking-tight">
              Lịch học cá nhân
            </h1>
            <p className="text-slate-500 font-bold text-sm md:text-base max-w-2xl">
              Theo dõi lịch học theo ngày, tuần và tháng. Chạm vào từng môn để xem chi tiết phòng học, giảng viên và thời gian.
            </p>
          </div>
          <Legend />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400">Hôm nay</p>
              <h3 className="text-xl font-black text-slate-900">{todayEvents.length} lịch học</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock3 size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-400">Tiết gần nhất</p>
              <h3 className="text-sm font-black text-slate-900 truncate">{nextEvent?.subject || 'Chưa có lịch'}</h3>
              {nextEventTime && <p className="text-xs font-bold text-slate-500">{nextEventTime.start} - {nextEventTime.end}</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-400">Trong tuần</p>
              <h3 className="text-xl font-black text-slate-900 truncate">{nextEvent?.room || 'Chưa cập nhật'}</h3>
              <p className="text-xs font-bold text-slate-500">{weekEventsCount} lịch học, phòng gần nhất</p>
            </div>
          </div>
        </div>

        <HeaderBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="min-h-[560px] relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[420px] flex items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-xs font-black text-slate-400">Đang tải lịch học...</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {viewMode === 'day' && (
                  <DayView
                    events={timetables}
                    selectedDate={selectedDate}
                    onEventClick={openEventDetail}
                    onViewChange={setViewMode}
                  />
                )}
                {viewMode === 'week' && (
                  <WeekView
                    events={timetables}
                    selectedDate={selectedDate}
                    onEventClick={openEventDetail}
                  />
                )}
                {viewMode === 'month' && (
                  <MonthView
                    events={timetables}
                    selectedDate={selectedDate}
                    onEventClick={openEventDetail}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      setViewMode('day');
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] font-bold text-slate-400">
          Dữ liệu được cập nhật tự động từ hệ thống quản lý đào tạo.
        </p>
      </div>

      <TimetableDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

export default Schedule;
