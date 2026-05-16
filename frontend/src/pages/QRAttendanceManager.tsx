import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Globe,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Navigation,
  Play,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

interface ClassOption {
  name: string;
  studentCount: number;
}

interface SessionItem {
  id: number;
  title: string;
  subject: string;
  class_id: string;
  sessionDate: string;
  qrToken: string;
  lat: number;
  lng: number;
  radius: number;
  isActive: boolean;
  createdAt: string;
  endedAt?: string | null;
  attendeeCount: number;
}

interface SessionSummaryStats {
  totalStudents: number;
  checkedIn: number;
  absentCount: number;
  attendanceRate: number;
  baselineCreatedCount: number;
  verifiedIpCount: number;
  verifiedLocationCount: number;
  suspiciousCheckIns?: number;
  riskAttempts?: number;
}

interface SessionSummaryStudent {
  id: number;
  name: string;
  student_code: string;
  class_id: string;
  order_number?: number | null;
  attendance: null | {
    id: number;
    status: string;
    checkedInAt: string;
    ipAddress?: string | null;
    baselineCreated: boolean;
    verifiedIp?: boolean | null;
    verifiedLocation?: boolean | null;
    profileDistance?: number | null;
    sessionDistance?: number | null;
  };
  profile: null | {
    firstIpAddress: string;
    firstLatitude: number;
    firstLongitude: number;
    firstCheckInAt: string;
    lastCheckInAt?: string | null;
    totalVerifiedCheckIns: number;
  };
}

interface SessionSummaryResponse {
  session: SessionItem;
  stats: SessionSummaryStats;
  riskWarnings?: Array<{
    id: number;
    createdAt: string;
    actor: null | {
      id: number;
      name: string;
      username: string;
      student_code?: string;
    };
    details: Record<string, unknown> | null;
  }>;
  students: SessionSummaryStudent[];
}

const GOOGLE_MAP_PATTERNS = [
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/,
  /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
];

