import { MapPin, Clock } from 'lucide-react';

interface ScheduleItemProps {
  name: string;
  room: string;
  period: string;
  time: string;
  status: 'online' | 'offline' | 'remote';
}

const ScheduleItem = ({ name, room, period, time, status }: ScheduleItemProps) => {
  const [startTime, endTime] = time.split(' - ');
  
  const statusColors = {
    online: 'text-blue-600 bg-blue-50 border-blue-100',
    offline: 'text-purple-600 bg-purple-50 border-purple-100',
    remote: 'text-amber-600 bg-amber-50 border-amber-100',
  };

  const statusLabels = {
    online: 'Học trực tiếp',
    offline: 'Thực hành',
    remote: 'Học trực tuyến',
  };

  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50/80 transition-all group">
      {/* Time Column */}
      <div className="flex flex-col items-center justify-center shrink-0 w-12">
        <span className="text-[11px] font-black text-slate-400">{startTime}</span>
        <span className="text-[11px] font-black text-slate-800">{endTime}</span>
      </div>

      {/* Indicator Line */}
      <div className="relative flex flex-col items-center py-1 shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-slate-300'}`} />
        <div className="w-0.5 flex-1 bg-slate-100 my-1 rounded-full" />
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] md:text-sm font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
          {name}
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{room}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Tiết {period}</span>
          </div>
        </div>
      </div>

      {/* Badge Column */}
      <div className="shrink-0 flex items-center">
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
};

export default ScheduleItem;
