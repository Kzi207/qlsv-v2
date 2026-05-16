import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  MapPin,
  User
} from 'lucide-react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { getPeriodTimes } from '../../utils/timetable';
import TimetableDetailModal from '../../components/timetable/TimetableDetailModal';
import toast from 'react-hot-toast';

// Types
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

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const fullWeekdayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

interface Semester {
  name: string;
  startDate: string;
  endDate: string;
}

const ScheduleV2 = () => {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimetableEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timetableRes, semesterRes] = await Promise.all([
          axios.get('/timetable', { params: { classId: user?.class_id } }),
          axios.get('/semesters')
        ]);
        setEvents(timetableRes.data);
        const semesterData = semesterRes.data;
        setSemesters(semesterData);

        // Luôn mặc định hiện tuần hiện tại (today)
        // Nếu muốn tự động chuyển đến học kỳ gần nhất khi hôm nay nằm ngoài mọi học kỳ, có thể bỏ comment đoạn dưới
        /*
        if (semesterData && semesterData.length > 0) {
          const now = new Date();
          const isInAnySemester = semesterData.some((s: any) => {
            if (!s.startDate || !s.endDate) return false;
            return now >= new Date(s.startDate) && now <= new Date(s.endDate);
          });

          if (!isInAnySemester) {
            const latest = semesterData[semesterData.length - 1];
            if (latest && latest.startDate) setSelectedDate(new Date(latest.startDate));
          }
        }
        */
      } catch (err) {
        toast.error('Không thể tải dữ liệu');
      }
    };
    if (user?.class_id) fetchData();
  }, [user?.class_id]);

  // Helper to check if a date is within a semester
  const isDateInSemester = (date: Date, semesterId: string) => {
    const semester = semesters.find(s => s.name === semesterId);
    if (!semester || !semester.startDate || !semester.endDate) return true; // Fallback if no dates set
    
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(semester.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(semester.endDate);
    end.setHours(23, 59, 59, 999);
    
    return d >= start && d <= end;
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    return Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      return d;
    });
  };

  const weekDates = getWeekDates(selectedDate);
  const weekRangeText = `${weekDates[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${weekDates[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  const changeWeek = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + offset * 7);
    setSelectedDate(newDate);
  };

  const handleEventClick = (event: TimetableEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">

      {/* Header Section */}
      <div className="px-4 md:px-0 mb-8 mt-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lịch học</h1>
        <p className="text-slate-500 font-medium mt-1">Xem thời khóa biểu và lịch học của bạn</p>
      </div>

      {/* Toolbar */}
      <div className="hidden lg:flex lg:flex-row lg:items-center justify-between gap-4 mb-6 px-4 md:px-0">
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
             <button 
               onClick={() => setViewType('week')}
               className={`px-4 py-1.5 rounded-md text-[11px] font-black transition-all ${viewType === 'week' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Tuần
             </button>
             <button 
               onClick={() => setViewType('month')}
               className={`px-4 py-1.5 rounded-md text-[11px] font-black transition-all ${viewType === 'month' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               Tháng
             </button>
          </div>

          <button 
            onClick={goToToday}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-blue-600 hover:bg-blue-50 transition-all shadow-sm active:scale-95"
          >
            Hôm nay
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (viewType === 'week') changeWeek(-1);
                else {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() - 1);
                  setSelectedDate(d);
                }
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm min-w-[160px] justify-center">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700">
                {viewType === 'week' ? weekRangeText : selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <button 
              onClick={() => {
                if (viewType === 'week') changeWeek(1);
                else {
                  const d = new Date(selectedDate);
                  d.setMonth(d.getMonth() + 1);
                  setSelectedDate(d);
                }
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-4 md:px-0">
        {/* Left Side: Schedule (Grid/List) */}
        <div>
          {/* PC Week Tabs - Only show in Week view */}
          {viewType === 'week' && (
            <div className="hidden lg:flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 mb-4 shadow-sm">
              {weekDates.map((date, idx) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-1 flex flex-col items-center py-1.5 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{weekdayLabels[idx]}</span>
                    <span className="text-sm font-black mt-0.5">{date.getDate()}/{date.getMonth() + 1}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* PC View Grid */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
             {viewType === 'week' ? (
                <ScheduleGrid 
                  weekDates={weekDates} 
                  events={events} 
                  onEventClick={handleEventClick}
                  isDateInSemester={isDateInSemester}
                />
             ) : (
                <ScheduleMonthGrid 
                  selectedDate={selectedDate}
                  events={events}
                  onEventClick={handleEventClick}
                  isDateInSemester={isDateInSemester}
                />
             )}
          </div>

          {/* Mobile View */}
          <div className="lg:hidden -mx-4">
             <div className="px-4 mb-6 flex items-center justify-between">
                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setViewType('day')}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${viewType === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Ngày
                    </button>
                    <button 
                      onClick={() => setViewType('week')}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${viewType === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Tuần
                    </button>
                    <button 
                      onClick={() => setViewType('month')}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${viewType === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Tháng
                    </button>
                </div>
                <button 
                  onClick={goToToday}
                  className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-blue-600 shadow-sm whitespace-nowrap"
                >
                  Hôm nay
                </button>
             </div>

             <ScheduleMobile 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                weekDates={weekDates}
                events={events}
                onEventClick={handleEventClick}
                viewType={viewType}
                isDateInSemester={isDateInSemester}
             />
          </div>
        </div>
      </div>

      <TimetableDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};

// --- Sub-components ---

const ScheduleGrid = ({ weekDates, events, onEventClick, isDateInSemester }: any) => {
  const sessions = [
    { id: 'morning', label: 'Sáng', periods: [1, 2, 3, 4, 5] },
    { id: 'afternoon', label: 'Chiều', periods: [6, 7, 8, 9, 10] },
    { id: 'evening', label: 'Tối', periods: [11, 12, 13, 14, 15] }
  ];
  
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
           <tr className="border-b border-slate-100">
             <th className="w-20 py-4 px-2 border-r border-slate-100 bg-slate-50/50"></th>
             {weekdayLabels.map((day, i) => (
               <th key={i} className="py-4 px-4 text-center border-r border-slate-100 last:border-r-0">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                 </div>
               </th>
             ))}
           </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id} className="border-b border-slate-50 last:border-0 group">
              <td className="py-12 px-2 text-center border-r border-slate-100 bg-slate-50/30">
                <span className="text-sm font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  {session.label}
                </span>
              </td>
              {weekDates.map((date: Date, dayIdx: number) => {
                const dayEvents = events.filter((e: any) => 
                  Number(e.day) === dayIdx + 2 && isDateInSemester(date, e.semesterId)
                );
                const eventsInSession = dayEvents.filter((e: any) => 
                  session.periods.includes(Number(e.startPeriod))
                );

                return (
                  <td key={dayIdx} className="p-3 border-r border-slate-100 last:border-r-0 align-top min-h-[160px] relative">
                    <div className="space-y-3">
                      {eventsInSession.map((event: any) => (
                        <EventBlock key={event.id} event={event} onClick={() => onEventClick(event)} />
                      ))}
                      {eventsInSession.length === 0 && (
                        <div className="h-16 rounded-2xl border-2 border-dashed border-slate-50 flex items-center justify-center">
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EventBlock = ({ event, onClick }: any) => {
  const { start, end } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
  
  const getConfig = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'thực hành':
      case 'practice':
        return { bg: 'bg-[#f5f0ff]', border: 'border-purple-200', text: 'text-purple-700', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', label: 'Thực hành' };
      case 'online':
        return { bg: 'bg-[#fff5f0]', border: 'border-orange-200', text: 'text-orange-700', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', label: 'Học trực tuyến' };
      default:
        return { bg: 'bg-[#f0f7ff]', border: 'border-blue-200', text: 'text-blue-700', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', label: 'Học trực tiếp' };
    }
  };

  const config = getConfig(event.type);

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      onClick={onClick}
      className={`p-3 rounded-2xl border ${config.border} ${config.bg} cursor-pointer transition-all shadow-sm mb-2 h-full flex flex-col justify-between`}
    >
      <div>
        <p className="text-[10px] font-black text-slate-400 mb-1">{start} - {end}</p>
        <h4 className={`text-[13px] font-black leading-tight line-clamp-2 ${config.text}`}>
          {event.subject}
        </h4>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
          <Clock size={12} className="opacity-50" />
          <span>Tiết {event.startPeriod}-{event.endPeriod}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
          <MapPin size={12} className="opacity-50" />
          <span>{event.room || 'Phòng học'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
          <User size={12} className="opacity-50" />
          <span className="truncate italic">{event.teacher || 'Chưa cập nhật GV'}</span>
        </div>
        <div className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-[9px] font-black ${config.badgeBg} ${config.badgeText}`}>
          {config.label}
        </div>
      </div>
    </motion.div>
  );
};

