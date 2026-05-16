import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, User, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

const REMEMBER_USERNAME_KEY = 'qlsv_remembered_username';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getRememberedUsername = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(REMEMBER_USERNAME_KEY) ?? '';
  } catch {
    return '';
  }
};

const Login = () => {
  const [username, setUsername] = useState(getRememberedUsername());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(!!getRememberedUsername());
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const queryParams = new URLSearchParams(location.search);
  const redirectTo = queryParams.get('redirectTo');

  const isSubmitDisabled = !username || !password || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      
      if (remember) {
        localStorage.setItem(REMEMBER_USERNAME_KEY, username);
      } else {
        localStorage.removeItem(REMEMBER_USERNAME_KEY);
      }

      login(res.data.user);
      localStorage.setItem('token', res.data.token);
      toast.success('Chào mừng bạn quay trở lại!');
      
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate('/');
      }
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
        <div className="flex-1 w-0 p-2">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-black text-slate-900 uppercase">Quên mật khẩu?</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Vui lòng liên hệ Văn phòng Khoa hoặc Quản trị viên hệ thống để được hỗ trợ cấp lại mật khẩu mới.</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-100">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#0a0f1e] font-sans selection:bg-blue-500/30 selection:text-blue-200 p-2 md:p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl max-h-full"
      >
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row h-auto md:h-[620px]">
          
          {/* Left Side: Branding & Info */}
          <div className="w-full md:w-[45%] relative overflow-hidden bg-[#1e45de] p-6 md:p-10 flex flex-col justify-start pt-8 md:pt-10 text-white">
            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mb-2 overflow-hidden"
              >
                <img 
                  src="/logoctut.png" 
                  alt="CTUT Logo" 
                  className="w-full h-full object-contain" 
                  style={{ mixBlendMode: 'screen' }}
                />
              </motion.div>
              
              <div className="space-y-2">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1"
                >
                  <h2 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.1em] text-white/90">
                    Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
                  </h2>
                  <h3 className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.05em] text-white/60">
                    Cantho University of Technology
                  </h3>
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="py-1"
                >
                  <h1 className="text-[20px] md:text-[26px] font-black uppercase tracking-tight text-white mb-2 md:whitespace-nowrap">
                    Cổng Quản lý Sinh viên
                  </h1>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                    <span className="text-[#ffba2d]">My</span>
                    <span className="text-white">CTUTs</span>
                  </h1>
                </motion.div>
                
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-blue-100/70 text-xs md:text-sm leading-relaxed max-w-[300px] mx-auto font-medium"
                >
                  Hệ thống giúp quản lý học tập, lịch học, đánh giá rèn luyện và các dịch vụ học vụ tại một nơi duy nhất
                </motion.p>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="flex-1 bg-white dark:bg-slate-900 p-8 md:p-12 flex flex-col justify-start pt-8 md:pt-10">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-8">
                <motion.h2 
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                >
                  Đăng nhập
                </motion.h2>
                <motion.p 
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-1 text-slate-400 dark:text-slate-500 font-bold text-xs"
                >
                  Sử dụng tài khoản của bạn để truy cập.
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div 
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-1.5"
                >
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Tài khoản</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors">
                      <User size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="MSSV hoặc Tên đăng nhập"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-xs dark:text-white"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-1.5"
                >
                  <div className="px-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Mật khẩu</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-xs dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end px-1 mt-1">
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center"
                >
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${remember ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                      {remember && <ShieldCheck size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="ml-2.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Ghi nhớ đăng nhập</span>
                  </label>
                </motion.div>

                <motion.button
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  type="submit"
                  disabled={isSubmitDisabled}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="w-full relative group h-14 bg-[#0011ff] rounded-[1.25rem] overflow-hidden shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-500 group-hover:scale-105" />
                  
                  <div className="relative h-full flex items-center justify-center gap-2.5">
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <>
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Đăng nhập ngay</span>
                        <motion.div
                          animate={isHovered ? { x: 3 } : { x: 0 }}
                          className="text-white"
                        >
                          <ArrowRight size={16} strokeWidth={3} />
                        </motion.div>
                      </>
                    )}
                  </div>
                </motion.button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chưa có tài khoản trải nghiệm?{' '}
                  <Link to="/register" className="text-blue-600 hover:text-blue-700">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
