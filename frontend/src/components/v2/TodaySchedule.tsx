import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScheduleItem from './ScheduleItem';

interface Schedule {
  name: string;
  room: string;
  periods: string;
  time: string;
  status: 'online' | 'offline' | 'remote';
}

interface TodayScheduleProps {
  schedule: Schedule[];
}

const TodaySchedule = ({ schedule }: TodayScheduleProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100/50 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Lịch học hôm nay</h3>
        <button 
          onClick={() => navigate('/lich-hoc')}
          className="text-blue-600 text-[11px] font-black uppercase tracking-widest hover:underline transition-all"
        >
          Xem thời khóa biểu
        </button>
      </div>

      <div className="space-y-4 flex-1">
        {schedule.length > 0 ? (
          schedule.map((item, index) => (
            <ScheduleItem 
              key={index} 
              {...item} 
              period={item.periods}
              status={item.status || (index === 0 ? 'online' : (index === 1 ? 'offline' : 'remote'))} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Calendar className="text-slate-200" size={28} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Không có lịch học</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button 
          onClick={() => navigate('/lich-hoc')}
          className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-[0.98]"
        >
          Xem tất cả lịch học
        </button>
      </div>
    </div>
  );
};

export default TodaySchedule;
