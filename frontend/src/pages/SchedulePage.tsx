import { useState } from 'react';
import type { ScheduleEvent } from '../components/schedule/types';
import ScheduleHeader from '../components/schedule/ScheduleHeader';
import ScheduleLegend from '../components/schedule/ScheduleLegend';
import DayView from '../components/schedule/DayView';
import WeekView from '../components/schedule/WeekView';
import MonthView from '../components/schedule/MonthView';
import ScheduleEventModal from '../components/schedule/ScheduleEventModal';

// Mock Data Realistic
const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    subject: 'Lập trình Web Frontend',
    teacher: 'Nguyễn Văn A',
    room: 'Phòng 201 - Tòa A',
    classId: 'SE101.O11',
    day: 2, // Thứ 2
    startPeriod: 1,
    endPeriod: 5,
    type: 'offline'
  },
  {
    id: '2',
    subject: 'Cơ sở dữ liệu nâng cao',
    teacher: 'Trần Thị B',
    room: 'Phòng 305 - Tòa B',
    classId: 'DB201.O12',
    day: 2, // Thứ 2
    startPeriod: 6,
    endPeriod: 10,
    type: 'hybrid'
  },
  {
    id: '3',
    subject: 'Toán rời rạc',
    teacher: 'Lê Văn C',
    room: 'Google Meet',
    classId: 'MA102.O21',
    day: 4, // Thứ 4
    startPeriod: 1,
    endPeriod: 3,
    type: 'online'
  },
  {
    id: '4',
    subject: 'Kiến trúc máy tính (Thi Giữa Kỳ)',
    teacher: 'Phạm Thị D',
    room: 'Hội trường 1',
    classId: 'AR301.O11',
    day: 6, // Thứ 6
    startPeriod: 7,
    endPeriod: 9,
    type: 'exam'
  }
];

const SchedulePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Filter events based on viewMode
  // In a real app, you might fetch data for the specific week/month here.
  // For this mock, we just pass the events down to the views which handle their own day filtering.
  const filteredEvents = mockEvents;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Container chính căn giữa, max-w-7xl để đáp ứng layout rộng trên PC */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-6 md:space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">Thời khóa biểu cá nhân</h1>
            <p className="text-slate-500 font-medium mt-1">Học kỳ 2 Năm học 2023-2024</p>
          </div>
          <ScheduleLegend />
        </div>

        <ScheduleHeader 
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="mt-6">
          {viewMode === 'day' && (
            <DayView 
              currentDate={currentDate}
              events={filteredEvents.filter(e => Number(e.day) === (currentDate.getDay() === 0 ? 8 : currentDate.getDay() + 1))}
              onEventClick={setSelectedEvent}
            />
          )}
          {viewMode === 'week' && (
            <WeekView 
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
            />
          )}
          {viewMode === 'month' && (
            <MonthView 
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onDateSelect={(d) => { setCurrentDate(d); setViewMode('day'); }}
            />
          )}
        </div>
      </div>

      <ScheduleEventModal 
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
};

export default SchedulePage;
