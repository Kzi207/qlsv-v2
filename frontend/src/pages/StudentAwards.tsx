import { Trophy, Hammer, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentAwards = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 animate-fade-up">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="h-32 w-32 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-200/50 relative z-10">
            <Trophy size={64} className="animate-bounce-slow" />
          </div>
          <div className="absolute -top-4 -right-4 h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl animate-pulse">
            <Hammer size={24} />
          </div>
          <div className="absolute -bottom-2 -left-2 text-indigo-500 animate-spin-slow">
            <Sparkles size={32} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Danh hiệu & Khen thưởng</h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Tính năng đang phát triển
          </div>
          <p className="text-slate-500 font-medium leading-relaxed">
            Chúng tôi đang xây dựng không gian vinh danh những thành tích xuất sắc của bạn. 
            Hệ thống quản lý khen thưởng điện tử sẽ sớm ra mắt!
          </p>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-900 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/20 active:scale-95"
        >
          <ArrowLeft size={16} /> Quay lại trang chủ
        </button>
      </div>

      {/* Decorative background elements */}
      <div className="fixed top-1/4 -left-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-amber-50 rounded-full blur-3xl opacity-50 -z-10" />
    </div>
  );
};

export default StudentAwards;
