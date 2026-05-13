import { 
  Calendar, 
  Award, 
  User, 
  Info 
} from 'lucide-react';
import QuickAccessCard from './QuickAccessCard';

const QuickActions = () => {
  const actions = [
    {
      icon: Calendar,
      label: 'Lịch học',
      description: 'Xem thời khóa biểu của bạn',
      href: '/schedule',
      color: 'blue'
    },
    {
      icon: Award,
      label: 'Điểm danh',
      description: 'Quét mã QR để điểm danh buổi học',
      href: '/attendance/scan',
      color: 'emerald'
    },
    {
      icon: User,
      label: 'Tài khoản',
      description: 'Quản lý thông tin cá nhân',
      href: '/profile',
      color: 'purple'
    },
    {
      icon: Info,
      label: 'Hướng dẫn',
      description: 'Xem hướng dẫn sử dụng hệ thống',
      href: '/huong-dan',
      color: 'indigo'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {actions.map((action, index) => (
        <QuickAccessCard key={index} {...action as any} />
      ))}
    </div>
  );
};

export default QuickActions;
