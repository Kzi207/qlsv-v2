import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../api/axios';
import {
  QrCode,
  Scan,
  X,
  Loader2,
  Calendar,
  CheckCircle2,
  Award,
  Timer,
  Trash2,
  Upload,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmModal from '../components/common/ConfirmModal';
import { EVALUATION_DATA } from '../constants/evaluationData';

type SemesterOption = {
  id?: number;
  name: string;
};

type SessionInfo = {
  id?: number;
  title?: string;
  category?: string;
};

type ScannedRecord = {
  id: number;
  points: number;
  scannedAt: string;
  session: SessionInfo;
};

type EvidenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;

type EvidenceItem = {
  id: number;
  title: string;
  adminTitle?: string;
  status: EvidenceStatus;
  points?: number;
  imageUrl?: string;
  createdAt: string;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
};


const HeroSection = ({ onUpload, onScan, cooldown }: { onUpload: () => void; onScan: () => void; cooldown: number }) => (
  <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-6 md:p-8 shadow-xl shadow-slate-200/40">
    {/* Background Illustration elements */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-20 -mt-20" />
    <div className="absolute bottom-0 right-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] -mb-20" />
    
    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
      <div className="space-y-4 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
          <QrCode size={14} /> Hệ thống minh chứng
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase leading-[1.1]">
            Minh Chứng <br /> <span className="text-blue-600">Hoạt Động</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-md">
            Quét mã QR hoặc nộp minh chứng thủ công để ghi nhận điểm rèn luyện một cách nhanh chóng và minh bạch.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button 
            onClick={onUpload}
            className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Upload size={18} className="group-hover:scale-110 transition-transform" /> 
            <span>Nộp minh chứng</span>
          </button>
          
          <button 
            onClick={onScan}
            disabled={cooldown > 0}
            className={`group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              cooldown > 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5'
            }`}
          >
            {cooldown > 0 ? <Timer size={18} /> : <Scan size={18} className="group-hover:rotate-12 transition-transform" />}
            <span>{cooldown > 0 ? `Đợi ${cooldown}s` : 'Quét mã QR'}</span>
          </button>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center pr-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-50">
             <div className="relative">
                <div className="h-24 w-24 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <CheckCircle2 size={48} strokeWidth={1.5} />
                </div>
                <div className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-4 border-white">
                  <Award size={20} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatsGrid = ({ records, evidence, totalPoints }: { records: any[], evidence: any[], totalPoints: number }) => {
  const stats = [
    {
      label: 'Hoạt động QR',
      value: records.length,
      icon: <QrCode size={22} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      subText: 'Ghi nhận tự động'
    },
    {
      label: 'Tổng điểm tích lũy',
      value: totalPoints,
      icon: <Award size={22} />,
      color: 'text-white',
      bg: 'bg-gradient-to-br from-blue-600 to-indigo-700',
      border: 'border-blue-400/20',
      subText: 'Điểm rèn luyện',
      isPrimary: true
    },
    {
      label: 'Đã duyệt',
      value: evidence.filter(e => String(e.status).toUpperCase() === 'APPROVED').length,
      icon: <CheckCircle2 size={22} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      subText: 'Minh chứng hợp lệ'
    },
    {
      label: 'Chờ duyệt',
      value: evidence.filter(e => String(e.status).toUpperCase() === 'PENDING').length,
      icon: <Timer size={22} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      subText: 'Đang xử lý'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`relative overflow-hidden rounded-[1.75rem] border p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all duration-500 ${s.bg} ${s.border}`}
        >
          <div className="flex items-center justify-between">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${s.isPrimary ? 'bg-white/20' : 'bg-white shadow-sm border border-slate-100'}`}>
              <span className={s.isPrimary ? 'text-white' : s.color}>{s.icon}</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${s.isPrimary ? 'text-white/60' : 'text-slate-400'}`}>
              {s.subText}
            </span>
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${s.isPrimary ? 'text-white/70' : 'text-slate-400'}`}>
              {s.label}
            </p>
            <p className={`text-3xl font-black ${s.isPrimary ? 'text-white' : 'text-slate-900'}`}>
              {s.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const ActivitySection = ({ title, icon, count, children, onAction, actionText, actionIcon }: any) => (
  <article className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col">
    <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm">
          {icon}
        </div>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">{title}</h2>
      </div>
      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white border border-slate-100 text-slate-400">
        {count}
      </span>
    </div>
    
    <div className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto p-5 space-y-3 custom-scrollbar">
      {children}
    </div>

    {onAction && (
      <div className="p-4 bg-slate-50/50 border-t border-slate-50">
        <button 
          onClick={onAction}
          className="w-full py-3 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {actionIcon} {actionText}
        </button>
      </div>
    )}
  </article>
);

const EmptyState = ({ icon, title, description, onAction, actionText, actionIcon }: any) => (
  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
    <div className="relative">
      <div className="absolute inset-0 bg-blue-50 rounded-full blur-2xl scale-150" />
      <div className="relative h-20 w-20 rounded-[1.75rem] bg-white border border-slate-100 flex items-center justify-center text-slate-200 shadow-xl">
        {icon}
      </div>
    </div>
    <div className="space-y-1.5 relative">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
      <p className="text-[11px] font-bold text-slate-400 max-w-[200px] mx-auto leading-relaxed">{description}</p>
    </div>
    {onAction && (
       <button 
        onClick={onAction}
        className="px-6 py-2.5 rounded-xl border-2 border-blue-100 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
      >
        {actionIcon} {actionText}
      </button>
    )}
  </div>
);

const TrainingEvidence = () => {
  const [scannedRecords, setScannedRecords] = useState<ScannedRecord[]>([]);
  const [semesterId, setSemesterId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [uploadActivityName, setUploadActivityName] = useState('');
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPoints, setUploadPoints] = useState<number>(0);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [myEvidence, setMyEvidence] = useState<EvidenceItem[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: ApiErrorPayload } }).response;
      return response?.data?.error || response?.data?.message || fallback;
    }
    return fallback;
  };

  const normalizeEvidenceStatus = (status: EvidenceStatus) => String(status || 'PENDING').toUpperCase();

  const getEvidenceStatusConfig = (status: EvidenceStatus) => {
    const normalized = normalizeEvidenceStatus(status);
    if (normalized === 'APPROVED') {
      return { label: 'Đã duyệt', chip: 'bg-emerald-50 text-emerald-600 border-emerald-100', point: 'text-emerald-600' };
    }
    if (normalized === 'REJECTED') {
      return { label: 'Đã từ chối', chip: 'bg-rose-50 text-rose-600 border-rose-100', point: 'text-rose-600' };
    }
    return { label: 'Chờ duyệt', chip: 'bg-amber-50 text-amber-700 border-amber-100', point: 'text-amber-700' };
  };

  const getCategoryClass = (category?: string) => {
    if (!category) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (category.includes('Ý thức')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (category.includes('Đoàn Hội')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (category.includes('cộng đồng')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const resetUploadForm = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadActivityName('');
    setSelectedCriteria([]);
    setUploadImage(null);
    setUploadPreview('');
    setUploadPoints(0);
    setOpenSection(null);
  };

  const handleUploadImageChange = (file: File | null) => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    if (!file) {
      setUploadImage(null);
      setUploadPreview('');
      return;
    }
    setUploadImage(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const fetchSemesters = useCallback(async () => {
    try {
      const res = await axios.get('/semesters');
      const options = Array.isArray(res.data) ? (res.data as SemesterOption[]) : [];
      if (options.length > 0 && !semesterId) {
        setSemesterId(options[0].name);
      }
    } catch {
      toast.error('Lỗi tải học kỳ');
    }
  }, [semesterId]);

  const fetchMyRecords = useCallback(async () => {
    try {
      const res = await axios.get('/activities/my-records');
      setScannedRecords(Array.isArray(res.data) ? (res.data as ScannedRecord[]) : []);
    } catch {
      toast.error('Lỗi tải lịch sử hoạt động');
    }
  }, []);

  const fetchMyEvidence = useCallback(async () => {
    try {
      const res = await axios.get('/activities/evidence/my');
      setMyEvidence(Array.isArray(res.data) ? (res.data as EvidenceItem[]) : []);
    } catch (error) {
      console.error('Lỗi tải minh chứng đã gửi', error);
    }
  }, []);


  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedCriteria.length === 0) {
      toast.error('Vui lòng chọn nội dung đánh giá');
      return;
    }
    if (!uploadActivityName.trim() || !uploadImage) {
      toast.error('Vui lòng nhập tên hoạt động và chọn ảnh');
      return;
    }

    setUploading(true);
    let sectionId = '';
    if (selectedCriteria.length > 0) {
      const critId = selectedCriteria[0];
      const section = EVALUATION_DATA.find(s => s.criteria.some(c => c.id === critId));
      if (section) sectionId = section.id;
    }

    const formData = new FormData();
    formData.append('title', uploadActivityName.trim());
    formData.append('image', uploadImage);
    formData.append('semesterId', semesterId);
    formData.append('criterionId', selectedCriteria[0] || '');
    formData.append('sectionId', sectionId);
    formData.append('points', String(uploadPoints));

    try {
      await axios.post('/activities/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Gửi minh chứng thành công');
      setShowUploadModal(false);
      resetUploadForm();
      await fetchMyEvidence();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Lỗi khi tải minh chứng'));
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await axios.delete(`/activities/evidence/${deleteConfirmId}`);
      toast.success('Đã xóa minh chứng');
      await fetchMyEvidence();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Lỗi khi xóa minh chứng'));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try { await scannerRef.current.stop(); } catch (error) { console.error(error); }
    }
    setIsScanning(false);
    setScanLoading(false);
    setScanSuccess(false);
    isProcessing.current = false;
  }, []);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessing.current || scanLoading || scanSuccess || cooldown > 0) return;
    isProcessing.current = true;
    const qrToken = decodedText.trim();
    if (!qrToken || qrToken.length < 5) { isProcessing.current = false; return; }

    try {
      setScanLoading(true);
      await axios.post('/activities/scan', { qrToken });
      setScanLoading(false);
      setScanSuccess(true);
      setCooldown(10);
      toast.success('Điểm danh thành công!');
      window.setTimeout(() => { stopScanner(); fetchMyRecords(); }, 1800);
    } catch (error) {
      setScanLoading(false);
      setCooldown(3);
      toast.error(getErrorMessage(error, 'Lỗi xác thực mã QR'));
      window.setTimeout(() => { isProcessing.current = false; }, 3000);
    }
  }, [cooldown, fetchMyRecords, scanLoading, scanSuccess, stopScanner]);

  const startScanner = async () => {
    if (cooldown > 0) return toast.error(`Đợi ${cooldown}s`);
    setIsScanning(true);
    window.setTimeout(async () => {
      try {
        scannerRef.current = new Html5Qrcode('reader');
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 350 },
          (text) => handleScanSuccess(text),
          () => {}
        );
      } catch { setIsScanning(false); }
    }, 300);
  };

  useEffect(() => { fetchSemesters(); }, [fetchSemesters]);
  useEffect(() => {
    if (!semesterId) return;
    fetchMyRecords();
    fetchMyEvidence();
  }, [semesterId, fetchMyRecords, fetchMyEvidence]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {});
    };
  }, [uploadPreview]);

  const totalPoints = useMemo(() => scannedRecords.reduce((s, r) => s + Number(r.points || 0), 0), [scannedRecords]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 pb-20 pt-4 sm:px-6 lg:px-8 animate-fade-in">
      <style>{`#reader video { object-fit: cover !important; border-radius: 2rem; }`}</style>

      {/* 1. Hero Section */}
      <HeroSection onUpload={() => setShowUploadModal(true)} onScan={startScanner} cooldown={cooldown} />

      {/* 2. Stats Cards */}
      <StatsGrid records={scannedRecords} evidence={myEvidence} totalPoints={totalPoints} />

      {/* 3. Danh sách hoạt động & Minh chứng */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ActivitySection 
          title="Hoạt động đã quét" 
          icon={<Scan size={18} />} 
          count={`${scannedRecords.length} ghi nhận`}
          onAction={startScanner}
          actionText="Quét mã QR ngay"
          actionIcon={<QrCode size={14} />}
        >
          {scannedRecords.length > 0 ? scannedRecords.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group rounded-2xl border border-slate-50 bg-slate-50/30 p-4 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryClass(r.session?.category)}`}>
                  {r.session?.category || 'Hoạt động'}
                </span>
                <span className="text-sm font-black text-blue-600">+{r.points}đ</span>
              </div>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{r.session?.title}</p>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mt-2">
                <Calendar size={10} /> {formatDate(r.scannedAt)}
              </div>
            </motion.div>
          )) : (
            <EmptyState 
              icon={<Scan size={32} />} 
              title="Chưa có hoạt động nào" 
              description="Các hoạt động bạn quét mã QR sẽ xuất hiện tại đây."
              onAction={startScanner}
              actionText="Quét mã QR ngay"
              actionIcon={<QrCode size={14} />}
            />
          )}
        </ActivitySection>

        <ActivitySection 
          title="Minh chứng đã gửi" 
          icon={<Upload size={18} />} 
          count={`${myEvidence.length} minh chứng`}
          onAction={() => setShowUploadModal(true)}
          actionText="Nộp minh chứng ngay"
          actionIcon={<Upload size={14} />}
        >
          {myEvidence.length > 0 ? myEvidence.map(e => {
            const cfg = getEvidenceStatusConfig(e.status);
            const isApproved = normalizeEvidenceStatus(e.status) === 'APPROVED';
            return (
              <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group rounded-2xl border border-slate-50 bg-slate-50/30 p-4 hover:bg-white hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-2 items-center">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg.chip}`}>{cfg.label}</span>
                    {!isApproved && (
                      <button onClick={() => setDeleteConfirmId(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  {isApproved && <span className="text-sm font-black text-emerald-600">+{e.points}đ</span>}
                </div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{isApproved ? e.adminTitle || e.title : e.title}</p>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mt-2">
                  <Calendar size={10} /> {formatDate(e.createdAt)}
                </div>
              </motion.div>
            );
          }) : (
            <EmptyState 
              icon={<Upload size={32} />} 
              title="Chưa có minh chứng nào" 
              description="Các minh chứng bạn nộp sẽ hiển thị tại đây."
              onAction={() => setShowUploadModal(true)}
              actionText="Nộp minh chứng ngay"
              actionIcon={<Upload size={14} />}
            />
          )}
        </ActivitySection>
      </div>

      {/* 4. Bottom Tip Section */}
      <div className="bg-white rounded-[1.5rem] border border-slate-100 p-4 flex items-center gap-4 shadow-sm">
        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Mẹo nhỏ</p>
          <p className="text-xs font-bold text-slate-600">Hãy tích cực tham gia các hoạt động để tích lũy điểm rèn luyện và phát triển bản thân!</p>
        </div>
      </div>

      {/* Scanner & Modals (Preserved existing logic but updated UI) */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={stopScanner} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative z-10 w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm"><Scan size={20} /></div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Quét mã QR</h2>
                </div>
                <button onClick={stopScanner} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><X size={20} /></button>
              </div>
              <div className="relative aspect-square bg-slate-900">
                <div id="reader" className="w-full h-full" />
                {scanLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}
                {scanSuccess && <div className="absolute inset-0 flex items-center justify-center bg-emerald-600 z-20"><CheckCircle2 className="text-white" size={60} /></div>}
              </div>
            </motion.div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUploadModal(false)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative z-10 w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm"><Upload size={20} /></div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Nộp minh chứng</h2>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleUpload} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nội dung đánh giá</label>
                  <div className="space-y-3">
                    {EVALUATION_DATA.map(section => (
                      <div key={section.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/30">
                        <button type="button" onClick={() => setOpenSection(openSection === section.id ? null : section.id)} className={`w-full flex items-center justify-between p-4 transition-all ${openSection === section.id ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}>
                          <span className={`text-[11px] font-black uppercase tracking-wide text-left ${openSection === section.id ? "text-white" : "text-slate-900"}`}>{section.title}</span>
                          <div className={`transition-transform duration-300 ${openSection === section.id ? 'rotate-180' : ''}`}><TrendingUp size={14} className={openSection === section.id ? "text-white/60" : "text-slate-300"} /></div>
                        </button>
                        {openSection === section.id && (
                          <div className="p-3 grid grid-cols-1 gap-2 bg-white border-t border-slate-50">
                            {section.criteria.map(c => (
                              <button key={c.id} type="button" onClick={() => { 
                                setSelectedCriteria(selectedCriteria.includes(c.id) ? [] : [c.id]);
                                if(!selectedCriteria.includes(c.id)) setUploadPoints(c.maxPoints);
                              }} className={`text-left p-3 rounded-xl border text-[11px] font-bold transition-all ${selectedCriteria.includes(c.id) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}>
                                <div className="flex gap-3 items-center">
                                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCriteria.includes(c.id) ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{selectedCriteria.includes(c.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}</div>
                                  <span>{c.content}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="sm:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên hoạt động</label>
                    <input type="text" value={uploadActivityName} onChange={e => setUploadActivityName(e.target.value)} placeholder="Nhập tên hoạt động..." className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white outline-none font-bold text-xs transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Điểm tự khai</label>
                    <input type="number" value={uploadPoints} onChange={e => setUploadPoints(parseInt(e.target.value) || 0)} className="w-full px-5 py-3.5 rounded-xl bg-blue-50 border border-blue-100 font-black text-blue-600 text-xl outline-none focus:border-blue-500 text-center" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ảnh minh chứng</label>
                  <div className="relative aspect-video rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 overflow-hidden group hover:border-blue-400 transition-all duration-300">
                    {uploadPreview ? (
                      <>
                        <img src={uploadPreview} className="w-full h-full object-cover" alt="Preview" />
                        <button type="button" onClick={() => handleUploadImageChange(null)} className="absolute top-3 right-3 p-2 bg-slate-900/60 text-white rounded-full backdrop-blur-md hover:bg-slate-900 transition-all"><X size={16} /></button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer gap-2 group-hover:bg-slate-50 transition-all">
                        <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                          <Upload size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400">Tải ảnh lên (JPG, PNG)</span>
                        <input type="file" accept="image/*" onChange={e => handleUploadImageChange(e.target.files?.[0] || null)} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-4 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Hủy bỏ</button>
                  <button type="submit" disabled={uploading} className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Gửi minh chứng</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Xóa minh chứng"
        message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        type="danger"
      />
    </div>
  );
};

export default TrainingEvidence;
