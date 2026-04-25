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
  selectedDate: Date;
  onEventClick: (event: TimetableEvent) => void;
}

const TimetableDailyList: React.FC<Props> = ({ events, selectedDate, onEventClick }) => {
  const dayOfWeek = selectedDate.getDay();
  const timetableDay = dayOfWeek === 0 ? 8 : dayOfWeek + 1;

  const dailyEvents = events
    .filter(e => Number(e.day) === timetableDay)
    .sort((a, b) => Number(a.startPeriod) - Number(b.startPeriod));

  const getStatusColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'online': return 'bg-[#00b09b]'; // Greenish for Online as per screen
      case 'exam': return 'bg-[#f1c40f]'; // Yellow for Exam
      case 'official_exam': return 'bg-[#2ecc71]'; // Lịch thi chính thức
      default: return 'bg-[#00b09b]';
    }
  };

  return (
    <div className="space-y-4 px-2">
      {dailyEvents.length > 0 ? (
        dailyEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onEventClick(event)}
            className="bg-white rounded-xl border border-[#d1d8e0] shadow-sm overflow-hidden flex min-h-[140px] cursor-pointer active:scale-[0.99] transition-transform"
          >
            {/* Status Bar */}
            <div className={`w-3 shrink-0 ${getStatusColor(event.type)}`} />
            
            <div className="p-4 flex-1 flex flex-col justify-center space-y-2">
              <h3 className="text-[17px] font-bold text-[#2d3436] mb-1">
                {event.subject}
              </h3>
              
              <div className="space-y-1.5">
                <div className="flex gap-4 text-[15px]">
                  <span className="text-[#636e72] w-24 shrink-0 font-medium">Tiết :</span>
                  <span className="text-[#2d3436] font-bold">{event.startPeriod} - {event.endPeriod}</span>
                </div>
                
                <div className="flex gap-4 text-[15px]">
                  <span className="text-[#636e72] w-24 shrink-0 font-medium">Phòng :</span>
                  <span className="text-[#2d3436] font-bold">{event.room}</span>
                </div>
                
                <div className="flex gap-4 text-[15px]">
                  <span className="text-[#636e72] w-24 shrink-0 font-medium">Giảng viên :</span>
                  <span className="text-[#2d3436] font-bold">{event.teacher}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          Không có lịch học trong ngày này
        </div>
      )}

      {/* Legend - Exact match to screenshot */}
      <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-2 px-2 pb-10">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#636e72]">
          <div className="h-3.5 w-3.5 rounded-full bg-[#00b09b]" /> Lịch học
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#636e72]">
          <div className="h-3.5 w-3.5 rounded-full bg-[#f1c40f]" /> Lịch thi
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#636e72]">
          <div className="h-3.5 w-3.5 rounded-full bg-[#0984e3]" /> Lịch trực tuyến
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#636e72]">
          <div className="h-3.5 w-3.5 rounded-full bg-[#d63031]" /> Tạm ngưng
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#636e72] col-span-2">
          <div className="h-3.5 w-3.5 rounded-full bg-[#95ef9f]" /> Lịch thi chính thức
        </div>
      </div>
    </div>
  );
};

export default TimetableDailyList;
