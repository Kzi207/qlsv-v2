import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  User, 
  AlertCircle,
  ShieldCheck,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';

// --- TYPES ---
interface ServiceRequest {
  id: number;
  studentId: number;
  studentName: string;
  type: 'NVQS' | 'LOAN' | 'STUDENT_CONFIRM';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  details: any;
}

export default function AdminServiceManagement() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/services/all');
      setRequests(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await axios.put(`/services/approve/${id}`, { status: 'APPROVED' });
      toast.success('Đã xác nhận yêu cầu thành công!');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xác nhận');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await axios.put(`/services/approve/${id}`, { status: 'REJECTED' });
      toast.error('Đã từ chối yêu cầu');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.studentId).includes(searchTerm);
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-24 pt-4 animate-fade-up">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100"
          >
            <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải danh sách...</p>
          </motion.div>
        ) : !selectedRequest ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  <ShieldCheck size={12} /> Quản trị dịch vụ Một cửa
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">Phê duyệt hồ sơ sinh viên</h1>
                <p className="text-slate-500 font-bold text-sm">Quản lý và giải quyết các đơn từ hành chính trực tuyến.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm sinh viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 shadow-sm w-full md:w-64"
                  />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                   {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                     <button
                        key={s}
                        onClick={() => setFilterStatus(s as any)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          filterStatus === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                     >
                       {s === 'ALL' ? 'Tất cả' : s === 'PENDING' ? 'Chờ duyệt' : s === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <motion.div
                    layout
                    key={req.id}
                    className="bg-white rounded-[2.5rem] border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-slate-200/20 hover:shadow-2xl transition-all group"
                  >
                    <div className={`h-16 w-16 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                      req.type === 'NVQS' ? 'bg-blue-50 text-blue-600' : 
                      req.type === 'LOAN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {req.type === 'NVQS' ? <ShieldCheck size={28} /> : 
                       req.type === 'LOAN' ? <CreditCard size={28} /> : <FileText size={28} />}
                    </div>

                    <div className="flex-1 space-y-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{req.id}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                          {req.type === 'NVQS' ? 'Đăng ký NVQS' : 
                           req.type === 'LOAN' ? 'Xác nhận Vay vốn' : 'Xác nhận Sinh viên'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{req.studentName}</h3>
                      <p className="text-sm font-bold text-slate-500">{req.studentId} • {new Date(req.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                        req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {req.status === 'PENDING' ? 'Đang chờ' : req.status === 'APPROVED' ? 'Đã xác nhận' : 'Đã từ chối'}
                      </div>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 text-center space-y-4">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <FileText size={40} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 uppercase">Không có yêu cầu nào</h3>
                    <p className="text-sm font-bold text-slate-400">Danh sách đơn từ hiện đang trống.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <button
              onClick={() => setSelectedRequest(null)}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-black text-xs uppercase tracking-widest px-2"
            >
              <ArrowLeft size={16} /> Quay lại danh sách
            </button>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
              <div className="p-8 md:p-12 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-blue-300">
                    Chi tiết yêu cầu #{selectedRequest.id}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                    {selectedRequest.studentName}
                  </h2>
                  <p className="text-white/60 font-bold text-sm tracking-widest uppercase">
                    MSSV: {selectedRequest.studentId} • {selectedRequest.type === 'NVQS' ? 'Đăng ký NVQS' : selectedRequest.type === 'LOAN' ? 'Xác nhận Vay vốn' : 'Xác nhận Sinh viên'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Clock className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ngày gửi đơn</p>
                    <p className="font-bold text-lg">{new Date(selectedRequest.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                   {/* Thông tin sinh viên */}
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                        <User size={14} /> Thông tin cá nhân
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Họ và tên</p>
                          <p className="text-sm font-black text-slate-900 uppercase">{selectedRequest.studentName}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã số sinh viên</p>
                          <p className="text-sm font-black text-slate-900 uppercase">{selectedRequest.studentId}</p>
                        </div>
                      </div>
                   </div>

                   {/* Chi tiết đơn từ */}
                   <div className="space-y-4 md:col-span-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                        <FileText size={14} /> Nội dung yêu cầu
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {Object.entries(selectedRequest.details).map(([key, value]) => (
                           <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                {key === 'purpose' ? 'Mục đích' : key === 'note' ? 'Ghi chú' : key === 'loanAmount' ? 'Số tiền vay' : key === 'loanTimes' ? 'Số lần vay' : key}
                              </p>
                              <p className="text-sm font-bold text-slate-900">{String(value)}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
                  <AlertCircle className="text-amber-600 shrink-0 mt-1" size={20} />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-amber-900 uppercase tracking-tight">Lưu ý phê duyệt</h5>
                    <p className="text-xs font-bold text-amber-700/80 leading-relaxed">
                      Vui lòng đối soát thông tin trên đơn với dữ liệu gốc của sinh viên trước khi xác nhận. Sau khi xác nhận, hệ thống sẽ gửi thông báo yêu cầu sinh viên đến văn phòng nhận kết quả.
                    </p>
                  </div>
                </div>

                {selectedRequest.status === 'PENDING' && (
                  <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      className="w-full sm:w-auto px-10 py-5 bg-rose-50 text-rose-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Từ chối đơn
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="w-full sm:flex-1 px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Xác nhận & Gửi thông báo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
