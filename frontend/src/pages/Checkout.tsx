import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Copy, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../api/axios';

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

const Checkout = () => {
  const { paymentCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<PaymentStatus>('PENDING');
  const [isCancelling, setIsCancelling] = useState(false);
  const [hasSuccessNotified, setHasSuccessNotified] = useState(false);

  const canCancel = status === 'PENDING' && !isCancelling;

  const qrUrl = useMemo(() => {
    if (!paymentCode) return '';
    return `https://qr.sepay.vn/img?bank=MB&acc=0939042183&template=compact&amount=${amount}&des=${paymentCode}`;
  }, [amount, paymentCode]);

  useEffect(() => {
    let mounted = true;

    const fetchPayment = async () => {
      if (!paymentCode) {
        navigate('/tuition');
        return;
      }

      try {
        const res = await axios.get(`/payments/${paymentCode}/status`);
        if (!mounted) return;

        setAmount(Number(res.data?.amount || 0));
        setStatus((res.data?.status || 'PENDING') as PaymentStatus);
      } catch {
        toast.error('Khong tim thay thong tin giao dich');
        navigate('/tuition');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPayment();
    const timer = setInterval(fetchPayment, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [navigate, paymentCode]);

  useEffect(() => {
    if (status !== 'SUCCESS' || hasSuccessNotified) return;

    setHasSuccessNotified(true);
    toast.success('Thanh toan thanh cong');
    const timer = setTimeout(() => navigate('/tuition/history'), 3000);
    return () => clearTimeout(timer);
  }, [hasSuccessNotified, navigate, status]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Da sao chep ${label}`);
  };

  const cancelPendingAndExit = async () => {
    if (!paymentCode) {
      navigate('/tuition');
      return;
    }

    if (status !== 'PENDING') {
      navigate('/tuition');
      return;
    }

    if (!window.confirm('Ban co chac chan muon thoat? Don hang dang cho se bi huy.')) {
      return;
    }

    try {
      setIsCancelling(true);
      await axios.post(`/payments/${paymentCode}/cancel`);
      toast.success('Da huy don hang');
      navigate('/tuition');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Loi khi huy don hang');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={cancelPendingAndExit}
          className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Thanh toan chuyen khoan</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Ma don hang: {paymentCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 p-8 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900">Quet ma QR de thanh toan</h3>
            <p className="text-xs font-bold text-slate-400 px-4">Su dung ung dung ngan hang de quet ma</p>
          </div>

          <div className="relative p-4 bg-white rounded-[2rem] border-4 border-slate-50 shadow-inner">
            <img src={qrUrl} alt="QR Code" className="w-64 h-64 md:w-80 md:h-80 object-contain rounded-xl" />
            {status === 'SUCCESS' && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center space-y-3">
                <CheckCircle2 size={48} className="text-emerald-600" />
                <p className="text-lg font-black text-slate-900">Giao dich thanh cong</p>
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 rounded-2xl border border-blue-100">
            <Loader2 className="animate-spin text-blue-600" size={16} />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dang cho xac nhan giao dich...</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/10 space-y-8">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest pl-1">Thong tin chuyen khoan</h4>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngan hang</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">MB Bank</p>
                </div>
                <ShieldCheck size={20} className="text-slate-400" />
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">So tai khoan</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">0939042183</p>
                </div>
                <button
                  onClick={() => copyToClipboard('0939042183', 'so tai khoan')}
                  className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="p-5 bg-blue-600 rounded-2xl border border-blue-700 flex items-center justify-between shadow-lg shadow-blue-600/20">
                <div>
                  <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest">So tien</p>
                  <p className="text-2xl font-black text-white mt-0.5">{amount.toLocaleString('vi-VN')}d</p>
                </div>
                <button
                  onClick={() => copyToClipboard(String(amount), 'so tien')}
                  className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <AlertCircle size={80} />
                </div>
                <div className="relative">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Noi dung chuyen khoan (bat buoc)</p>
                  <p className="text-xl font-black text-amber-900 mt-0.5">{paymentCode}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentCode || '', 'noi dung')}
                  className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm relative z-10"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-blue-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Thoi gian xu ly</h4>
              </div>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                Giao dich thuong xu ly trong 1-5 phut sau khi chuyen khoan thanh cong.
              </p>
            </div>

            <button
              onClick={cancelPendingAndExit}
              disabled={!canCancel}
              className="w-full py-4 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? 'Dang huy don hang...' : 'Thoat va huy don hang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
