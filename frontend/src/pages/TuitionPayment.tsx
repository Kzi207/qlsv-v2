import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  History as HistoryIcon, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const TuitionPayment = () => {
  const location = useLocation();
  const [tuitions, setTuitions] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchTuition();
  }, []);

  const fetchTuition = async () => {
    try {
      const res = await axios.get('/finance/my');
      setTuitions(res.data);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu học phí');
    }
  };

  const handlePayment = async () => {
    if (!currentTuition) return;
    try {
      toast.loading('Đang khởi tạo thanh toán...', { id: 'payment' });
      const res = await axios.post('/payments/vnpay/create', {
        tuitionId: currentTuition.id
      });
      
      if (res.data.paymentUrl) {
        toast.success('Đang chuyển hướng sang cổng thanh toán...', { id: 'payment' });
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error('Không nhận được link thanh toán', { id: 'payment' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khởi tạo thanh toán', { id: 'payment' });
    }
  };

  const preferredSemesterId = location.state?.semesterId;
  const currentTuition = preferredSemesterId 
    ? (tuitions.find(t => t.semesterId === preferredSemesterId) || tuitions[0])
    : tuitions[0];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
           <Wallet size={12} /> Tài chính & Học phí
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Thanh toán học phí</h1>
        <p className="text-slate-500 font-bold text-sm">Quản lý các khoản phí và thực hiện thanh toán trực tuyến an toàn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Summary */}
         <div className="lg:col-span-2 space-y-6">
            {currentTuition ? (
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                  <div className="p-8 md:p-12 bg-slate-900 text-white relative">
                     <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 -mr-8 -mt-8"><CreditCard size={200} /></div>
                     <div className="relative z-10 space-y-8">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                 Học phí ngành: {currentTuition.student?.class?.major?.name || 'Đang cập nhật'}
                              </p>
                              <h2 className="text-4xl font-black text-white">{(currentTuition.totalAmount - currentTuition.paidAmount).toLocaleString('vi-VN')}đ</h2>
                              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/5 backdrop-blur-sm">
                                 <ShieldCheck size={12} className="text-emerald-400" />
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Tính theo chương trình khung</span>
                              </div>
                           </div>
                           <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                              currentTuition.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                           }`}>
                              {currentTuition.status === 'PAID' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Học kỳ</p>
                              <p className="text-lg font-black">{currentTuition.semesterId}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã thanh toán</p>
                              <p className="text-lg font-black text-emerald-400">{currentTuition.paidAmount.toLocaleString('vi-VN')}đ</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 md:p-12 space-y-8">
                     <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Phương thức thanh toán</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <button 
                             onClick={handlePayment}
                             disabled={currentTuition.status === 'PAID'}
                             className="p-6 border-2 border-blue-600 bg-blue-50/50 rounded-[2rem] text-left space-y-3 group transition-all hover:bg-white hover:shadow-xl disabled:opacity-50 disabled:grayscale disabled:border-slate-200"
                           >
                              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"><ArrowRight size={20} /></div>
                              <p className="text-sm font-black text-slate-900">Ví điện tử / Ngân hàng</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Thanh toán qua mã QR hoặc ứng dụng ngân hàng</p>
                           </button>
                           <button className="p-6 border-2 border-slate-100 rounded-[2rem] text-left space-y-3 grayscale opacity-50 cursor-not-allowed">
                              <div className="h-10 w-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400"><HistoryIcon size={20} /></div>
                              <p className="text-sm font-black text-slate-400">Tiền mặt</p>
                              <p className="text-[10px] font-bold text-slate-300 uppercase leading-tight">Nộp trực tiếp tại phòng tài chính kế hoạch</p>
                           </button>
                        </div>
                     </div>

                     <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center gap-6">
                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0"><ShieldCheck size={24} /></div>
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase">Bảo mật tuyệt đối</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Mọi giao dịch đều được mã hóa và xác thực qua hệ thống an toàn.</p>
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="p-20 bg-white rounded-[3rem] border border-slate-100 text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto"><AlertCircle size={32} /></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Chưa có dữ liệu học phí</h3>
                  <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">Vui lòng hoàn thành đăng ký học phần để hệ thống tính toán học phí cho bạn.</p>
               </div>
            )}
         </div>

         {/* History Panel */}
         <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-6">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <HistoryIcon size={16} className="text-blue-500" /> Lịch sử thanh toán
               </h3>
               
               <div className="space-y-4">
                  {tuitions.map((t, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase">{t.semesterId}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                             {t.status === 'PAID' ? 'Hoàn thành' : 'Đang nợ'}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className={`text-sm font-black ${t.status === 'PAID' ? 'text-emerald-600' : 'text-slate-900'}`}>
                             {t.paidAmount.toLocaleString('vi-VN')}đ
                          </p>
                       </div>
                    </div>
                  ))}
                  
                  {tuitions.length === 0 && (
                     <p className="text-center text-[10px] font-bold text-slate-400 uppercase py-10">Chưa có giao dịch nào</p>
                  )}
               </div>
            </div>

            <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-4">
               <div className="flex items-center gap-3 text-amber-600">
                  <AlertCircle size={20} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Lưu ý quan trọng</h4>
               </div>
               <p className="text-[10px] font-bold text-amber-700/70 leading-relaxed uppercase">
                  Vui lòng hoàn thành học phí đúng hạn để không bị khóa quyền đăng ký thi và nhận kết quả học tập.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TuitionPayment;
