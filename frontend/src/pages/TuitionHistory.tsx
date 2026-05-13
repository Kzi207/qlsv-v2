import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface PaymentHistory {
  id: number;
  paymentCode: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paidAt: string | null;
  createdAt: string;
  tuition: {
    semesterId: string;
  };
}

const TuitionHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await api.get('/payments/my/history');
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to fetch payment history', error);
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredPayments = payments.filter(p => 
    p.paymentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tuition.semesterId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-600',
          border: 'border-emerald-100',
          icon: <CheckCircle2 size={12} />,
          label: 'Thành công'
        };
      case 'FAILED':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-100',
          icon: <XCircle size={12} />,
          label: 'Thất bại'
        };
      default:
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-100',
          icon: <Clock size={12} />,
          label: 'Đang xử lý'
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20 animate-fade-up">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
            <History size={12} className="animate-pulse" /> Tài chính & Học phí
          </div>
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
            Lịch sử <span className="text-blue-600">giao dịch</span>
          </h1>
          <p className="text-sm font-bold text-slate-400">Xem lại các khoản thanh toán học phí của bạn trên hệ thống.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-12 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
             <Download size={16} /> Xuất báo cáo
          </button>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
           <input 
             type="text" 
             placeholder="Tìm mã giao dịch, học kỳ..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
           />
        </div>
        <div className="flex gap-3">
          <button className="h-12 w-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
            <Filter size={18} />
          </button>
          <button className="h-12 w-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-[2rem] border border-slate-100" />
          ))
        ) : filteredPayments.length > 0 ? (
          <AnimatePresence>
            {filteredPayments.map((payment, index) => {
              const status = getStatusStyle(payment.status);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={payment.id}
                  className="group bg-white border border-slate-100 rounded-[2rem] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500"
                >
                  <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100 border border-white ${status.bg} ${status.text} group-hover:scale-110 transition-transform duration-500`}>
                      <CreditCard size={24} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{payment.paymentCode}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${status.bg} ${status.text} ${status.border}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Học phí học kỳ {payment.tuition.semesterId}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-none pt-4 md:pt-0">
                    <p className="text-lg md:text-xl font-black text-slate-900">{formatCurrency(payment.amount)}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                       <Clock size={12} />
                       {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    <button className="h-10 w-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:rotate-45 transition-all duration-500">
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="py-24 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="h-20 w-20 bg-white shadow-xl shadow-slate-200/50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
              <History size={40} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Không có giao dịch nào</h3>
            <p className="text-xs font-bold text-slate-300 mt-2 italic">Mọi khoản thanh toán của bạn sẽ được lưu trữ tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TuitionHistory;

