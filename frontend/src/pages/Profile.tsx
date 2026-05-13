import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Save, 
  Loader2, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Smartphone,
  Fingerprint,
  Camera,
  MapPin,
  Calendar,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  
  // Password Change States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {}
    return '';
  };

  const formatDateDisplay = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Đang cập nhật';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    } catch (e) {
      return dateStr;
    }
  };

  const [detailsFormData, setDetailsFormData] = useState({
    birthday: formatDateForInput(user?.student?.birthday),
    gender: user?.student?.gender || '',
    id_card: user?.student?.id_card || '',
    hometown: user?.student?.hometown || '',
    address: user?.student?.address || '',
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);

  useEffect(() => {
    fetchSystemSettings();
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || user?.student?.phone || '',
    });
    setDetailsFormData({
      birthday: formatDateForInput(user?.student?.birthday),
      gender: user?.student?.gender || '',
      id_card: user?.student?.id_card || '',
      hometown: user?.student?.hometown || '',
      address: user?.student?.address || '',
    });
  }, [user]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSystemSettings(res.data);
    } catch (error) {}
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.patch('/auth/profile', formData);
      setUser(user ? { ...user, ...res.data } : res.data);
      toast.success('Đã lưu thông tin liên lạc');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/students/update-profile', detailsFormData);
      if (formData.name !== user?.name) {
        await api.patch('/auth/profile', { name: formData.name });
      }
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setIsEditingDetails(false);
      toast.success('Đã cập nhật hồ sơ chi tiết');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }

    if (passwordFormData.newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải từ 6 ký tự trở lên');
    }

    setPasswordLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      });
      toast.success('Đã đổi mật khẩu thành công');
      setIsChangePasswordOpen(false);
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 md:space-y-12 animate-fade-up pb-24 px-2 md:px-4">
      {/* Header Section */}
      <div className="flex flex-col items-center md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-3 text-center md:text-left w-full md:w-auto">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
             <User size={12} /> Thông tin cá nhân
          </div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Hồ sơ của bạn</h1>
          <p className="text-slate-500 font-bold text-sm md:text-base">Quản lý và cập nhật thông tin học vụ cá nhân.</p>
        </div>
        
        <div className="flex items-center gap-5 bg-white p-3 md:p-4 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 w-full md:w-auto justify-center md:justify-start">
           <div className="relative group">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                 {user?.name?.[0]}
              </div>
              <button className="absolute bottom-0 right-0 h-6 w-6 md:h-8 md:w-8 bg-white rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-colors">
                 <Camera size={14} className="md:w-4 md:h-4" />
              </button>
           </div>
           <div className="min-w-0 pr-4">
              <p className="text-lg md:text-xl font-black text-slate-900 leading-none truncate uppercase tracking-tight">{user?.name}</p>
              <p className="text-[10px] md:text-[11px] font-black text-blue-600 uppercase tracking-widest mt-1.5 bg-blue-50 px-3 py-1 rounded-full inline-block">
                {user?.role === 'QTV' ? 'Quản trị viên' : 'Hệ chính quy'}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        
        {/* Left Column: Academic Info */}
        <div className="lg:col-span-2 space-y-6 md:space-y-10">
           {/* Academic Summary Card Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-3 md:gap-5">
              <div className="p-6 md:p-8 min-h-[220px] bg-blue-600 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 space-y-4 relative overflow-hidden group">
                 <div className="h-10 w-10 md:h-12 md:w-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform"><Fingerprint size={20} /></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest opacity-80">Mã sinh viên</p>
                    <p className="text-base md:text-xl 2xl:text-2xl font-black tracking-tight leading-tight break-all">{user?.student?.mssv || user?.username}</p>
                 </div>
                 <div className="absolute top-0 right-0 p-4 opacity-10 -mr-6 -mt-6">
                    <Fingerprint size={80} />
                 </div>
              </div>
              <div className="p-6 md:p-8 min-h-[220px] bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20 space-y-4 relative overflow-hidden group">
                 <div className="h-10 w-10 md:h-12 md:w-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform"><Briefcase size={20} /></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80">Lớp sinh hoạt</p>
                    <p className="text-base md:text-xl 2xl:text-2xl font-black tracking-tight leading-tight break-all">{user?.student?.class_id || user?.class_id || '---'}</p>
                 </div>
                 <div className="absolute top-0 right-0 p-4 opacity-10 -mr-6 -mt-6">
                    <Briefcase size={80} />
                 </div>
              </div>
              <div className="p-6 md:p-8 min-h-[220px] bg-indigo-600 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 space-y-4 relative overflow-hidden group">
                 <div className="h-10 w-10 md:h-12 md:w-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform"><GraduationCap size={20} /></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest opacity-80">Ngành học</p>
                    <p className="text-base md:text-xl 2xl:text-2xl font-black tracking-tight leading-tight break-words">{user?.major_name || 'Đang cập nhật'}</p>
                 </div>
                 <div className="absolute top-0 right-0 p-4 opacity-10 -mr-6 -mt-6">
                    <GraduationCap size={80} />
                 </div>
              </div>
              <div className="p-6 md:p-8 min-h-[220px] bg-emerald-600 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 space-y-4 relative overflow-hidden group">
                 <div className="h-10 w-10 md:h-12 md:w-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform"><CheckCircle2 size={20} /></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest opacity-80">Trạng thái</p>
                    <p className="text-base md:text-xl 2xl:text-2xl font-black tracking-tight uppercase">Đang học</p>
                 </div>
                 <div className="absolute top-0 right-0 p-4 opacity-10 -mr-6 -mt-6">
                    <CheckCircle2 size={80} />
                 </div>
              </div>
           </div>

           {/* Detailed Information Section */}
           <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="p-6 md:p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="text-blue-600" size={18} /> Hồ sơ chi tiết
                 </h3>
                 {user?.role === 'STUDENT' && (
                    <button 
                      type="button"
                      onClick={() => setIsEditingDetails(!isEditingDetails)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isEditingDetails ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {isEditingDetails ? 'HỦY BỎ' : 'CHỈNH SỬA'}
                    </button>
                 )}
              </div>
              <form onSubmit={handleUpdateDetails} className="p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</p>
                      {isEditingDetails ? (
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input 
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-black text-slate-900 bg-slate-50/50 px-4 py-3.5 rounded-xl border border-dashed border-slate-100">{user?.name}</p>
                      )}
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày sinh</p>
                      {isEditingDetails ? (
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input 
                            type="date"
                            value={detailsFormData.birthday}
                            onChange={e => setDetailsFormData({...detailsFormData, birthday: e.target.value})}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-black text-slate-900 bg-slate-50/50 px-4 py-3.5 rounded-xl border border-dashed border-slate-100">
                          {formatDateDisplay(user?.student?.birthday)}
                        </p>
                      )}
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới tính</p>
                      {isEditingDetails ? (
                        <select 
                          value={detailsFormData.gender}
                          onChange={e => setDetailsFormData({...detailsFormData, gender: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all cursor-pointer appearance-none"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      ) : (
                        <p className="text-sm font-black text-slate-900 bg-slate-50/50 px-4 py-3.5 rounded-xl border border-dashed border-slate-100">{user?.student?.gender || 'Chưa cập nhật'}</p>
                      )}
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số CMND/CCCD</p>
                      {isEditingDetails ? (
                        <input 
                          type="text"
                          value={detailsFormData.id_card}
                          onChange={e => setDetailsFormData({...detailsFormData, id_card: e.target.value})}
                          placeholder="Số định danh cá nhân"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                        />
                      ) : (
                        <p className="text-sm font-black text-slate-900 bg-slate-50/50 px-4 py-3.5 rounded-xl border border-dashed border-slate-100">{user?.student?.id_card || 'Chưa cập nhật'}</p>
                      )}
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quê quán</p>
                      {isEditingDetails ? (
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input 
                            type="text"
                            value={detailsFormData.hometown}
                            onChange={e => setDetailsFormData({...detailsFormData, hometown: e.target.value})}
                            placeholder="Tỉnh/Thành phố"
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-black text-slate-900 bg-slate-50/50 px-4 py-3.5 rounded-xl border border-dashed border-slate-100">{user?.student?.hometown || 'Chưa cập nhật'}</p>
                      )}
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ cư trú</p>
                      {isEditingDetails ? (
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input 
                            type="text"
                            value={detailsFormData.address}
                            onChange={e => setDetailsFormData({...detailsFormData, address: e.target.value})}
                            placeholder="Số nhà, tên đường, phường/xã..."
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-black text-slate-900 bg-slate-50/50 px-4 py-3.5 rounded-xl border border-dashed border-slate-100">{user?.student?.address || 'Chưa cập nhật'}</p>
                      )}
                   </div>
                </div>

                <AnimatePresence>
                  {isEditingDetails && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-10 flex justify-end"
                    >
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Lưu thông tin hồ sơ
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
           </div>
        </div>

        {/* Right Column: Contact Information */}
        <div className="space-y-6 md:space-y-10">
           <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="p-6 md:p-10 border-b border-slate-50 bg-slate-50/50">
                 <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone className="text-blue-600" size={18} /> Kênh liên lạc
                 </h3>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 md:p-10 space-y-6 md:space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                    <div className="relative group">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                       <input 
                         type="email"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all shadow-sm"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <div className="relative group">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                       <input 
                         type="text"
                         value={formData.phone}
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                         disabled={user?.role === 'STUDENT' && systemSettings?.allowEditPhone === false}
                         className={`w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm outline-none transition-all shadow-sm ${
                           (user?.role === 'STUDENT' && systemSettings?.allowEditPhone === false) 
                             ? 'opacity-50 cursor-not-allowed grayscale' 
                             : 'focus:ring-4 focus:ring-blue-600/5 focus:bg-white'
                         }`}
                       />
                    </div>
                    {user?.role === 'STUDENT' && systemSettings?.allowEditPhone === false && (
                       <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight ml-1">* Không được phép thay đổi số điện thoại</p>
                    )}
                 </div>
                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full py-4.5 md:py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                 >
                    {loading ? <Loader2 size={20} className="animate-spin m-auto" /> : 'Lưu thông tin liên lạc'}
                 </button>
              </form>
           </div>
           
           <div className="bg-blue-600 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
              <h4 className="text-lg font-black uppercase tracking-tight relative z-10">Bảo mật tài khoản</h4>
              <p className="text-blue-100 text-xs font-bold mt-2 relative z-10">Bạn nên thường xuyên thay đổi mật khẩu để bảo vệ thông tin cá nhân.</p>
              <button 
                onClick={() => setIsChangePasswordOpen(true)}
                className="mt-6 w-full py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 relative z-10"
              >
                 Đổi mật khẩu truy cập
              </button>
              <Fingerprint className="absolute -right-6 -bottom-6 text-white opacity-10" size={140} />
           </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Đổi mật khẩu</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Cập nhật bảo mật tài khoản</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={passwordFormData.currentPassword}
                      onChange={e => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
                      className="w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={passwordFormData.newPassword}
                      onChange={e => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                      className="w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu mới</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={passwordFormData.confirmPassword}
                      onChange={e => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-4.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Xác nhận đổi mật khẩu
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
