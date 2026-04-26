import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../api/axios';
import {
  QrCode,
  History as HistoryIcon,
  Scan,
  X,
  Loader2,
  Calendar,
  CheckCircle2,
  Award,
  Info,
  Camera,
  RefreshCcw,
  AlertCircle,
  Timer,
  Trash2,
  ListChecks,
  Upload,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmModal from '../components/common/ConfirmModal';

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

const TrainingEvidence = () => {
  const [scannedRecords, setScannedRecords] = useState<ScannedRecord[]>([]);
  const [semesterId, setSemesterId] = useState('');
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploading, setUploading] = useState(false);

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
      return { label: 'Đã duyệt', chip: 'bg-emerald-50 text-emerald-600', point: 'text-emerald-600' };
    }
    if (normalized === 'REJECTED') {
      return { label: 'Đã từ chối', chip: 'bg-rose-50 text-rose-600', point: 'text-rose-600' };
    }
    return { label: 'Chờ duyệt', chip: 'bg-amber-50 text-amber-700', point: 'text-amber-700' };
  };

  const getCategoryClass = (category?: string) => {
    if (!category) return 'bg-slate-100 text-slate-600';
    if (category.includes('Ý thức')) return 'bg-amber-50 text-amber-700';
    if (category.includes('Đoàn Hội')) return 'bg-blue-50 text-blue-700';
    if (category.includes('cộng đồng')) return 'bg-emerald-50 text-emerald-700';
    return 'bg-slate-100 text-slate-600';
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const toImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `${axios.defaults.baseURL || ''}${imageUrl}`;
  };

  const resetUploadForm = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadTitle('');
    setUploadImage(null);
    setUploadPreview('');
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
      setSemesterOptions(options);
      setSemesterId((prev) => prev || options[0]?.name || '');
    } catch {
      toast.error('Lỗi tải học kỳ');
    }
  }, []);

  const fetchMyRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/activities/my-records');
      setScannedRecords(Array.isArray(res.data) ? (res.data as ScannedRecord[]) : []);
    } catch {
      toast.error('Lỗi tải lịch sử hoạt động');
    } finally {
      setLoading(false);
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
    if (!uploadTitle.trim() || !uploadImage) {
      toast.error('Vui lòng nhập tên hoạt động và chọn ảnh');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', uploadTitle.trim());
    formData.append('image', uploadImage);

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

  const handleDeleteEvidence = (id: number) => {
    setDeleteConfirmId(id);
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

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const parseQrToken = (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText) as { type?: string; token?: string };
      if (data.type === 'activity' && data.token) return data.token;
    } catch {
      // fallback raw text
    }
    return decodedText.trim();
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.error('Không thể dừng camera', error);
      }
    }
    setIsScanning(false);
    setScanLoading(false);
    setScanSuccess(false);
    isProcessing.current = false;
  }, []);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      if (isProcessing.current || scanLoading || scanSuccess || cooldown > 0) return;

      isProcessing.current = true;
      const qrToken = parseQrToken(decodedText);

      if (!qrToken || qrToken.length < 10) {
        isProcessing.current = false;
        return;
      }

      try {
        setScanLoading(true);
        await axios.post('/activities/scan', { qrToken });

        setScanLoading(false);
        setScanSuccess(true);
        setCooldown(10);
        toast.success('Điểm danh thành công!');

        window.setTimeout(() => {
          void stopScanner();
          void fetchMyRecords();
        }, 1800);
      } catch (error) {
        setScanLoading(false);
        setCooldown(3);
        toast.error(getErrorMessage(error, 'Lỗi xác thực mã QR'));
        window.setTimeout(() => {
          isProcessing.current = false;
        }, 3000);
      }
    },
    [cooldown, fetchMyRecords, scanLoading, scanSuccess, stopScanner],
  );

  const startScanner = async () => {
    if (cooldown > 0) {
      toast.error(`Vui lòng đợi ${cooldown} giây`);
      return;
    }
    if (isScanning) return;

    setIsScanning(true);
    setHasPermission(null);
    setScanSuccess(false);
    setScanLoading(false);
    isProcessing.current = false;

    window.setTimeout(async () => {
      try {
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (error) {
        console.error('Không thể làm mới camera', error);
      }

      try {
        scannerRef.current = new Html5Qrcode('reader');
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
          (decodedText) => {
            void handleScanSuccess(decodedText);
          },
          () => {},
        );
        setHasPermission(true);
      } catch (error) {
        console.error('Không có quyền camera', error);
        setHasPermission(false);
      }
    }, 300);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSemesters();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSemesters]);

  useEffect(() => {
    if (!semesterId) return;
    const timer = window.setTimeout(() => {
      void fetchMyRecords();
      void fetchMyEvidence();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchMyEvidence, fetchMyRecords, semesterId]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch((error) => {
          console.error('Không thể dừng scanner khi unmount', error);
        });
      }
    };
  }, [uploadPreview]);

  const totalPoints = useMemo(
    () => scannedRecords.reduce((sum, record) => sum + Number(record.points || 0), 0),
    [scannedRecords],
  );
  const approvedEvidenceCount = useMemo(
    () => myEvidence.filter((item) => normalizeEvidenceStatus(item.status) === 'APPROVED').length,
    [myEvidence],
  );
  const pendingEvidenceCount = useMemo(
    () => myEvidence.filter((item) => normalizeEvidenceStatus(item.status) === 'PENDING').length,
    [myEvidence],
  );

  return (
    <>
      <div className="mx-auto max-w-[1480px] space-y-6 px-3 pb-20 pt-2 sm:px-4 lg:px-6 animate-fade-up">
        <style>{`
          #reader video { object-fit: cover !important; border-radius: 1.5rem; }
          @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
          .animate-scan-line { animation: scan-line 2s linear infinite; }
        `}</style>

        <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                <QrCode size={12} /> Hệ thống minh chứng
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Minh Chứng Hoạt Động
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Quét QR để ghi nhận hoạt động và gửi minh chứng thủ công khi cần xét duyệt.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-[210px_auto_auto]">
              <label className="relative">
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-10 text-sm font-black text-slate-800 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                >
                  {semesterOptions.map((semester) => (
                    <option key={semester.name} value={semester.name}>
                      {semester.name}
                    </option>
                  ))}
                </select>
                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </label>

              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-[0.99]"
              >
                <Upload size={18} /> Nộp minh chứng
              </button>

              <button
                onClick={startScanner}
                disabled={cooldown > 0}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-all ${
                  cooldown > 0
                    ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.99]'
                }`}
              >
                {cooldown > 0 ? (
                  <>
                    <Timer size={18} className="animate-pulse" /> Đợi {cooldown}s
                  </>
                ) : (
                  <>
                    <Scan size={18} /> Quét mã QR
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hoạt động QR</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{scannedRecords.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <HistoryIcon size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-blue-600 p-4 text-white shadow-lg shadow-blue-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Tổng điểm tích lũy</p>
                <p className="mt-1 text-2xl font-black">{totalPoints}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
                <Award size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Minh chứng đã duyệt</p>
                <p className="mt-1 text-2xl font-black text-emerald-600">{approvedEvidenceCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang chờ duyệt</p>
                <p className="mt-1 text-2xl font-black text-amber-600">{pendingEvidenceCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <ListChecks size={22} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Hoạt động đã quét
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                {scannedRecords.length} bản ghi
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2 className="animate-spin text-blue-600" size={34} />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang tải dữ liệu...</p>
              </div>
            ) : scannedRecords.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
                  <QrCode size={30} />
                </div>
                <p className="mt-4 text-base font-black text-slate-900">Chưa có hoạt động nào</p>
                <p className="mt-1 text-sm font-medium text-slate-400">Bạn có thể dùng nút quét QR để bắt đầu ghi nhận.</p>
              </div>
            ) : (
              <div className="max-h-[620px] space-y-3 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
                {scannedRecords.map((record) => (
                  <motion.div
                    key={`record-${record.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getCategoryClass(record.session?.category)}`}>
                        {record.session?.category || 'Hoạt động'}
                      </span>
                      <span className="text-lg font-black text-blue-600">+{record.points || 0}đ</span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm font-black text-slate-900">
                      {record.session?.title || 'Hoạt động chưa có tên'}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <Calendar size={12} />
                      {formatDate(record.scannedAt)}
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200 pt-3 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                      <CheckCircle2 size={12} />
                      Đã xác thực hệ thống
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Minh chứng đã gửi
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                {myEvidence.length} minh chứng
              </span>
            </div>

            <div className="max-h-[620px] space-y-3 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
              {myEvidence.length === 0 ? (
                <div className="px-3 py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
                    <Camera size={30} />
                  </div>
                  <p className="mt-4 text-base font-black text-slate-900">Chưa có minh chứng thủ công</p>
                  <p className="mt-1 text-sm font-medium text-slate-400">Nhấn “Nộp minh chứng” để gửi ảnh xác nhận hoạt động.</p>
                </div>
              ) : (
                myEvidence.map((evidence) => {
                  const statusConfig = getEvidenceStatusConfig(evidence.status);
                  const status = normalizeEvidenceStatus(evidence.status);
                  const imageUrl = toImageUrl(evidence.imageUrl);

                  return (
                    <motion.div
                      key={`evidence-${evidence.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusConfig.chip}`}>
                            {statusConfig.label}
                          </span>
                          {status !== 'APPROVED' && (
                            <button
                              onClick={() => handleDeleteEvidence(evidence.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                              title="Xóa minh chứng"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {status === 'APPROVED' && (
                          <span className={`text-lg font-black ${statusConfig.point}`}>+{evidence.points || 0}đ</span>
                        )}
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm font-black text-slate-900">
                        {status === 'APPROVED' ? evidence.adminTitle || evidence.title : evidence.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Calendar size={12} />
                        {formatDate(evidence.createdAt)}
                      </div>

                      {imageUrl && (
                        <div className="mt-3 h-28 overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <img src={imageUrl} alt="Minh chứng" className="h-full w-full object-cover" />
                        </div>
                      )}

                      {status === 'APPROVED' && (
                        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200 pt-3 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                          <CheckCircle2 size={12} />
                          Minh chứng hợp lệ
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </article>
        </section>
      </div>

      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                void stopScanner();
              }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[92vh] sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Quét minh chứng</h2>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Đưa camera vào mã QR hoạt động
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    void stopScanner();
                  }}
                  className="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative aspect-square bg-black sm:aspect-video">
                <div id="reader" className="h-full w-full" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-64 w-64 rounded-[2rem] border-2 border-blue-500/35">
                    <div className="absolute -left-1 -top-1 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-blue-600" />
                    <div className="absolute -right-1 -top-1 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-blue-600" />
                    <div className="absolute -bottom-1 -left-1 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-blue-600" />
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-blue-600" />
                    <div className="animate-scan-line absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.9)]" />
                  </div>
                </div>

                <AnimatePresence>
                  {hasPermission === false && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/95 p-8 text-center text-white"
                    >
                      <AlertCircle className="mb-5 text-rose-500" size={52} />
                      <h3 className="text-2xl font-black">Không truy cập được camera</h3>
                      <p className="mt-2 max-w-sm text-sm text-slate-300">
                        Vui lòng cấp quyền camera trong trình duyệt để quét mã QR.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3 text-xs font-black uppercase tracking-wider text-slate-900 shadow-lg shadow-white/10"
                      >
                        <RefreshCcw size={16} /> Thử lại
                      </button>
                    </motion.div>
                  )}

                  {scanLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 p-8 text-center"
                    >
                      <div className="relative">
                        <Loader2 className="animate-spin text-blue-600" size={60} />
                        <QrCode className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={22} />
                      </div>
                      <h3 className="mt-6 text-2xl font-black text-slate-900">Đang xác thực...</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Giữ điện thoại ổn định trong giây lát
                      </p>
                    </motion.div>
                  )}

                  {scanSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-emerald-500 p-8 text-center text-white"
                    >
                      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
                        <CheckCircle2 size={56} />
                      </div>
                      <h3 className="text-3xl font-black tracking-tight">THÀNH CÔNG!</h3>
                      <p className="mt-1 font-bold text-emerald-50">Hoạt động đã được ghi nhận.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-slate-50 p-4 sm:p-5">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">Mẹo quét mã</p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                      Đưa mã QR vào giữa khung. Nếu camera khó lấy nét, lùi máy ra xa hơn một chút rồi thử lại.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowUploadModal(false);
                resetUploadForm();
              }}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Nộp minh chứng hoạt động
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-5 p-5 sm:p-6">
                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tên hoạt động
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="VD: Tham gia hiến máu tình nguyện"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ảnh minh chứng
                  </label>
                  <div className="relative h-52 w-full overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-emerald-500">
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="Preview minh chứng" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                        <Camera size={34} className="text-slate-300" />
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Nhấn để chọn ảnh minh chứng
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleUploadImageChange(e.target.files?.[0] || null)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {uploading ? 'Đang tải lên...' : 'Gửi minh chứng'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Xóa minh chứng"
        message="Bạn có chắc chắn muốn xóa minh chứng này không? Hành động này không thể hoàn tác."
        confirmText="Xác nhận xóa"
        cancelText="Đóng"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};

export default TrainingEvidence;
