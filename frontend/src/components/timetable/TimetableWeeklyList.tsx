import React from 'react';
import { motion } from 'framer-motion';

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

interface Props {
  events: TimetableEvent[];
  selectedDate: Date; // Added to calculate actual dates
  onEventClick: (event: TimetableEvent) => void;
}

const TimetableWeeklyList: React.FC<Props> = ({ events, selectedDate, onEventClick }) => {
  // Get the start of the week (Monday) for the selected date
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(selectedDate);

  const days = [
    { label: 'Thứ Hai', value: 2 },
    { label: 'Thứ Ba', value: 3 },
    { label: 'Thứ Tư', value: 4 },
    { label: 'Thứ Năm', value: 5 },
    { label: 'Thứ Sáu', value: 6 },
    { label: 'Thứ Bảy', value: 7 },
    { label: 'Chủ Nhật', value: 8 },
  ];

  const getStatusColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'online': return 'bg-[#00b09b]';
      case 'exam': return 'bg-[#f1c40f]';
      case 'official_exam': return 'bg-[#2ecc71]';
      default: return 'bg-[#00b09b]';
    }
  };

  const getDateStr = (dayValue: number) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + (dayValue - 2));
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-8 px-2 pb-20">
      {days.map((day) => {
        const dayEvents = events
          .filter(e => Number(e.day) === day.value)
          .sort((a, b) => Number(a.startPeriod) - Number(b.startPeriod));

        if (dayEvents.length === 0) return null;

        return (
          <div key={day.value} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 bg-blue-600 rounded-full" />
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{day.label}</h2>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{getDateStr(day.value)}</span>
            </div>

            <div className="space-y-3">
              {dayEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => onEventClick(event)}
                  className="bg-white rounded-xl border border-[#d1d8e0] shadow-sm overflow-hidden flex min-h-[140px] cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className={`w-3 shrink-0 ${getStatusColor(event.type)}`} />
                  <div className="p-4 flex-1 flex flex-col justify-center space-y-2">
                    <h3 className="text-[17px] font-bold text-[#2d3436]">
                      {event.subject}
                    </h3>
                    <div className="space-y-1.5">
                       <div className="flex gap-4 text-[14px]">
                        <span className="text-[#636e72] w-24 shrink-0">Tiết :</span>
                        <span className="text-[#2d3436] font-bold">{event.startPeriod} - {event.endPeriod}</span>
                      </div>
                      <div className="flex gap-4 text-[14px]">
                        <span className="text-[#636e72] w-24 shrink-0">Phòng :</span>
                        <span className="text-[#2d3436] font-bold">{event.room}</span>
                      </div>
                      <div className="flex gap-4 text-[14px]">
                        <span className="text-[#636e72] w-24 shrink-0">Giảng viên :</span>
                        <span className="text-[#2d3436] font-bold truncate">{event.teacher}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {events.length === 0 && (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          Không có lịch học trong tuần này
        </div>
      )}
    </div>
  );
};

export default TimetableWeeklyList;