const parseCoordinatesFromText = (input: string) => {
  const text = input.trim();
  if (!text) return null;

  if (text.includes('maps.app.goo.gl')) {
    toast.error('Link maps.app.goo.gl không chứa tọa độ. Vui lòng mở link đầy đủ hoặc nhập lat,lng.');
    return null;
  }

  for (const pattern of GOOGLE_MAP_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  return null;
};

const QRAttendanceManager = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [summary, setSummary] = useState<SessionSummaryResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mapInput, setMapInput] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [classFilter, setClassFilter] = useState('');
  const [newSession, setNewSession] = useState({
    title: '',
    subject: '',
    class_id: '',
    sessionDate: new Date().toISOString().slice(0, 10),
    radius: 100,
    lat: 0,
    lng: 0,
  });
  const [isFullscreenQR, setIsFullscreenQR] = useState(false);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [selectedSessionId, sessions],
  );

  const previewGoogleMapsUrl = useMemo(() => {
    if (!newSession.lat || !newSession.lng) return '';
    return `https://www.google.com/maps?q=${newSession.lat},${newSession.lng}`;
  }, [newSession.lat, newSession.lng]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
      setNewSession((prev) => ({
        ...prev,
        class_id: prev.class_id || res.data?.[0]?.name || '',
      }));
    } catch (error) {
      console.error('Failed to fetch classes', error);
      toast.error('Không thể tải danh sách lớp');
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/attendance/sessions', {
        params: {
          classId: classFilter || undefined,
          limit: 30,
        },
      });
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
      toast.error('Không thể tải danh sách phiên điểm danh');
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchSummary = async (sessionId: number, silent = false) => {
    if (!silent) setSummaryLoading(true);
    try {
      const res = await api.get(`/attendance/sessions/${sessionId}/summary`);
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch summary', error);
      if (!silent) {
        toast.error('Không thể tải thống kê phiên điểm danh');
      }
    } finally {
      if (!silent) setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSessions();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [classFilter]);

  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedSessionId(null);
      setSummary(null);
      return;
    }

    const sessionStillExists = sessions.some((session) => session.id === selectedSessionId);
    if (!selectedSessionId || !sessionStillExists) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    if (!selectedSessionId) return;
    fetchSummary(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSession?.id || !selectedSession.isActive) return;
    const interval = setInterval(() => {
      void fetchSummary(selectedSession.id, true);
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedSession?.id, selectedSession?.isActive]);

  const updateCoordinates = (lat: number, lng: number) => {
    setNewSession((prev) => ({ ...prev, lat, lng }));
  };

  const applyGoogleMapsInput = () => {
    const parsed = parseCoordinatesFromText(mapInput);
    if (!parsed) {
      toast.error('Không đọc được tọa độ từ dữ liệu đã dán');
      return;
    }

    updateCoordinates(parsed.lat, parsed.lng);
    toast.success('Đã áp dụng tọa độ từ Google Maps');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateCoordinates(pos.coords.latitude, pos.coords.longitude);
        setGpsAccuracy(typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null);
        toast.success('Đã lấy vị trí hiện tại');
      },
      () => toast.error('Không thể lấy GPS. Vui lòng cấp quyền hoặc nhập link Google Maps'),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleCreateSession = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newSession.class_id) {
      toast.error('Vui lòng chọn lớp cho phiên điểm danh');
      return;
    }

    if (!newSession.lat || !newSession.lng) {
      toast.error('Vui lòng nhập vị trí GPS hoặc Google Maps trước khi tạo phiên');
      return;
    }

    setCreating(true);
    try {
      await api.post('/attendance/session', newSession);
      toast.success('Đã tạo phiên điểm danh QR mới');
      setNewSession((prev) => ({
        ...prev,
        title: '',
        subject: '',
      }));
      await fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo phiên điểm danh');
    } finally {
      setCreating(false);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    try {
      await api.patch(`/attendance/sessions/${sessionId}/end`);
      toast.success('Đã kết thúc phiên điểm danh');
      await fetchSessions();
      if (selectedSessionId === sessionId) {
        await fetchSummary(sessionId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể kết thúc phiên');
    }
  };

  return (
    <>
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/30">
        <h2 className="text-3xl font-extrabold text-slate-900">Quản lý điểm danh QR theo lớp</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
          Mỗi phiên QR gắn với một lớp cụ thể. Sinh viên quét thành công khi nằm trong bán kính của phiên và
          vượt qua đối chiếu IP/tọa độ với hồ sơ xác minh đầu tiên lưu trong database.
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-3">
            <QrCode className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Tạo phiên điểm danh mới</h3>
            <p className="text-sm text-slate-500">Chọn lớp, đặt vị trí và bán kính QR trước khi bắt đầu.</p>
          </div>
        </div>

        <form onSubmit={handleCreateSession} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Lớp học</label>
            <select
              required
              value={newSession.class_id}
              onChange={(event) => setNewSession((prev) => ({ ...prev, class_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Chọn lớp</option>
              {classes.map((classItem) => (
                <option key={classItem.name} value={classItem.name}>
                  {classItem.name} ({classItem.studentCount} SV)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Calendar size={14} />
              Ngày học
            </label>
            <input
              type="date"
              required
              value={newSession.sessionDate}
              onChange={(event) => setNewSession((prev) => ({ ...prev, sessionDate: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Tên phiên / tiết học</label>
            <input
              type="text"
              required
              value={newSession.title}
              onChange={(event) => setNewSession((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="VD: Tiết 1-3"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Môn học</label>
            <input
              type="text"
              value={newSession.subject}
              onChange={(event) => setNewSession((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="VD: Công nghệ phần mềm"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Bán kính điểm danh (m)</label>
            <input
              type="number"
              required
              min={10}
              max={500}
              value={newSession.radius}
              onChange={(event) =>
                setNewSession((prev) => ({ ...prev, radius: Number(event.target.value) || 0 }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <LinkIcon size={14} />
              Link Google Maps hoặc chuỗi lat,lng
            </label>
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                type="text"
                value={mapInput}
                onChange={(event) => setMapInput(event.target.value)}
                placeholder="Dán link Google Maps có tọa độ hoặc chuỗi 10.030243,105.768411"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={applyGoogleMapsInput}
                className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-100"
              >
                Áp dụng từ Maps
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Vĩ độ</label>
            <input
              type="number"
              min={-90}
              max={90}
              step="any"
              value={newSession.lat || ''}
              onChange={(event) => updateCoordinates(Number(event.target.value || 0), newSession.lng)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Kinh độ</label>
            <input
              type="number"
              min={-180}
              max={180}
              step="any"
              value={newSession.lng || ''}
              onChange={(event) => updateCoordinates(newSession.lat, Number(event.target.value || 0))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:col-span-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex flex-wrap gap-6 font-mono">
                <span>Vĩ độ: {newSession.lat ? newSession.lat.toFixed(6) : '--'}</span>
                <span>Kinh độ: {newSession.lng ? newSession.lng.toFixed(6) : '--'}</span>
              </div>
              <p>Độ chính xác GPS: <strong>{gpsAccuracy !== null ? `${Math.round(gpsAccuracy)} m` : 'Chưa có dữ liệu'}</strong></p>
              {previewGoogleMapsUrl && (
                <a
                  href={previewGoogleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-800"
                >
                  <LinkIcon size={14} />
                  Mở vị trí này trên Google Maps
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={getCurrentLocation}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-primary-400"
            >
              <Navigation className="h-4 w-4" />
              Lấy vị trí GPS
            </button>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-primary-600 py-4 font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700 disabled:opacity-50 md:col-span-2"
          >
            <span className="flex items-center justify-center gap-3">
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Bắt đầu phiên điểm danh
            </span>
          </button>
        </form>
      </div>

      <div className="space-y-5 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Thống kê điểm danh theo lớp</h3>
            <p className="text-sm text-slate-500">Chọn lớp và phiên để xem tỷ lệ điểm danh và danh sách sinh viên.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả các lớp</option>
              {classes.map((classItem) => (
                <option key={classItem.name} value={classItem.name}>
                  {classItem.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSessionId || ''}
              onChange={(event) => setSelectedSessionId(Number(event.target.value) || null)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
              disabled={sessions.length === 0}
            >
              <option value="">Chọn phiên</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  [{session.class_id}] {session.title} - {new Date(session.sessionDate).toLocaleDateString('vi-VN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 py-16 text-center text-slate-400">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Đang tải danh sách phiên điểm danh...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400">
            <QrCode className="mx-auto mb-4 h-16 w-16 opacity-20" />
            <p className="font-medium">Chưa có phiên điểm danh nào phù hợp bộ lọc hiện tại</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              {selectedSession && (
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary-700">
                        {selectedSession.class_id}
                      </div>
                      <h4 className="text-xl font-bold text-slate-800">{selectedSession.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">{selectedSession.subject || 'Không có môn học'}</p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        selectedSession.isActive
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {selectedSession.isActive ? 'Đang hoạt động' : 'Đã kết thúc'}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary-500" />
                      {new Date(selectedSession.sessionDate).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary-500" />
                      Bán kính cho phép: {selectedSession.radius}m
                    </p>
                    <p className="flex items-center gap-2">
                      <Users size={14} className="text-primary-500" />
                      Đã điểm danh: {selectedSession.attendeeCount}
                    </p>
                  </div>

                  {selectedSession.isActive && (
                    <div 
                      onClick={() => setIsFullscreenQR(true)}
                      className="group relative mt-5 cursor-zoom-in rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-inner transition-all hover:border-primary-300 hover:bg-slate-50"
                    >
                      <QRCodeSVG 
                        value={`${window.location.origin}/qr/${selectedSession.qrToken}`} 
                        size={190} 
                        level="H" 
                        includeMargin 
                        className="mx-auto"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 opacity-0 transition-opacity group-hover:opacity-100 rounded-2xl">
                        <span className="flex items-center gap-2 text-sm font-black text-primary-600 uppercase italic">
                          <QrCode size={18} /> Phóng to
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => fetchSummary(selectedSession.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                    >
                      <RefreshCw size={14} />
                      Làm mới
                    </button>
                    {selectedSession.isActive && (
                      <button
                        type="button"
                        onClick={() => handleEndSession(selectedSession.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                      >
                        <XCircle size={14} />
                        Kết thúc
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {summaryLoading || !summary ? (
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 py-20 text-center text-slate-400">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
                  Đang tải thống kê phiên...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="group rounded-3xl border border-emerald-100 bg-emerald-50 p-5 transition-all hover:shadow-md hover:shadow-emerald-100/50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã điểm danh</p>
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </div>
                      <p className="mt-2 text-3xl font-black text-emerald-700">{summary.stats.checkedIn}</p>
                    </div>
                    <div className="group rounded-3xl border border-red-100 bg-red-50 p-5 transition-all hover:shadow-md hover:shadow-red-100/50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-red-600">Chưa điểm danh</p>
                        <XCircle size={18} className="text-red-500" />
                      </div>
                      <p className="mt-2 text-3xl font-black text-red-700">{summary.stats.absentCount}</p>
                    </div>
                    <div className="group rounded-3xl border border-blue-100 bg-blue-50 p-5 transition-all hover:shadow-md hover:shadow-blue-100/50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Tổng sinh viên</p>
                        <Users size={18} className="text-blue-500" />
                      </div>
                      <p className="mt-2 text-3xl font-black text-blue-700">{summary.stats.totalStudents}</p>
                    </div>
                    <div className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition-all hover:shadow-md hover:shadow-slate-200/50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tỷ lệ</p>
                        <RefreshCw size={18} className="text-slate-400" />
                      </div>
                      <p className="mt-2 text-3xl font-black text-slate-700">{summary.stats.attendanceRate}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-primary-200">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary-50 p-2 text-primary-600">
                          <ShieldCheck size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Hồ sơ lần đầu</p>
                      </div>
                      <p className="mt-3 text-2xl font-black text-slate-800">{summary.stats.baselineCreatedCount}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Sinh viên được lưu mốc IP/tọa độ lần đầu.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-sky-200">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-sky-50 p-2 text-sky-600">
                          <Globe size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Xác minh IP</p>
                      </div>
                      <p className="mt-3 text-2xl font-black text-slate-800">{summary.stats.verifiedIpCount}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Hợp lệ theo địa chỉ IP mạng.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-200">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-indigo-50 p-2 text-indigo-600">
                          <MapPin size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Xác minh vị trí</p>
                      </div>
                      <p className="mt-3 text-2xl font-black text-slate-800">{summary.stats.verifiedLocationCount}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Hợp lệ theo tọa độ GPS hồ sơ.</p>
                    </div>

                    <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm transition-all hover:border-amber-300">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                          <AlertTriangle size={20} />
                        </div>
                        <p className="text-sm font-bold text-amber-800">Khoảng cách</p>
                      </div>
                      <p className="mt-3 text-2xl font-black text-amber-900">{summary.stats.suspiciousCheckIns || 0}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700">Check-in sát biên bán kính (&gt;= 85%).</p>
                    </div>

                    <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm transition-all hover:border-rose-300">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-rose-100 p-2 text-rose-600">
                          <ShieldAlert size={20} />
                        </div>
                        <p className="text-sm font-bold text-rose-800">Rủi ro QR</p>
                      </div>
                      <p className="mt-3 text-2xl font-black text-rose-900">{summary.stats.riskAttempts || 0}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-rose-700">Hệ thống từ chối do dấu hiệu gian lận.</p>
                    </div>
                  </div>

                  {Array.isArray(summary.riskWarnings) && summary.riskWarnings.length > 0 && (
                    <div className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-sm">
                      <div className="border-b border-rose-100 bg-rose-50 px-5 py-4">
                        <h4 className="font-bold text-rose-700">Cảnh báo gian lận gần đây</h4>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {summary.riskWarnings.map((warning) => {
                          const details = warning.details || {};
                          const reason = typeof details.reason === 'string' ? details.reason : 'QR_RISK';
                          const severity = typeof details.severity === 'string' ? details.severity : 'MEDIUM';

                          const reasonMap: Record<string, string> = {
                            OUTSIDE_SESSION_RADIUS: 'Ngoài bán kính phiên',
                            IP_MISMATCH: 'Sai lệch IP hồ sơ',
                            LOCATION_MISMATCH: 'Sai lệch vị trí hồ sơ',
                            STALE_TOKEN: 'Mã QR hết hạn',
                            DEVICE_ID_MISMATCH: 'Sai lệch thiết bị',
                            QR_RISK: 'Rủi ro bảo mật QR',
                          };
                          const severityMap: Record<string, string> = {
                            LOW: 'THẤP',
                            MEDIUM: 'TRUNG BÌNH',
                            HIGH: 'CAO',
                            CRITICAL: 'NGHIÊM TRỌNG',
                          };

                          const reasonDisplay = reasonMap[reason] || reason;
                          const severityDisplay = severityMap[severity] || severity;

                          return (
                            <div key={warning.id} className="group border-b border-rose-100/50 px-5 py-4 transition-all hover:bg-rose-50/30 last:border-b-0">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700">
                                    {warning.actor?.name?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{warning.actor?.name || 'Không xác định'}</p>
                                    <p className="text-[11px] font-medium text-slate-500">MSSV: {warning.actor?.student_code || '---'}</p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 sm:text-right">
                                  <div className="flex flex-col sm:items-end">
                                    <p className="text-[13px] font-bold text-rose-600">{reasonDisplay}</p>
                                    <p className="text-[10px] font-medium text-slate-400">
                                      {new Date(warning.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black tracking-wider text-rose-700">
                                    {severityDisplay}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h4 className="font-bold text-slate-800">Danh sách sinh viên của lớp {summary.session.class_id}</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-500">Sinh viên</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-500">Trạng thái</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-500">Thời gian</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-500">Xác minh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {summary.students.map((student) => (
                            <tr key={student.id} className="align-top">
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-semibold text-slate-800">{student.name}</p>
                                  <p className="text-xs font-mono text-primary-600">{student.student_code}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {student.attendance ? (
                                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                    <CheckCircle2 size={14} />
                                    Đã điểm danh
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                                    <XCircle size={14} />
                                    Chưa điểm danh
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-slate-500">
                                {student.attendance
                                  ? new Date(student.attendance.checkedInAt).toLocaleString('vi-VN')
                                  : '--'}
                              </td>
                              <td className="px-4 py-4">
                                {student.attendance ? (
                                  <div className="space-y-1 text-xs text-slate-600">
                                    <p>{student.attendance.baselineCreated ? 'Lần đầu lưu hồ sơ' : 'Khớp hồ sơ đã lưu'}</p>
                                    <p>IP: {student.attendance.verifiedIp ? 'Hợp lệ' : 'Không hợp lệ'}</p>
                                    <p>Vị trí: {student.attendance.verifiedLocation ? 'Hợp lệ' : 'Không hợp lệ'}</p>
                                    {student.attendance.sessionDistance !== null && student.attendance.sessionDistance !== undefined && (
                                      <p>Lệch tâm phiên: {Math.round(student.attendance.sessionDistance)}m</p>
                                    )}
                                    {student.attendance.profileDistance !== null && student.attendance.profileDistance !== undefined && (
                                      <p>Lệch hồ sơ: {Math.round(student.attendance.profileDistance)}m</p>
                                    )}
                                  </div>
                                ) : student.profile ? (
                                  <div className="space-y-1 text-xs text-slate-500">
                                    <p>Đã có hồ sơ xác minh</p>
                                    <p>Check-in hợp lệ: {student.profile.totalVerifiedCheckIns}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs italic text-slate-400">Chưa có hồ sơ QR</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    
    {/* Fullscreen QR Modal */}
    {isFullscreenQR && selectedSession && (
      <div 
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-2xl p-6 transition-all"
        onClick={() => setIsFullscreenQR(false)}
      >
        <button 
          className="absolute right-8 top-8 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20"
          onClick={() => setIsFullscreenQR(false)}
        >
          <XCircle size={32} />
        </button>
        
        <div className="mb-8 text-center text-white">
          <h2 className="text-4xl font-black tracking-tight uppercase italic">{selectedSession.title}</h2>
          <p className="mt-2 text-xl font-medium text-slate-300">Quét mã để điểm danh • {selectedSession.class_id}</p>
        </div>

        <div className="relative rounded-[3rem] bg-white p-10 shadow-[0_0_80px_rgba(59,130,246,0.3)] ring-12 ring-white/10">
          <QRCodeSVG 
            value={`${window.location.origin}/qr/${selectedSession.qrToken}`} 
            size={Math.min(window.innerWidth - 100, window.innerHeight - 300, 500)} 
            level="H" 
            includeMargin 
          />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-6 py-2 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary-900/50">
            QR Token: {selectedSession.qrToken.slice(0, 8)}...
          </div>
        </div>

        <p className="mt-12 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Sinh viên ngồi cuối lớp có thể dùng Zoom 2x/4x để quét
        </p>
      </div>
    )}
    </>
  );
};

export default QRAttendanceManager;

