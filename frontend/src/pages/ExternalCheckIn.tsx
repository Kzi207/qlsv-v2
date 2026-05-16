import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, MapPin, ShieldCheck, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

const ExternalCheckIn = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, authInitialized } = useAuthStore();
  const [statusText, setStatusText] = useState('Đang khởi tạo...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  
  const isProcessingRef = useRef(false);

  // 1. Kiểm tra xác thực
  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated) {
      const currentPath = location.pathname + location.search;
      navigate(`/login?redirectTo=${encodeURIComponent(currentPath)}`, { replace: true });
      return;
    }

    // Nếu đã đăng nhập, bắt đầu quy trình điểm danh
    void startCheckInProcess();
  }, [isAuthenticated, authInitialized, token]);

  const requestLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ định vị GPS.'));
        return;
      }

      setStatusText('Đang xác định vị trí GPS...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          setGpsAccuracy(pos.coords.accuracy);
          resolve(loc);
        },
        (err) => {
          let msg = 'Không thể lấy vị trí GPS.';
          if (err.code === 1) msg = 'Vui lòng cho phép quyền truy cập vị trí (GPS) để điểm danh.';
          else if (err.code === 3) msg = 'Hết thời gian lấy vị trí. Vui lòng thử lại.';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const startCheckInProcess = async () => {
    if (isProcessingRef.current || !token) return;
    isProcessingRef.current = true;
    setError(null);

    try {
      // Lấy vị trí trước
      const loc = await requestLocation();
      
      setStatusText('Đang xác thực điểm danh với máy chủ...');
      
      // Gửi yêu cầu điểm danh
      await api.post('/attendance/qr-check-in', {
        qrToken: token,
        lat: loc.lat,
        lng: loc.lng,
      });

      setSuccess(true);
      setStatusText('Điểm danh thành công!');
      toast.success('Điểm danh thành công!', { duration: 4000 });
      
      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        navigate('/attendance', { replace: true });
      }, 3000);

    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi hệ thống khi điểm danh';
      setError(msg);
      setStatusText(msg);
      toast.error(msg, { duration: 5000 });
    } finally {
      isProcessingRef.current = false;
    }
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className={`p-4 rounded-full ${success ? 'bg-emerald-100 text-emerald-600' : error ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {success ? <CheckCircle2 size={48} /> : error ? <AlertCircle size={48} /> : <Loader2 size={48} className="animate-spin" />}
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {success ? 'ĐIỂM DANH THÀNH CÔNG' : error ? 'LỖI ĐIỂM DANH' : 'ĐANG XỬ LÝ'}
          </h1>
          
          <p className="text-slate-500 font-medium mb-8">
            {statusText}
          </p>

          <AnimatePresence>
            {currentLocation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <MapPin size={18} className="text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Vị trí của bạn (GPS)</span>
                </div>
                <div className="space-y-1 ml-7">
                  <p className="text-xs font-mono text-slate-500">Lat: {currentLocation.lat.toFixed(6)}</p>
                  <p className="text-xs font-mono text-slate-500">Lng: {currentLocation.lng.toFixed(6)}</p>
                  {gpsAccuracy !== null && (
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
                      Độ chính xác: ~{Math.round(gpsAccuracy)}m
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {error && (
              <button
                onClick={() => void startCheckInProcess()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              >
                <RefreshCcw size={20} />
                THỬ LẠI NGAY
              </button>
            )}
            
            <button
              onClick={() => navigate(isAuthenticated ? '/attendance' : '/login')}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all"
            >
              QUAY LẠI TRANG CHỦ
            </button>
          </div>
        </div>

        <div className="bg-slate-900 p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Xác thực bảo mật</p>
              <p className="text-sm font-medium mt-1 text-white/80">
                Hệ thống đang kiểm tra Token, Vị trí GPS và Địa chỉ IP để xác nhận danh tính của bạn.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExternalCheckIn;

