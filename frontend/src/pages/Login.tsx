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
    <main className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-[26rem] w-[26rem] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-44 w-44 -translate-x-1/2 rounded-full bg-indigo-400/15 blur-2xl" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/85 shadow-[0_35px_80px_-35px_rgba(15,23,42,0.55)] backdrop-blur lg:grid-cols-[1.05fr,1fr]"
      >
        <aside className="relative overflow-hidden bg-gradient-to-br from-[#003f91] via-[#0056c7] to-[#1a73d8] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute -right-16 top-8 h-44 w-44 rounded-full border border-white/20" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-60 w-60 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-white/40 bg-white/95 p-2 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.95)]">
              <span className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-white to-blue-100/80" />
              <img
                src="/logoctut.png"
                alt="CTUT Logo"
                className="relative h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(37,99,235,0.28)]"
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

        <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700/80">Đăng nhập hệ thống</p>
              <h2 className="font-k2d text-3xl font-black leading-tight text-slate-900">Chào mừng trở lại</h2>
              <p className="text-sm text-slate-500 sm:text-base">
                Sử dụng tài khoản sinh viên hoặc giảng viên để tiếp tục.
              </p>
            </div>

            <form className="mt-7 space-y-5 sm:mt-8 sm:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="username" className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tài khoản
                </label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-600">
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
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 font-semibold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Mật khẩu
                </label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-600">
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
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 font-semibold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-blue-700"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
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
                className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#0046a8] px-4 font-black uppercase tracking-wider text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#003d94] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
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
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
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

      <footer className="relative z-10 mx-auto mt-5 max-w-6xl px-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
          Bản quyền © 2026 Trung tâm Công nghệ thông tin - Trường Đại học Kỹ thuật - Công nghệ Cần Thơ
        </p>
      </footer>
    </main>
  );
};

export default Login;
