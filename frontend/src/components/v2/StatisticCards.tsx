import { 
  BarChart3, 
  BookOpen, 
  CalendarDays, 
  CheckCircle2 
} from 'lucide-react';
import StatCard from './StatCard';

interface StatisticCardsProps {
  stats: {
    gpa: number;
    earnedCredits: number;
    totalCredits: number;
    daysRemaining: number;
    attendanceRate: number;
    trainingScore: number;
    scheduleCount?: number;
    timeRange?: string;
  };
}

const StatisticCards = ({ stats }: StatisticCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard
        icon={CalendarDays}
        label="Lịch học hôm nay"
        value={stats.scheduleCount || 0}
        unit="buổi học"
        subValue={stats.timeRange || "07:30 - 18:45"}
        color="blue"
      />
      <StatCard
        icon={BarChart3}
        label="Điểm trung bình (GPA)"
        value={stats.gpa.toFixed(2)}
        color="emerald"
        trend={{ text: "0.15", isUp: true }}
      />
      <StatCard
        icon={BookOpen}
        label="Số tín chỉ tích lũy"
        value={`${stats.earnedCredits} / ${stats.totalCredits}`}
        subValue={`Còn ${stats.totalCredits - stats.earnedCredits} tín chỉ để hoàn thành`}
        color="purple"
      />
      <StatCard
        icon={CheckCircle2}
        label="Điểm danh"
        value={`${stats.attendanceRate}%`}
        subValue="Tỷ lệ tham gia tốt"
        color="amber"
      />
    </div>
  );
};

export default StatisticCards;
