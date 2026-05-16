import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, User, Lock, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

const REMEMBER_USERNAME_KEY = 'qlsv_remembered_username';
const EXPERIENCE_CLASS_ID = 'CNDT2411';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const RegisterAccount = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSubmitDisabled =
    !name.trim() ||
    !username.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword ||
    loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const normalizedUsername = username.trim().toUpperCase();
      await api.post('/auth/register', {
        name: name.trim(),
        username: normalizedUsername,
        email: email.trim().toLowerCase(),
        password,
      });

      // Tự động đăng nhập
      const loginRes = await api.post('/auth/login', {
        username: normalizedUsername,
        password,
      });

      useAuthStore.getState().login(loginRes.data.user);
      
      localStorage.setItem(REMEMBER_USERNAME_KEY, normalizedUsername);
      toast.success(`Đăng ký thành công. Đang chuyển hướng...`);
      navigate('/');
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Đăng ký tài khoản trải nghiệm</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tài khoản đăng ký tại đây sẽ được gán vào lớp <span className="font-bold">{EXPERIENCE_CLASS_ID}</span>.
          </p>
          <p className="mt-1 text-xs font-bold text-amber-600">
            Mở đăng ký tạm thời cho người dùng trải nghiệm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500">Họ và tên</label>
            <div className="relative mt-1">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Tên đăng nhập</label>
            <div className="relative mt-1">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="Ví dụ: CNDT2411001"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm font-medium uppercase"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Email</label>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@student.ctuet.edu.vn"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Mật khẩu</label>
            <div className="relative mt-1">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm font-medium"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500">Xác nhận mật khẩu</label>
            <div className="relative mt-1">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm font-medium"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full h-12 rounded-xl bg-[#0011ff] text-white font-black text-xs uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <span>Tạo tài khoản</span>}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-5 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterAccount;
