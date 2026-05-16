import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  QrCode,
  ShieldCheck,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Flashlight,
  FlashlightOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

const extractQrToken = (rawValue: string): string => {
  const value = String(rawValue || '').trim();
  if (!value) return '';

  const hex64Pattern = /^[a-fA-F0-9]{64}$/;
  if (hex64Pattern.test(value)) return value;

  try {
    const parsed = new URL(value);
    const fromQuery = parsed.searchParams.get('qrToken') || parsed.searchParams.get('token') || '';
    if (hex64Pattern.test(fromQuery)) return fromQuery;

    const segments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';
    if (hex64Pattern.test(lastSegment)) return lastSegment;
  } catch {
    // not a URL
  }

  return value;
};

const QRScannerCheckIn = () => {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [statusText, setStatusText] = useState('San sang quet ma QR');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number; step: number } | null>(null);
  const [digitalZoom, setDigitalZoom] = useState(1);
  const [focusHint, setFocusHint] = useState<{ x: number; y: number; visible: boolean }>({
    x: 50,
    y: 50,
    visible: false,
  });
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const successRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isRequestingLocationRef = useRef(false);
  const startScannerRef = useRef<() => Promise<void>>(async () => {});
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const pinchThrottleRef = useRef(0);
  const focusHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    successRef.current = success;
  }, [success]);

  useEffect(() => {
    return () => {
      if (focusHintTimerRef.current) {
        clearTimeout(focusHintTimerRef.current);
      }
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (isRequestingLocationRef.current) return;

    if (!('geolocation' in navigator)) {
      toast.error('Trinh duyet khong ho tro dinh vi');
      return;
    }

    isRequestingLocationRef.current = true;
    toast.loading('Dang lay vi tri GPS...', { id: 'gps-loading' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss('gps-loading');

        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(nextLocation);
        locationRef.current = nextLocation;

        const accuracy = Math.round(position.coords.accuracy);
        setGpsAccuracy(accuracy);
        if (accuracy > 100) {
          toast.error(`GPS chua chinh xac (${accuracy}m). Hay ra cho thoang hon.`, { duration: 5000 });
          setStatusText('GPS yeu, hay doi vi tri thong thoang hon roi quet lai');
        } else {
          toast.success('Vi tri da san sang', { id: 'gps-success' });
          setStatusText('Vi tri GPS da san sang');
        }

        isRequestingLocationRef.current = false;
      },
      () => {
        toast.dismiss('gps-loading');
        toast.error('Loi dinh vi. Vui long bat GPS va cho phep truy cap.');
        setStatusText('Chua lay duoc vi tri GPS');
        isRequestingLocationRef.current = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const ensureCheckInPrerequisites = useCallback(async () => {
    // Force refresh csrf token/session from backend before first write request
    await api.get('/auth/me');

    if (String(user?.role || '').toUpperCase() !== 'STUDENT') {
      throw new Error('Chi tai khoan sinh vien moi co the diem danh');
    }

    if (!user?.studentId) {
      throw new Error('Tai khoan chua lien ket sinh vien (thieu studentId)');
    }
  }, [user?.role, user?.studentId]);

  const handleCheckIn = useCallback(
    async (rawValue: string) => {
      if (isProcessingRef.current || successRef.current) return;

      const qrToken = extractQrToken(rawValue);
      if (!qrToken) return;

      const currentLocation = locationRef.current;
      if (!currentLocation) {
        toast.error('Dang cho GPS, vui long thu lai sau vai giay', { id: 'gps-wait' });
        setStatusText('Dang cho GPS truoc khi diem danh');
        requestLocation();
        return;
      }

      isProcessingRef.current = true;
      setLoading(true);
      setStatusText('Dang xu ly diem danh...');

      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          console.error('Failed to stop scanner', e);
        }
      }

      try {
        await ensureCheckInPrerequisites();
        await api.post('/attendance/qr-check-in', {
          qrToken,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        });

        setSuccess(true);
        setLoading(false);
        setStatusText('Diem danh thanh cong');
        toast.success('Diem danh thanh cong!', { duration: 4000 });
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'Loi diem danh';

        toast.error(msg, { duration: 5000 });
        setStatusText(msg);

        isProcessingRef.current = false;
        setLoading(false);

        await startScannerRef.current();
      }
    },
    [ensureCheckInPrerequisites, requestLocation],
  );

  const handleCheckInRef = useRef(handleCheckIn);
  useEffect(() => {
    handleCheckInRef.current = handleCheckIn;
  }, [handleCheckIn]);

  const applyDigitalZoom = (value: number) => {
    const reader = document.getElementById('reader');
    if (!reader) return;
    const video = reader.querySelector('video');
    if (!video) return;
    (video as HTMLVideoElement).style.transform = `scale(${value})`;
    (video as HTMLVideoElement).style.transformOrigin = 'center center';
    setDigitalZoom(value);
  };

  const clampZoom = useCallback(
    (value: number) => {
      const minZoom = zoomCaps?.min ?? 1;
      const maxZoom = zoomCaps?.max ?? 4;
      return Math.max(minZoom, Math.min(value, maxZoom));
    },
    [zoomCaps],
  );

  const handleZoomChange = async (value: number) => {
    const nextZoom = clampZoom(value);
    if (zoomCaps && scannerRef.current && scannerRef.current.isScanning) {
      try {
        await (scannerRef.current as any).applyVideoConstraints({
          advanced: [{ zoom: nextZoom }],
        });
        setZoomLevel(nextZoom);
        if (digitalZoom !== 1) {
          applyDigitalZoom(1);
        }
        return;
      } catch (err) {
        console.error('Failed to apply optical zoom, fallback to digital zoom:', err);
      }
    }

    // Fallback zoom for browsers/devices that don't expose track zoom capability.
    setZoomLevel(nextZoom);
    applyDigitalZoom(nextZoom);
  };

  const handleTorchToggle = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      const nextState = !isTorchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  };

  const tryRefocusCamera = useCallback(async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      const caps = (scannerRef.current as any).getRunningTrackCapabilities?.();
      const focusModes = Array.isArray(caps?.focusMode) ? caps.focusMode : [];
      const advanced: Record<string, unknown>[] = [];

      if (focusModes.includes('continuous')) {
        advanced.push({ focusMode: 'continuous' });
      } else if (focusModes.includes('single-shot')) {
        advanced.push({ focusMode: 'single-shot' });
      }

      if (
        caps?.focusDistance &&
        typeof caps.focusDistance.min === 'number' &&
        typeof caps.focusDistance.max === 'number'
      ) {
        const focusMid = (caps.focusDistance.min + caps.focusDistance.max) / 2;
        advanced.push({ focusDistance: focusMid });
      }

      if (advanced.length > 0) {
        await (scannerRef.current as any).applyVideoConstraints({ advanced });
      }
    } catch (err) {
      console.warn('Focus adjustment is not supported on this device:', err);
    }
  }, []);

  const showFocusHint = (x: number, y: number) => {
    setFocusHint({ x, y, visible: true });
    if (focusHintTimerRef.current) {
      clearTimeout(focusHintTimerRef.current);
    }
    focusHintTimerRef.current = setTimeout(() => {
      setFocusHint((prev) => ({ ...prev, visible: false }));
    }, 650);
  };

  const getTouchDistance = (touches: ReactTouchEvent<HTMLDivElement>['touches']) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleReaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' && pinchStateRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    showFocusHint(x, y);
    setStatusText('Dang lay net camera...');
    void tryRefocusCamera();
  };

  const handleReaderTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return;
    const currentZoom = zoomCaps ? zoomLevel : digitalZoom;
    pinchStateRef.current = {
      distance: getTouchDistance(event.touches),
      zoom: currentZoom,
    };
  };

  const handleReaderTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && pinchStateRef.current) {
      event.preventDefault(); // Only block scrolling when zooming with 2 fingers
      
      const now = Date.now();
      if (now - pinchThrottleRef.current < 40) return;
      pinchThrottleRef.current = now;

      const distance = getTouchDistance(event.touches);
      if (!Number.isFinite(distance) || pinchStateRef.current.distance <= 0) return;

      const scale = distance / pinchStateRef.current.distance;
      const targetZoom = clampZoom(pinchStateRef.current.zoom * scale);
      void handleZoomChange(targetZoom);
    }
  };

  const handleReaderTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchStateRef.current = null;
    }
  };

  const getRearCameraId = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!Array.isArray(devices) || devices.length === 0) {
        return null;
      }
      setCameras(devices);

      const rearKeywords = ['back', 'rear', 'environment', 'sau', 'back camera'];
      const frontKeywords = ['front', 'user', 'facetime', 'truoc', 'selfie'];

      const scored = devices.map((camera, index) => {
        const label = String(camera.label || '').toLowerCase();
        const hasRear = rearKeywords.some((kw) => label.includes(kw));
        const hasFront = frontKeywords.some((kw) => label.includes(kw));
        return {
          id: camera.id,
          index,
          score: (hasRear ? 2 : 0) + (hasFront ? -2 : 0),
        };
      });

      const sorted = scored.sort((a, b) => b.score - a.score);
      const best = sorted[0];
      
      if (best) {
        setCurrentCameraIndex(best.index);
        return best.id;
      }
      return null;
    } catch (err) {
      console.error('Error getting cameras:', err);
      return null;
    }
  };

  const cycleCamera = async () => {
    if (cameras.length <= 1) return;
    try {
      setStatusText('Dang doi camera...');
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
      
      await startScanner(cameras[nextIndex].id);
      setStatusText(`Da chuyen sang ${cameras[nextIndex].label || 'camera moi'}`);
    } catch (err) {
      console.error('Failed to cycle camera:', err);
      setStatusText('Loi khi doi camera');
    }
  };

  const startScanner = useCallback(async (preferredCameraId?: string) => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader', {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
        });
      }

      if (scannerRef.current.isScanning) return;

      const config = {
        fps: 18,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.82);
          return { width: edge, height: edge };
        },
        aspectRatio: 1,
        disableFlip: false,
        videoConstraints: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment',
        },
      };

      const onDecode = (decodedText: string) => {
        void handleCheckInRef.current(decodedText);
      };
      
      const onDecodeError = () => {};

      try {
        if (preferredCameraId) {
          await scannerRef.current.start(preferredCameraId, config, onDecode, onDecodeError);
        } else {
          // Attempt 1: Standard environment camera
          try {
            await scannerRef.current.start({ facingMode: 'environment' }, config, onDecode, onDecodeError);
          } catch (e) {
            // Attempt 2: Enumerated rear camera
            const rearId = await getRearCameraId();
            if (rearId) {
              await scannerRef.current.start(rearId, config, onDecode, onDecodeError);
            } else {
              // Attempt 3: Any available camera
              await scannerRef.current.start({ facingMode: 'user' }, config, onDecode, onDecodeError);
            }
          }
        }
      } catch (err) {
        console.error('All camera start attempts failed:', err);
        throw err;
      }

      // Read camera capabilities for optical zoom / torch / focus support.
      try {
        const capabilities = (scannerRef.current as any).getRunningTrackCapabilities?.();
        if (capabilities?.zoom) {
          setZoomCaps({
            min: capabilities.zoom.min || 1,
            max: capabilities.zoom.max || 1,
            step: capabilities.zoom.step || 0.1,
          });
          setZoomLevel(capabilities.zoom.min || 1);
        } else {
          setZoomCaps(null);
        }
        if (capabilities?.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        console.warn('Camera capability lookup failed:', e);
        setZoomCaps(null);
        setHasTorch(false);
      }

      applyDigitalZoom(1);
      void tryRefocusCamera();
      setHasPermission(true);
    } catch (err: any) {
      console.error('Scanner Error:', err);
      setHasPermission(false);
      
      const errorStr = String(err).toLowerCase();
      if (errorStr.includes('notallowederror') || errorStr.includes('permission denied')) {
        setStatusText('Ban da tu choi quyen truy cap Camera. Hay vao cai dat trinh duyet de cho phep.');
      } else if (errorStr.includes('notfounderror')) {
        setStatusText('Khong tim thay Camera tren thiet bi nay.');
      } else {
        setStatusText('Khong the mo camera: ' + (err.message || 'Loi khong xac dinh'));
      }
    }
  }, [tryRefocusCamera]);

  useEffect(() => {
    startScannerRef.current = startScanner;
  }, [startScanner]);

  useEffect(() => {
    const init = async () => {
      await startScanner();
      requestLocation();
    };
    void init();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.error('Stop fail', e));
      }
    };
  }, [startScanner, requestLocation]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-24 pt-6 sm:px-6 sm:pb-8 sm:pt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl uppercase italic">
            Quét điểm danh
          </h1>
          <p className="text-sm font-medium text-slate-500">Hướng camera về phía mã QR và đảm bảo GPS đã bật</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-100">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Hệ thống trực tuyến</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 sm:p-6">
            <div className="relative group">
              <div
                id="reader"
                onPointerDown={handleReaderPointerDown}
                onTouchStart={handleReaderTouchStart}
                onTouchMove={handleReaderTouchMove}
                onTouchEnd={handleReaderTouchEnd}
                className="w-full overflow-hidden rounded-[2rem] bg-slate-950 ring-8 ring-slate-50 transition-all group-hover:ring-slate-100"
                style={{ minHeight: '350px', touchAction: 'pan-y' }}
              ></div>

              {/* Scan Overlay UI */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                {/* Corner Accents */}
                <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl opacity-60" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl opacity-60" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl opacity-60" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-2xl opacity-60" />
                
                {/* Scanning Laser Line */}
                {!success && !loading && hasPermission && (
                  <motion.div 
                    animate={{ top: ['20%', '80%', '20%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                  />
                )}
              </div>

              {focusHint.visible && (
                <div
                  className="pointer-events-none absolute z-30 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60 shadow-[0_0_0_100vmax_rgba(0,0,0,0.1)] transition-all"
                  style={{ left: `${focusHint.x}%`, top: `${focusHint.y}%` }}
                >
                  <div className="absolute inset-0 animate-ping rounded-full border border-white/40" />
                </div>
              )}
              
              {!hasPermission && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/90 z-50 rounded-2xl">
                  <ShieldCheck size={48} className="text-red-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Chưa cấp quyền Camera</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-[240px]">
                    Ứng dụng cần cấp quyền camera và vị trí để thực hiện điểm danh.
                  </p>
                  <div className="flex flex-col gap-3 w-full max-w-[200px]">
                    <button
                      onClick={() => {
                        void startScanner();
                        requestLocation();
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                    >
                      <RefreshCcw size={18} />
                      Thu lai ngay
                    </button>
                    <p className="text-[10px] text-slate-500 italic">
                      Neu van loi, hay nhan vao bieu tuong o khoa tren thanh dia chi de cap quyen.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute right-6 top-6 z-40 rounded-full border border-white/15 bg-black/45 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/85 backdrop-blur-md">
              Chạm để lấy nét
            </div>
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={cycleCamera}
                className="absolute left-6 top-6 z-40 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md hover:bg-black/70 flex items-center gap-2 transition-all active:scale-95"
              >
                <RefreshCcw size={12} /> Đổi Camera
              </button>
            )}

            {/* Zoom Controls */}
            {zoomCaps && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[340px] space-y-4">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-5 py-3 rounded-[1.5rem] border border-white/10 shadow-2xl">
                  <ZoomOut size={18} className="text-white/40" />
                  <input 
                    type="range"
                    min={zoomCaps.min}
                    max={zoomCaps.max}
                    step={zoomCaps.step}
                    value={zoomLevel}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <ZoomIn size={18} className="text-white/40" />
                </div>
                
                <div className="flex justify-center gap-2">
                  {[1, 2, 4].map((zoom) => (
                    <button
                      key={zoom}
                      onClick={() => handleZoomChange(Math.min(zoom, zoomCaps.max))}
                      className={`h-11 w-11 rounded-2xl text-xs font-black transition-all flex items-center justify-center ${
                        Math.abs(zoomLevel - zoom) < 0.1 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-black/40 text-white/60 backdrop-blur-md hover:bg-black/60 border border-white/5'
                      }`}
                    >
                      {zoom}X
                    </button>
                  ))}
                  <button
                    onClick={() => handleZoomChange(zoomCaps.max)}
                    className="px-4 h-11 rounded-2xl text-[10px] font-black bg-black/40 text-white/60 backdrop-blur-md hover:bg-black/60 border border-white/5"
                  >
                    MAX
                  </button>
                  {hasTorch && (
                    <button
                      onClick={handleTorchToggle}
                      className={`h-11 w-11 rounded-2xl backdrop-blur-md transition-all flex items-center justify-center ${
                        isTorchOn ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 'bg-black/40 text-white/60 border border-white/5'
                      }`}
                    >
                      {isTorchOn ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
                    </button>
                  )}
                </div>
              </div>
            )}
            {!zoomCaps && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[340px] space-y-3">
                <div className="flex justify-center gap-2">
                  {[1, 1.5, 2, 3].map((zoom) => (
                    <button
                      key={zoom}
                      onClick={() => handleZoomChange(zoom)}
                      className={`h-11 w-11 rounded-2xl text-xs font-black transition-all flex items-center justify-center ${
                        Math.abs(digitalZoom - zoom) < 0.1
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-black/40 text-white/60 backdrop-blur-md hover:bg-black/60 border border-white/5'
                      }`}
                    >
                      {zoom}X
                    </button>
                  ))}
                  {hasTorch && (
                    <button
                      onClick={handleTorchToggle}
                      className={`h-11 w-11 rounded-2xl backdrop-blur-md transition-all flex items-center justify-center ${
                        isTorchOn ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 'bg-black/40 text-white/60 border border-white/5'
                      }`}
                    >
                      {isTorchOn ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
                    </button>
                  )}
                </div>
              </div>
            )}

            <AnimatePresence>
              {hasPermission === false && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center text-white"
                >
                  <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                  <h4 className="text-lg font-bold">Khong the truy cap camera</h4>
                  <p className="mt-2 text-sm text-slate-300">Kiem tra quyen camera trong trinh duyet va thu lai.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold"
                  >
                    <RefreshCcw size={16} /> Thu lai
                  </button>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 p-6 text-center"
                >
                  <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary-600" />
                  <h4 className="text-xl font-bold text-slate-800">Dang xu ly...</h4>
                  <p className="mt-2 text-sm text-slate-500">Vui long cho trong giay lat</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-600 p-8 text-center text-white"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    className="mb-8 rounded-full bg-white/20 p-6 shadow-2xl backdrop-blur-md"
                  >
                    <CheckCircle2 size={80} className="text-white" />
                  </motion.div>
                  <h4 className="text-3xl font-black tracking-tighter uppercase mb-2">ĐIỂM DANH THÀNH CÔNG</h4>
                  <p className="text-emerald-50 font-medium opacity-90 max-w-[280px]">
                    Hệ thống đã ghi nhận sự hiện diện của bạn vào lúc {new Date().toLocaleTimeString('vi-VN')}.
                  </p>
                  
                  <button
                    onClick={() => {
                      window.location.href = '/attendance';
                    }}
                    className="mt-10 rounded-2xl bg-white px-8 py-4 text-sm font-black text-emerald-700 shadow-xl shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                  >
                    Xem lịch sử điểm danh
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Status Indicators */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <h4 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-400">
              <ShieldCheck size={16} className="text-blue-600" /> Trạng thái hệ thống
            </h4>

            <div className="space-y-4">
              {/* GPS Status */}
              <div className={`group relative rounded-3xl border-2 p-5 transition-all ${location ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${location ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase">Định vị GPS</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {location ? 'Đã kích hoạt' : 'Chưa xác định'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                  >
                    <RefreshCcw size={18} className={isRequestingLocationRef.current ? 'animate-spin' : ''} />
                  </button>
                </div>
                {gpsAccuracy !== null && (
                  <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Độ chính xác</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">~{Math.round(gpsAccuracy)}m</span>
                  </div>
                )}
              </div>

              {/* IP/Device Status */}
              <div className="rounded-3xl border-2 border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase">Bảo mật thiết bị</p>
                    <p className="text-xs font-medium text-blue-600 mt-0.5">Xác thực IP & ID đang bật</p>
                  </div>
                </div>
              </div>

              {/* System Messages */}
              <div className="rounded-3xl border-2 border-slate-100 bg-slate-50/50 p-5">
                <div className="flex items-center gap-3 mb-2 text-slate-400">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Thông báo từ máy chủ</span>
                </div>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{statusText}"</p>
              </div>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white shadow-2xl overflow-hidden relative group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
            
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                  <QrCode size={20} className="text-blue-400" />
                </div>
                <h5 className="font-black tracking-tight text-lg italic">Hướng dẫn nhanh</h5>
              </div>
              
              <div className="space-y-3 ml-2">
                {[
                  { step: 1, text: "Bật định vị GPS & Cho phép Camera" },
                  { step: 2, text: "Hướng Camera vào mã QR từ xa" },
                  { step: 3, text: "Dùng Zoom 2x/4x nếu ngồi cuối lớp" }
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black border border-white/10">
                      {item.step}
                    </div>
                    <span className="text-sm font-medium text-white/70">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerCheckIn;


