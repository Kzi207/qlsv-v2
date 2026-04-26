import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock3, Eye, EyeOff, Loader2, Lock, ShieldCheck, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

const REMEMBER_USERNAME_KEY = 'qlsv_remembered_username';

const trustBadges = [
  { icon: ShieldCheck, label: 'Bảo mật nhiều lớp' },
  { icon: Clock3, label: 'Đăng nhập nhanh' },
  { icon: Users, label: 'Sinh viên và giảng viên' },
];

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getRememberedUsername = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  try {
    return window.localStorage.getItem(REMEMBER_USERNAME_KEY) ?? '';
  } catch {
    return '';
  }
};

const Login = () => {
  const [rememberedUsername] = useState(() => getRememberedUsername());
  const [username, setUsername] = useState(rememberedUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(Boolean(rememberedUsername));
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      toast.error('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        username: trimmedUsername,
        password,
      });
      login(res.data.user);

      try {
        if (remember) {
          window.localStorage.setItem(REMEMBER_USERNAME_KEY, trimmedUsername);
        } else {
          window.localStorage.removeItem(REMEMBER_USERNAME_KEY);
        }
      } catch {
        // Ignore localStorage issues to avoid blocking login flow.
      }

      toast.success('Chào mừng trở lại!');
      navigate('/');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.error('Tính năng đăng nhập bằng Google đang được phát triển');
  };

  const handleForgotPassword = () => {
    toast('Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu');
  };

  const isSubmitDisabled = loading || !username.trim() || !password;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-slate-100 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-6 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-4 h-48 w-48 rounded-full bg-cyan-300/35 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl sm:-right-28 sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-indigo-400/15 blur-2xl sm:h-44 sm:w-44" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 mx-auto grid w-full max-w-6xl overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white/90 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.55)] backdrop-blur lg:rounded-[2rem] lg:grid-cols-[1.05fr,1fr]"
      >
        <aside className="hidden lg:order-1 lg:block lg:relative lg:overflow-hidden lg:bg-gradient-to-br lg:from-[#003f91] lg:via-[#0056c7] lg:to-[#1a73d8] lg:px-12 lg:py-12 lg:text-white">
          <div className="pointer-events-none absolute -right-16 top-8 h-44 w-44 rounded-full border border-white/20" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-60 w-60 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/45 bg-white/10 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.95)]">
              <img
                src="/logoctut.png?v=2"
                alt="CTUT Logo"
                className="h-full w-full object-cover scale-[1.02]"
              />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-100/90">Cổng đào tạo</p>
              <p className="text-sm font-bold text-blue-50">QLSV CTUT</p>
            </div>
          </div>

          <div className="relative mt-8 space-y-4 lg:mt-10">
            <h1 className="font-k2d text-2xl font-black uppercase leading-tight tracking-wide sm:text-[2rem]">
              Trường Đại học
              <br />
              Kỹ thuật - Công nghệ Cần Thơ
            </h1>
            <p className="max-w-md text-sm text-blue-50/95 sm:text-base">
              Truy cập hệ thống quản lý học tập, lịch học, đánh giá rèn luyện và các dịch vụ học vụ tại một nơi duy nhất.
            </p>
          </div>

          <div className="relative mt-8 grid gap-3 sm:mt-10">
            {trustBadges.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-700">
                  <item.icon size={18} />
                </div>
                <p className="text-sm font-semibold text-blue-50">{item.label}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="order-1 px-5 py-6 sm:px-10 sm:py-10 lg:order-2 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-3 py-3 shadow-sm lg:hidden">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-blue-200/80 bg-white">
                <img
                  src="/logoctut.png?v=2"
                  alt="CTUT Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-blue-900">MY CTUT'S</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700/80">Đăng nhập hệ thống</p>
              <h2 className="font-k2d text-2xl font-black leading-tight text-slate-900 sm:text-3xl">Chào mừng trở lại</h2>
              <p className="text-sm text-slate-500 sm:text-base">
                Sử dụng tài khoản sinh viên hoặc giảng viên để tiếp tục.
              </p>
            </div>

            <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="username" className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tài khoản
                </label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors group-focus-within:text-blue-600 sm:pl-4">
                    <User size={18} />
                  </span>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập mã số sinh viên hoặc tên đăng nhập"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-[15px] font-semibold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:h-14 sm:rounded-2xl sm:pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Mật khẩu
                </label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors group-focus-within:text-blue-600 sm:pl-4">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-12 text-[15px] font-semibold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:h-14 sm:rounded-2xl sm:pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-blue-700 sm:pr-4"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  Ghi nhớ tài khoản
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-blue-700 transition-colors hover:text-blue-900"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0046a8] px-4 text-[13px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#003d94] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:h-14 sm:rounded-2xl sm:text-base sm:tracking-wider"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang đăng nhập
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Đăng nhập hệ thống
                  </>
                )}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Hoặc</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] sm:h-14 sm:rounded-2xl sm:text-base"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                <span>Đăng nhập bằng Google</span>
              </button>
            </form>
          </div>
        </div>
      </motion.section>

      <footer className="relative z-10 mx-auto mt-4 hidden max-w-6xl px-2 text-center sm:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
          Bản quyền © 2026 Trung tâm Công nghệ thông tin - Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
        </p>
      </footer>
    </main>
  );
};

export default Login;

