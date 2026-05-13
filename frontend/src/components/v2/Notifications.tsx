import { Bell, Megaphone, Calendar, CreditCard, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';

interface Notification {
  title: string;
  tag: string;
  time: string;
  color: string;
}

interface NotificationsProps {
  notifications: Notification[];
}

const iconMap: Record<string, any> = {
  'Hệ thống': Bell,
  'Học tập': BookOpen,
  'Học phí': CreditCard,
  'Lịch thi': Calendar,
  'Khác': Megaphone
};

const Notifications = ({ notifications }: NotificationsProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100/50 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Thông báo</h3>
        <button 
          onClick={() => navigate('/thong-bao')}
          className="text-blue-600 text-[11px] font-black uppercase tracking-widest hover:underline transition-all"
        >
          Xem tất cả
        </button>
      </div>

      <div className="space-y-3 flex-1">
        {notifications.length > 0 ? (
          notifications.map((item, index) => (
            <NotificationItem 
              key={index} 
              {...item} 
              icon={iconMap[item.tag] || Megaphone} 
              description={item.tag} 
              date={item.time}
              isNew={index < 2} 
              color={item.color as any || 'blue'}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Bell className="text-slate-200" size={28} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Không có thông báo mới</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
