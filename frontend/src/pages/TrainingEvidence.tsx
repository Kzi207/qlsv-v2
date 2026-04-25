import { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { 
  QrCode, 
  History, 
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
  Timer
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TrainingEvidence = () => {
  const [scannedRecords, setScannedRecords] = useState<any[]>([]);
  const [semesterId, setSemesterId] = useState('');
  const [semesterOptions, setSemesterOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', image: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [myEvidence, setMyEvidence] = useState<any[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (semesterId) {
      fetchMyRecords();
      fetchMyEvidence();
    }
  }, [semesterId]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const fetchSemesters = async () => {
    try {
      const res = await axios.get('/semesters');
      setSemesterOptions(res.data);
      if (res.data.length > 0) setSemesterId(res.data[0].name);
    } catch (error) {
      toast.error('Lỗi tải học kỳ');
    }
  };

  const fetchMyRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/activities/my-records');
      setScannedRecords(res.data);
    } catch (error) {
      toast.error('Lỗi tải minh chứng');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvidence = async () => {
    try {
      const res = await axios.get('/activities/evidence/my');
      setMyEvidence(res.data);
    } catch (error) {
      console.error('Lỗi tải yêu cầu minh chứng');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.title || !uploadData.image) return toast.error('Vui lòng nhập tên hoạt động và chọn ảnh');
    
    setUploading(true);
    const formData = new FormData();
    formData.append('title', uploadData.title);
    formData.append('image', uploadData.image);

    try {
      await axios.post('/activities/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Gửi minh chứng thành công');
      setShowUploadModal(false);
      setUploadData({ title: '', image: null });
      fetchMyEvidence();
    } catch (error) {
      toast.error('Lỗi khi tải lên');
    } finally {
      setUploading(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Strict block using Ref and state
    if (isProcessing.current || scanLoading || scanSuccess || cooldown > 0) return;
    
    isProcessing.current = true;
    
    let qrToken = '';
    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'activity' && data.token) {
        qrToken = data.token;
      }
    } catch (e) {
      qrToken = decodedText.trim();
    }

    if (!qrToken || qrToken.length < 10) {
      isProcessing.current = false;
      return; // Ignore invalid QR without toast to avoid spam
    }

    try {
      setScanLoading(true);
      await axios.post('/activities/scan', { qrToken });
      
      setScanSuccess(true);
      setScanLoading(false);
      setCooldown(10);
      toast.success('Điểm danh thành công!');
      
      setTimeout(() => {
        stopScanner();
        setScanSuccess(false);
        isProcessing.current = false;
        fetchMyRecords();
      }, 2000);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Lỗi xác thực mã QR';
      toast.error(errMsg);
      setScanLoading(false);
      
      // Add a small 3s cooldown on error to prevent immediate re-scan spam
      setCooldown(3); 
      
      setTimeout(() => {
         isProcessing.current = false;
      }, 3000);
    }
  };

  const startScanner = async () => {
    if (cooldown > 0) {
       toast.error(`Vui lòng đợi ${cooldown} giây`);
       return;
    }
    setIsScanning(true);
    setScanSuccess(false);
    setScanLoading(false);
    isProcessing.current = false;
    
    setTimeout(async () => {
      try {
        if (scannerRef.current) {
           await scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current = new Html5Qrcode("reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          handleScanSuccess,
          () => {}
        );
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    }, 500);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
    }
    setIsScanning(false);
    isProcessing.current = false;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-up">
        <style>{`
          #reader video { object-fit: cover !important; border-radius: 2rem; }
          @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
          .animate-scan-line { animation: scan-line 2s linear infinite; }
        `}</style>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
              <QrCode size={12} /> Hệ thống minh chứng
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Lịch sử Hoạt động</h1>
            <p className="text-slate-400 font-bold text-sm">Quét mã QR để tích lũy điểm rèn luyện</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group flex-1 md:flex-none">
                <select value={semesterId} onChange={e => setSemesterId(e.target.value)} className="w-full pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-xs outline-none focus:border-blue-600 appearance-none shadow-sm min-w-[150px]">
                   {semesterOptions.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             </div>
             <button onClick={() => setShowUploadModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all">
               <Camera size={20} /> Nộp minh chứng
             </button>
             <button onClick={startScanner} disabled={cooldown > 0} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${cooldown > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95'}`}>
               {cooldown > 0 ? <><Timer size={20} className="animate-pulse" /> Đợi {cooldown}s</> : <><Scan size={20} /> Quét mã</>}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center justify-between">
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng hoạt động</p><h4 className="text-3xl font-black text-slate-900">{scannedRecords.length}</h4></div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><History size={24} /></div>
             </div>
             <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 flex items-center justify-between">
                <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Tổng điểm tích lũy</p><h4 className="text-3xl font-black">{scannedRecords.reduce((a, b) => a + b.points, 0)}</h4></div>
                <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center"><Award size={24} /></div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center justify-between">
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái điểm</p><h4 className="text-xl font-black text-emerald-500">Đã xác thực</h4></div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={24} /></div>
             </div>
          </div>

          <div className="lg:col-span-12 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" /> Danh sách hoạt động học kỳ {semesterId}</h3>
             </div>
             <div className="p-8">
                {loading ? <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p></div> : scannedRecords.length === 0 ? <div className="py-32 text-center space-y-4"><div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-200"><QrCode size={40} /></div><div className="space-y-1"><p className="text-slate-900 font-black text-lg">Chưa có hoạt động nào</p><p className="text-slate-400 font-bold text-sm">Hãy quét mã QR để nhận điểm nhé!</p></div></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {/* QR Records */}
                       {scannedRecords.map((record) => (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={record.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                             <div className="flex flex-col h-full space-y-6">
                                <div className="flex items-start justify-between"><div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${record.session.category?.includes('Ý thức') ? 'bg-amber-50 text-amber-600' : record.session.category?.includes('Đoàn Hội') ? 'bg-blue-50 text-blue-600' : record.session.category?.includes('cộng đồng') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{record.session.category}</div><div className="text-xl font-black text-blue-600">+{record.points}đ</div></div>
                                <div className="flex-1 space-y-2"><h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{record.session.title}</h4><div className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><Calendar size={12} /> {new Date(record.scannedAt).toLocaleDateString('vi-VN')}</div></div>
                                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest"><CheckCircle2 size={12} /> Đã xác thực hệ thống</div>
                             </div>
                          </motion.div>
                       ))}
                       {/* Manual Evidence */}
                       {myEvidence.map((ev) => (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={ev.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
                             <div className="flex flex-col h-full space-y-6">
                                <div className="flex items-start justify-between">
                                   <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ev.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : ev.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {ev.status === 'APPROVED' ? 'Đã duyệt' : ev.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
                                   </div>
                                   {ev.status === 'APPROVED' && <div className="text-xl font-black text-emerald-600">+{ev.points}đ</div>}
                                </div>
                                <div className="flex-1 space-y-2">
                                   <h4 className="text-sm font-black text-slate-900 leading-tight">{ev.status === 'APPROVED' ? ev.adminTitle : ev.title}</h4>
                                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><Calendar size={12} /> {new Date(ev.createdAt).toLocaleDateString('vi-VN')}</div>
                                   {ev.imageUrl && (
                                      <div className="mt-2 h-20 w-full rounded-xl overflow-hidden border border-slate-200">
                                         <img src={axios.defaults.baseURL + ev.imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                                      </div>
                                   )}
                                </div>
                                {ev.status === 'APPROVED' && (
                                   <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest"><CheckCircle2 size={12} /> Minh chứng hợp lệ</div>
                                )}
                             </div>
                          </motion.div>
                       ))}
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               onClick={stopScanner} 
               className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 40 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 40 }} 
               className="relative bg-white md:rounded-[3rem] shadow-2xl w-full max-w-lg h-full md:h-auto overflow-hidden flex flex-col mx-auto z-10"
             >
                <div className="p-6 flex items-center justify-between shrink-0 border-b border-slate-50">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Camera size={20} /></div>
                      <div><h2 className="text-lg font-black text-slate-900">Quét minh chứng</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đưa camera vào mã QR hoạt động</p></div>
                   </div>
                   <button onClick={stopScanner} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"><X size={20} /></button>
                </div>
                <div className="relative aspect-square md:aspect-video bg-black overflow-hidden">
                   <div id="reader" className="w-full h-full" />
                   <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-64 h-64 border-2 border-blue-500/30 rounded-[2.5rem] relative">
                         <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-2xl" />
                         <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-2xl" />
                         <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-2xl" />
                         <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-2xl" />
                         <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line" />
                      </div>
                   </div>
                   <AnimatePresence>
                      {hasPermission === false && (
                         <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center text-white z-20">
                            <AlertCircle className="text-rose-500 mb-6" size={56} /><h3 className="text-2xl font-black mb-2">Lỗi truy cập Camera</h3><p className="text-sm text-slate-400 mb-10 leading-relaxed">Vui lòng cấp quyền camera trong trình duyệt để quét mã QR.</p>
                            <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-slate-900 rounded-[1.5rem] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-white/10"><RefreshCcw size={18} /> Thử lại ngay</button>
                         </div>
                      )}
                      {scanLoading && (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 text-center z-30">
                            <div className="relative"><Loader2 className="animate-spin text-blue-600" size={64} /><QrCode className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24} /></div>
                            <h3 className="text-2xl font-black text-slate-900 mt-6 mb-2">Đang xác thực...</h3><p className="text-sm text-slate-500">Vui lòng giữ máy ổn định trong giây lát</p>
                         </motion.div>
                      )}
                      {scanSuccess && (
                         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center p-8 text-center text-white z-40">
                            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mb-8 animate-bounce"><CheckCircle2 size={56} /></div>
                            <h3 className="text-3xl font-black mb-2 tracking-tight">THÀNH CÔNG!</h3><p className="text-emerald-50 font-bold">Hoạt động đã được ghi nhận.</p>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
                <div className="p-8 bg-slate-50 shrink-0">
                   <div className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Info size={20} /></div>
                      <div><p className="text-xs font-black text-slate-900 uppercase">Mẹo nhỏ khi quét</p><p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">Hãy đưa mã QR vào trung tâm khung hình. Nếu mã mờ, hãy đưa điện thoại ra xa một chút để lấy nét tốt hơn.</p></div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUploadModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden relative z-10">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nộp minh chứng hoạt động</h2>
                  <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
               </div>
               <form onSubmit={handleUpload} className="p-8 space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên hoạt động</label>
                     <input type="text" required value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold" placeholder="VD: Tham gia hiến máu tình nguyện..." />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ảnh minh chứng (Giấy xác nhận, ảnh tham gia...)</label>
                     <div className="relative h-48 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 overflow-hidden group hover:border-emerald-500 transition-colors">
                        {uploadData.image ? (
                           <img src={URL.createObjectURL(uploadData.image)} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                           <>
                              <Camera size={32} className="text-slate-300" />
                              <p className="text-[10px] font-black text-slate-400 uppercase">Click để chọn ảnh hoặc chụp ảnh</p>
                           </>
                        )}
                        <input type="file" accept="image/*" required onChange={e => setUploadData({...uploadData, image: e.target.files?.[0] || null})} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>
                  <button type="submit" disabled={uploading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                     {uploading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                     {uploading ? 'Đang tải lên...' : 'Gửi minh chứng'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TrainingEvidence;
