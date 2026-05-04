import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface AnalyticsOverview {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  activeQrSessions: number;
  pendingTraining: number;
  approvedTraining: number;
  notificationsToday: number;
  fraudAlerts24h: number;
}

interface AttendanceTrendItem {
  date: string;
  checkIns: number;
}

interface TopClassItem {
  classId: string;
  sessions: number;
  attendanceRate: number;
}

interface FraudWarningItem {
  id: number;
  createdAt: string;
  actorName: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
}

interface AdminAnalyticsResponse {
  overview: AnalyticsOverview;
  attendanceTrend: AttendanceTrendItem[];
  topClassesByAttendance: TopClassItem[];
  fraudWarnings: FraudWarningItem[];
}

const defaultOverview: AnalyticsOverview = {
  totalStudents: 0,
  totalClasses: 0,
  totalSubjects: 0,
  activeQrSessions: 0,
  pendingTraining: 0,
  approvedTraining: 0,
  notificationsToday: 0,
  fraudAlerts24h: 0,
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  tone,
  to,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo';
  to?: string;
}) => {
  const toneClassMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-500/10 text-amber-700 border-amber-100',
    rose: 'bg-rose-500/10 text-rose-700 border-rose-100',
    slate: 'bg-slate-500/10 text-slate-700 border-slate-100',
    indigo: 'bg-indigo-500/10 text-indigo-700 border-indigo-100',
  };

  const content = (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${toneClassMap[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview>(defaultOverview);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendItem[]>([]);
  const [topClasses, setTopClasses] = useState<TopClassItem[]>([]);
  const [fraudWarnings, setFraudWarnings] = useState<FraudWarningItem[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get<AdminAnalyticsResponse>('/admin/analytics');
        setOverview(response.data?.overview || defaultOverview);
        setAttendanceTrend(Array.isArray(response.data?.attendanceTrend) ? response.data.attendanceTrend : []);
        setTopClasses(Array.isArray(response.data?.topClassesByAttendance) ? response.data.topClassesByAttendance : []);
        setFraudWarnings(Array.isArray(response.data?.fraudWarnings) ? response.data.fraudWarnings : []);
      } catch (error) {
        console.error('Failed to fetch admin analytics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const trendMax = useMemo(() => {
    const maxValue = attendanceTrend.reduce((max, item) => Math.max(max, item.checkIns), 0);
    return maxValue > 0 ? maxValue : 1;
  }, [attendanceTrend]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
          <TrendingUp size={12} />
          Analytics dashboard
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          Tong quan van hanh he thong
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Theo doi hoc vu, diem danh QR va canh bao rui ro theo thoi gian thuc.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tong sinh vien" value={overview.totalStudents} icon={Users} tone="blue" to="/students" />
        <StatCard title="Tong lop hoc" value={overview.totalClasses} icon={GraduationCap} tone="indigo" to="/classes" />
        <StatCard title="Phien QR dang mo" value={overview.activeQrSessions} icon={CalendarCheck} tone="emerald" to="/attendance/manage" />
        <StatCard title="Canh bao QR 24h" value={overview.fraudAlerts24h} icon={ShieldAlert} tone="rose" to="/attendance/manage" />
        <StatCard title="Phieu DRL cho duyet" value={overview.pendingTraining} icon={ClipboardList} tone="amber" to="/training/approval" />
        <StatCard title="Phieu DRL da duyet" value={overview.approvedTraining} icon={ClipboardList} tone="slate" to="/drl" />
        <StatCard title="Thong bao hom nay" value={overview.notificationsToday} icon={Bell} tone="blue" to="/notifications" />
        <StatCard title="Tong mon hoc" value={overview.totalSubjects} icon={GraduationCap} tone="indigo" to="/academic/manage" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Luong diem danh 7 ngay</h2>
            <span className="text-xs font-bold text-slate-500">Check-in theo ngay</span>
          </div>

          {loading ? (
            <div className="h-56 animate-pulse rounded-2xl bg-slate-50" />
          ) : attendanceTrend.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
              Chua co du lieu diem danh gan day.
            </div>
          ) : (
            <div className="grid h-56 grid-cols-7 items-end gap-3">
              {attendanceTrend.map((item) => {
                const heightPercent = Math.max((item.checkIns / trendMax) * 100, item.checkIns > 0 ? 8 : 2);
                return (
                  <div key={item.date} className="flex flex-col items-center gap-2">
                    <div className="relative flex h-44 w-full items-end justify-center rounded-xl bg-slate-50">
                      <div
                        className="w-[70%] rounded-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-slate-500">
                      {new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Top lop theo ty le diem danh</h2>
            <span className="text-xs font-bold text-slate-500">30 ngay</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-50" />
              ))}
            </div>
          ) : topClasses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
              Chua co lop du du lieu de tinh ti le.
            </div>
          ) : (
            <div className="space-y-3">
              {topClasses.map((item) => (
                <div key={item.classId} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-bold text-slate-800">{item.classId}</p>
                    <p className="text-sm font-black text-emerald-700">{item.attendanceRate}%</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(item.attendanceRate, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.sessions} phien gan day</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-rose-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
            <AlertTriangle size={18} className="text-rose-600" />
            Canh bao gian lan QR gan day
          </h2>
          <Link to="/attendance/manage" className="text-xs font-bold text-rose-600 hover:underline">
            Mo quan ly QR
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-50" />
            ))}
          </div>
        ) : fraudWarnings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            Chua ghi nhan canh bao gian lan moi.
          </div>
        ) : (
          <div className="space-y-3">
            {fraudWarnings.map((warning) => {
              const details = warning.details || {};
              const reason = typeof details.reason === 'string' ? details.reason : 'QR_RISK';
              const severity = typeof details.severity === 'string' ? details.severity : 'MEDIUM';
              return (
                <div key={warning.id} className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-rose-800">{reason}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-rose-700">
                      {severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-rose-700">
                    {new Date(warning.createdAt).toLocaleString('vi-VN')} - {warning.actorName}
                    {warning.targetId ? ` - Session #${warning.targetId}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