const ScheduleMonthGrid = ({ selectedDate, events, onEventClick, isDateInSemester }: any) => {
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 for Monday
  };

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDay + 1;
    if (dayNum > 0 && dayNum <= daysInMonth) {
      return new Date(year, month, dayNum);
    }
    return null;
  });

  return (
    <div className="grid grid-cols-7 border-collapse">
      {weekdayLabels.map(label => (
        <div key={label} className="bg-slate-50/50 py-4 text-center border-b border-r border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
          {label}
        </div>
      ))}
      {days.map((date, i) => {
        const dayIdx = date ? (date.getDay() === 0 ? 6 : date.getDay() - 1) : -1;
        const dayEvents = date ? events.filter((e: any) => 
          Number(e.day) === dayIdx + 2 && isDateInSemester(date, e.semesterId)
        ) : [];

        return (
          <div key={i} className={`min-h-[140px] p-2 border-b border-r border-slate-100 last:border-r-0 ${!date ? 'bg-slate-50/20' : 'bg-white'}`}>
            {date && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-black ${date.toDateString() === new Date().toDateString() ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30' : 'text-slate-900'}`}>
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents
                    .slice(0, 4)
                    .map((event: any) => {
                      const { start } = getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod));
                      return (
                        <div 
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className="p-1.5 rounded-lg bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100/50 cursor-pointer transition-all space-y-0.5 group"
                        >
                          <div className="flex items-center justify-between gap-1">
                             <div className="flex items-center gap-1">
                               <Clock size={8} className="text-blue-400" />
                               <span className="text-[8px] font-black text-blue-600/70 whitespace-nowrap">
                                 {start}
                               </span>
                             </div>
                             <div className="flex items-center gap-1 bg-white/80 px-1 rounded text-[8px] font-black text-slate-500 border border-slate-100">
                               <MapPin size={8} className="text-slate-300" />
                               <span>{event.room}</span>
                             </div>
                          </div>
                          
                          <h5 className="text-[10px] font-black text-blue-900 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {event.subject}
                          </h5>
                          
                          <div className="flex items-center justify-between text-[8px] font-bold text-slate-400">
                             <span className="flex items-center gap-0.5">
                               Tiết {event.startPeriod}-{event.endPeriod}
                             </span>
                             <div className="flex items-center gap-0.5 truncate max-w-[65px] italic opacity-80">
                               <User size={8} className="opacity-50 shrink-0" />
                               <span>{event.teacher}</span>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ScheduleMobile = ({ selectedDate, onDateChange, weekDates, events, onEventClick, viewType, isDateInSemester }: any) => {
  const getDatesToDisplay = () => {
    if (viewType === 'day') return [selectedDate];
    if (viewType === 'week') return weekDates;
    if (viewType === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }).map((_, i) => new Date(year, month, i + 1));
    }
    return [selectedDate];
  };

  const datesToDisplay = getDatesToDisplay();
  const groupedEvents = datesToDisplay.map((date: Date) => {
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const dayEvents = events.filter((e: any) => 
      Number(e.day) === dayIndex + 2 && isDateInSemester(date, e.semesterId)
    );
    return { 
      date, 
      events: dayEvents,
      label: fullWeekdayLabels[dayIndex],
      dateStr: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    };
  }).filter((group: any) => group.events.length > 0 || viewType === 'day');

  const totalEvents = groupedEvents.reduce((acc: number, group: any) => acc + group.events.length, 0);

  return (
    <div className="space-y-6">
      {/* Improved Date Strip */}
      {viewType === 'day' ? (
        <div className="flex items-center gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {weekDates.map((date: Date, idx: number) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={idx}
                onClick={() => onDateChange(date)}
                className={`flex-shrink-0 w-[52px] h-[72px] flex flex-col items-center justify-center rounded-[1.25rem] transition-all relative ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-white border border-slate-100 text-slate-400'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-tighter opacity-70 mb-1">{weekdayLabels[idx]}</span>
                <span className="text-base font-black">{date.getDate()}</span>
                {isSelected && (
                  <motion.div layoutId="activeDot" className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-4">
           <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Calendar size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang xem {viewType === 'week' ? 'tuần' : 'tháng'}</p>
                    <p className="text-sm font-black text-slate-900">
                      {viewType === 'week' 
                        ? `${weekDates[0].getDate()}/${weekDates[0].getMonth()+1} - ${weekDates[6].getDate()}/${weekDates[6].getMonth()+1}`
                        : selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
                      }
                    </p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => {
                    const d = new Date(selectedDate);
                    if (viewType === 'week') d.setDate(d.getDate() - 7);
                    else d.setMonth(d.getMonth() - 1);
                    onDateChange(d);
                 }} className="p-2 rounded-lg bg-slate-50 text-slate-400">
                    <ChevronLeft size={18} />
                 </button>
                 <button onClick={() => {
                    const d = new Date(selectedDate);
                    if (viewType === 'week') d.setDate(d.getDate() + 7);
                    else d.setMonth(d.getMonth() + 1);
                    onDateChange(d);
                 }} className="p-2 rounded-lg bg-slate-50 text-slate-400">
                    <ChevronRight size={18} />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Navigation for Day View */}
      {viewType === 'day' && (
        <div className="px-4">
          <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl px-5 py-4 shadow-xl">
            <div className="flex items-center gap-3">
               <Calendar size={18} className="text-blue-400" />
               <span className="text-sm font-black">{fullWeekdayLabels[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}, {selectedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
            </div>
            <div className="flex gap-4">
               <button onClick={() => {
                 const d = new Date(selectedDate);
                 d.setDate(d.getDate() - 1);
                 onDateChange(d);
               }} className="hover:opacity-70">
                 <ChevronLeft size={20} />
               </button>
               <button onClick={() => {
                 const d = new Date(selectedDate);
                 d.setDate(d.getDate() + 1);
                 onDateChange(d);
               }} className="hover:opacity-70">
                 <ChevronRight size={20} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Event List */}
      <div className="px-4 space-y-8">
        {totalEvents > 0 ? (
          groupedEvents.map((group: any, gIdx: number) => (
            <div key={gIdx} className="space-y-4">
              {viewType !== 'day' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {group.label}, {group.dateStr}
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
              )}
              
              <div className="space-y-4">
                {group.events.length > 0 ? (
                  group.events.map((event: any) => {
                    const period = Number(event.startPeriod);
                    let sessionLabel = 'SÁNG';
                    let sessionColor = 'bg-orange-50 text-orange-600';
                    
                    if (period >= 6 && period <= 10) {
                      sessionLabel = 'CHIỀU';
                      sessionColor = 'bg-blue-50 text-blue-600';
                    } else if (period >= 11) {
                      sessionLabel = 'TỐI';
                      sessionColor = 'bg-purple-50 text-purple-600';
                    }

                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="w-14 flex flex-col items-center pt-2 shrink-0">
                           <span className="text-xs font-black text-slate-900">{getPeriodTimes(Number(event.startPeriod), Number(event.endPeriod)).start}</span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md mt-1 ${sessionColor}`}>
                              {sessionLabel}
                           </span>
                        </div>
                        <div className="flex-1">
                           <EventBlock event={event} onClick={() => onEventClick(event)} />
                        </div>
                      </div>
                    );
                  })
                ) : viewType === 'day' ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] py-16 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                       <Calendar size={32} className="text-slate-200" />
                    </div>
                    <p className="text-xs font-black text-slate-400">Không có lịch học trong ngày này</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
               <Calendar size={32} className="text-slate-200" />
            </div>
            <p className="text-xs font-black text-slate-400">Không có lịch học trong {viewType === 'week' ? 'tuần' : 'tháng'} này</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-6">
        <button className="w-full flex items-center justify-between bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-600/20">
          <span>Xem chi tiết học kỳ này</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ScheduleV2;
