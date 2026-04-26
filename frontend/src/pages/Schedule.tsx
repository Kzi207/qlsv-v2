import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Clock3, GraduationCap, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import DayView from '../components/timetable/modern/DayView';
import HeaderBar from '../components/timetable/modern/HeaderBar';
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

const getDayValue = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 8 : day + 1;
};

const getWeekDates = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  return Array.from({ length: 7 }).map((_, index) => {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + index);
    return nextDate;
  });
};

const getEventDayIndex = (day: number | string) => {
  const dayValue = Number(day);
  if (dayValue === 8) return 6;
  if (dayValue >= 2 && dayValue <= 7) return dayValue - 2;
  return -1;
};

const getEventTypeBadgeClass = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'online':
      return 'bg-cyan-100 text-cyan-700';
    case 'exam':
    case 'official_exam':
      return 'bg-amber-100 text-amber-700';
    case 'cancelled':
      return 'bg-slate-200 text-slate-500';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

const Schedule = () => {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timetables, setTimetables] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimetableEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const isStudent = user?.role?.toUpperCase() === 'STUDENT';
  const weekdayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

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

  const openEventDetail = (event: TimetableEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const weekDates = getWeekDates(selectedDate);
  const weekRangeText = `${weekDates[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${weekDates[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

  const weekEvents = [...timetables]
    .filter((event) => getEventDayIndex(event.day) >= 0)
    .sort((a, b) => {
      const dayCompare = getEventDayIndex(a.day) - getEventDayIndex(b.day);
      if (dayCompare !== 0) return dayCompare;
      return Number(a.startPeriod) - Number(b.startPeriod);
    });

  const todayEvents = [...timetables]
    .filter((event) => Number(event.day) === getDayValue(new Date()))
    .sort((a, b) => Number(a.startPeriod) - Number(b.startPeriod));

  const weekStudyDays = new Set(weekEvents.map((event) => Number(event.day))).size;
  const weekTotalPeriods = weekEvents.reduce((sum, event) => {
    const start = Number(event.startPeriod);
    const end = Number(event.endPeriod);
    if (Number.isNaN(start) || Number.isNaN(end)) return sum;
    return sum + Math.max(1, end - start + 1);
  }, 0);

  const upcomingWeekEvents = weekEvents.slice(0, 6);

  const containerClass =
    isStudent && viewMode === 'week'
      ? 'grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'
      : '';

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="max-w-[1480px] mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-6 md:space-y-8">
        {isStudent && (
          <div className="hidden xl:grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tuần đang xem</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{weekEvents.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Môn học từ {weekRangeText}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Khối lượng học</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{weekTotalPeriods} tiết</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{weekStudyDays} ngày có lịch</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Lớp hiện tại</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{user?.class_id || 'Chưa cập nhật'}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Tài khoản sinh viên</p>
            </div>
          </div>
        )}

        <HeaderBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className={containerClass}>
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

          {isStudent && viewMode === 'week' && (
            <aside className="hidden xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Lịch hôm nay</h3>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700">{todayEvents.length} môn</span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {todayEvents.length > 0 ? (
                    todayEvents.slice(0, 4).map((event) => {
                      const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
                      return (
                        <button
                          key={event.id}
                          onClick={() => openEventDetail(event)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/60"
                        >
                          <p className="line-clamp-1 text-xs font-black text-slate-900">{event.subject}</p>
                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={12} />
                              {start} - {end}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 ${getEventTypeBadgeClass(event.type)}`}>
                              Tiết {event.startPeriod}-{event.endPeriod}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-xs font-bold text-slate-400">
                      Hôm nay không có lịch học.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock size={16} className="text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">Trong tuần đã chọn</h3>
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{weekRangeText}</p>

                <div className="mt-3 space-y-2.5">
                  {upcomingWeekEvents.length > 0 ? (
                    upcomingWeekEvents.map((event) => {
                      const dayIndex = getEventDayIndex(event.day);
                      const scheduleDate = dayIndex >= 0 ? weekDates[dayIndex] : null;
                      return (
                        <button
                          key={`week-${event.id}`}
                          onClick={() => openEventDetail(event)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all hover:border-blue-200 hover:shadow-sm"
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 rounded-lg bg-blue-100 p-1.5 text-blue-700">
                              <GraduationCap size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-xs font-black text-slate-900">{event.subject}</p>
                              <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                                {dayIndex >= 0 ? weekdayLabels[dayIndex] : 'Không xác định'}
                                {scheduleDate && `, ${scheduleDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`}
                              </p>
                              <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                <MapPin size={11} />
                                {event.room || 'Chưa cập nhật phòng'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-xs font-bold text-slate-400">
                      Chưa có dữ liệu lịch học trong tuần này.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          )}
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
