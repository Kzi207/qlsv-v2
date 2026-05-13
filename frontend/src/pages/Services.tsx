import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard,
  User,
  Clock,
  Zap,
  Info,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

// --- TYPES ---
interface OneStopService {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  route: string;
  isActive: boolean;
}

type FormType = 'NVQS' | 'LOAN' | 'STUDENT_CONFIRM' | null;

// --- COMPONENTS ---

const IconWrapper = ({ iconName, className }: { iconName: string, className?: string }) => {
  const icons: Record<string, any> = {
    ShieldCheck: <ShieldCheck className={className} />,
    CreditCard: <CreditCard className={className} />,
    User: <User className={className} />,
    FileText: <FileText className={className} />,
    Zap: <Zap className={className} />,
    Clock: <Clock className={className} />,
  };
  return icons[iconName] || <FileText className={className} />;
};

const HeroBanner = () => (
  <div className="bg-[#0f172a] rounded-[1.25rem] py-4 px-6 md:py-6 md:px-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/5">
    {/* Decorative background elements */}
    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px] -mr-10 -mt-10" />
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-[50px] -ml-6 -mb-6" />
    
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="space-y-2 max-w-lg text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[7px] font-black uppercase tracking-[0.2em] text-blue-400">
          <Zap size={7} fill="currentColor" /> Một cửa điện tử
        </div>
        <h1 className="text-xl md:text-3xl font-black tracking-tight uppercase leading-[0.95]">
          Bộ phận <br /> <span className="text-blue-500">Một cửa</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] md:text-[11px] leading-relaxed max-w-[240px]">
          Tiếp nhận và giải quyết các thủ tục hành chính nhanh chóng.
        </p>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-0.5">
          {[
            { icon: <Zap size={10} />, label: 'Nhanh' },
            { icon: <CheckCircle2 size={10} />, label: 'Minh bạch' },
            { icon: <ShieldCheck size={10} />, label: 'Bảo mật' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[7px] font-black uppercase tracking-widest text-slate-300">
              <span className="text-blue-500">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block relative group">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all duration-500" />
        <div className="relative h-24 w-24 rounded-[1.5rem] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner">
          <ShieldCheck size={40} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  </div>
);

const ServiceCard = ({ service, onClick }: { service: OneStopService, onClick: () => void }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50/50 border-blue-100 text-blue-600',
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-600',
    amber: 'bg-amber-50/50 border-amber-100 text-amber-600',
    indigo: 'bg-indigo-50/50 border-indigo-100 text-indigo-600',
    rose: 'bg-rose-50/50 border-rose-100 text-rose-600',
  };

  const accentColor = colorMap[service.color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white border border-slate-100 rounded-[1.5rem] p-5 flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500"
    >
      <div className={`h-12 w-12 ${accentColor.split(' ')[0]} rounded-xl flex items-center justify-center mb-5 border ${accentColor.split(' ')[1]} group-hover:scale-110 transition-transform duration-500`}>
        <IconWrapper iconName={service.icon} className="w-6 h-6" />
      </div>
      
      <div className="space-y-2 mb-5 flex-1">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
          {service.title}
        </h3>
        <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
          {service.description}
        </p>
      </div>

      <button
        onClick={onClick}
        className="w-full py-2.5 px-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-500"
      >
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
          Thực hiện
        </span>
        <ArrowRight size={12} className="text-slate-400 group-hover:text-white transition-all group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-60 bg-white rounded-[1.5rem] border border-slate-50 animate-pulse" />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="bg-white rounded-[1.5rem] border border-slate-100 p-12 text-center flex flex-col items-center space-y-4">
    <div className="h-16 w-16 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200">
      <Inbox size={32} />
    </div>
    <div className="space-y-1">
      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Hiện chưa có thủ tục nào</h3>
      <p className="text-[10px] font-bold text-slate-400 max-w-xs mx-auto">Vui lòng quay lại sau.</p>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function ServicesPage() {
  const [services, setServices] = useState<OneStopService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/services/list');
      setServices(res.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = (service: OneStopService) => {
    // Logic: Nếu route là trang đã có thì điều hướng, nếu là form nội tại thì setActiveForm
    if (service.route.startsWith('/')) {
      // Mapping slug/title to FormType if needed, otherwise navigate
      if (service.title.includes('NVQS')) setActiveForm('NVQS');
      else if (service.title.includes('Vay vốn')) setActiveForm('LOAN');
      else if (service.title.includes('Sinh viên')) setActiveForm('STUDENT_CONFIRM');
      else navigate(service.route);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeForm || !user) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData(e.currentTarget);
      const details: Record<string, any> = {};
      formData.forEach((value, key) => { details[key] = value; });

      const sid = user.student?.id || user.studentId || user.id;

      await axios.post('/services/request', {
        studentId: sid,
        studentName: user.name,
        type: activeForm,
        details: details
      });

      toast.success('Gửi yêu cầu thành công!');
      setActiveForm(null);
    } catch (error: any) {
      toast.error('Gửi yêu cầu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 pt-4 space-y-8">
      <AnimatePresence mode="wait">
        {!activeForm ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <HeroBanner />

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase tracking-[0.2em]">
                    <FileText size={12} /> Thủ tục trực tuyến
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    Danh sách <span className="text-blue-600">Dịch vụ</span>
                  </h2>
                </div>
                <p className="text-[10px] font-bold text-slate-400 md:max-w-[200px] md:text-right">
                  Chọn thủ tục bạn cần thực hiện.
                </p>
              </div>

              {loading ? (
                <LoadingSkeleton />
              ) : services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map(service => (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      onClick={() => handleServiceAction(service)} 
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto"
          >
             <button
              onClick={() => setActiveForm(null)}
              className="group mb-6 inline-flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] px-2"
            >
              <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> 
              Quay lại danh sách
            </button>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden">
               <div className={`p-8 text-white relative overflow-hidden ${
                activeForm === 'NVQS' ? 'bg-blue-600' : activeForm === 'LOAN' ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Đang thực hiện</div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">
                      {activeForm === 'NVQS' ? 'Đăng ký NVQS' : activeForm === 'LOAN' ? 'Xác nhận Vay vốn' : 'Xác nhận Sinh viên'}
                    </h2>
                  </div>
                  <div className="h-20 w-20 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                    {activeForm === 'NVQS' ? <ShieldCheck size={40} /> : activeForm === 'LOAN' ? <CreditCard size={40} /> : <User size={40} />}
                  </div>
                </div>
              </div>

              <form onSubmit={handleServiceSubmit} className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">1</div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Thông tin cá nhân</h3>
                    <div className="h-px flex-1 bg-slate-50" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Mã số sinh viên', name: 'studentCode', val: user?.student?.mssv || '' },
                      { label: 'Họ và tên', name: 'fullName', val: user?.student?.name || user?.name || '' },
                      { label: 'Ngày sinh', name: 'birthday', val: user?.student?.birthday || '', type: 'date' },
                      { label: 'Số CCCD/CMND', name: 'idCard', val: user?.student?.id_card || '' },
                      { label: 'Số điện thoại', name: 'phone', val: user?.phone || '', type: 'tel' },
                      { label: 'Lớp sinh hoạt', name: 'className', val: user?.student?.class_id || '' }
                    ].map(field => (
                      <div key={field.name} className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-600 transition-colors">{field.label} *</label>
                        <input 
                          name={field.name} 
                          required 
                          defaultValue={field.val} 
                          type={field.type || 'text'} 
                          className="w-full bg-slate-50/50 border border-slate-100 rounded-lg px-4 py-3 text-[11px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4 bg-blue-50/50 p-4 rounded-2xl max-w-md">
                    <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-[11px] font-bold text-blue-900/60 leading-relaxed">
                      Thông tin này sẽ được dùng để in trên giấy xác nhận. Vui lòng kiểm tra kỹ trước khi gửi yêu cầu.
                    </p>
                  </div>

                  <button
                    disabled={isSubmitting}
                    className={`w-full md:w-auto px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
                      isSubmitting 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 active:scale-95'
                    }`}
                  >
                    {isSubmitting ? <Clock className="animate-spin" size={18} /> : <Send size={18} />}
                    {isSubmitting ? 'Đang gửi...' : 'Xác nhận & Gửi'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
