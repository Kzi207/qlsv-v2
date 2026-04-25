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
  Fingerprint
} from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  
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
  }, [location.hash]);

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
      toast.success('Cập nhật thông tin thành công');
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
      // Refresh user data from server to get decrypted info
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setIsEditingDetails(false);
      toast.success('Cập nhật thông tin chi tiết thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin chi tiết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 animate-fade-up pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
             <User size={12} /> Account Center
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-slate-500 font-bold text-sm">Xem và quản lý thông tin học vụ của bạn.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
           <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black">
              {user?.name?.[0]}
           </div>
           <div className="pr-6">
              <p className="text-sm font-black text-slate-900">{user?.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role === 'QTV' ? 'Quản trị viên' : 'Sinh viên hệ chính quy'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Academic Info */}
        <div className="lg:col-span-2 space-y-8">
           {/* Academic Summary Card */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 space-y-3">
                 <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center"><Fingerprint size={20} /></div>
                 <div>
                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Mã sinh viên</p>
                    <p className="text-lg font-black">{user?.student?.mssv || user?.username}</p>
                 </div>
              </div>
              <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-900/20 space-y-3">
                 <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center"><Briefcase size={20} /></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp sinh hoạt</p>
                    <p className="text-lg font-black">{user?.student?.class_id || user?.class_id || 'N/A'}</p>
                 </div>
              </div>
              <div className="p-6 bg-emerald-600 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 space-y-3">
                 <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center"><GraduationCap size={20} /></div>
                 <div>
                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Trạng thái</p>
                    <p className="text-lg font-black">Đang học</p>
                 </div>
              </div>
           </div>

           {/* Detailed Information */}
           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="text-blue-600" size={18} /> Thông tin chi tiết
                 </h3>
                 {user?.role === 'STUDENT' && (
                    <button 
                      type="button"
                      onClick={() => setIsEditingDetails(!isEditingDetails)}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      {isEditingDetails ? 'HỦY BỎ' : 'CHỈNH SỬA'}
                    </button>
                 )}
              </div>
              <form onSubmit={handleUpdateDetails} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và tên</p>
                      {isEditingDetails ? (
                        <input 
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="Nhập họ và tên"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-black text-slate-900">{user?.name}</p>
                      )}
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh</p>
                      {isEditingDetails ? (
                        <input 
                          type="date"
                          value={detailsFormData.birthday}
                          onChange={e => setDetailsFormData({...detailsFormData, birthday: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-black text-slate-900">
                          {formatDateDisplay(user?.student?.birthday)}
                        </p>
                      )}
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới tính</p>
                      {isEditingDetails ? (
                        <select 
                          value={detailsFormData.gender}
                          onChange={e => setDetailsFormData({...detailsFormData, gender: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      ) : (
                        <p className="text-sm font-black text-slate-900">{user?.student?.gender || 'Đang cập nhật'}</p>
                      )}
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số CMND/CCCD</p>
                      {isEditingDetails ? (
                        <input 
                          type="text"
                          value={detailsFormData.id_card}
                          onChange={e => setDetailsFormData({...detailsFormData, id_card: e.target.value})}
                          placeholder="Nhập số CMND/CCCD"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-black text-slate-900">{user?.student?.id_card || 'Đang cập nhật'}</p>
                      )}
                   </div>
                   <div className="space-y-1 md:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quê quán</p>
                      {isEditingDetails ? (
                        <input 
                          type="text"
                          value={detailsFormData.hometown}
                          onChange={e => setDetailsFormData({...detailsFormData, hometown: e.target.value})}
                          placeholder="Tỉnh/Thành phố"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-black text-slate-900">{user?.student?.hometown || 'Đang cập nhật'}</p>
                      )}
                   </div>
                   <div className="space-y-1 md:col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ thường trú</p>
                      {isEditingDetails ? (
                        <input 
                          type="text"
                          value={detailsFormData.address}
                          onChange={e => setDetailsFormData({...detailsFormData, address: e.target.value})}
                          placeholder="Số nhà, đường, phường/xã..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-black text-slate-900">{user?.student?.address || 'Đang cập nhật'}</p>
                      )}
                   </div>
                </div>

                {isEditingDetails && (
                  <div className="mt-8 flex justify-end">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Lưu thông tin chi tiết
                    </button>
                  </div>
                )}
              </form>
           </div>
        </div>

        {/* Right Column: Editable Info */}
        <div className="space-y-8">
           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone className="text-blue-600" size={18} /> Liên lạc
                 </h3>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                    <div className="relative group">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         type="email"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <div className="relative group">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         type="text"
                         value={formData.phone}
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                         disabled={user?.role === 'STUDENT' && systemSettings?.allowEditPhone === false}
                         className={`w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none transition-all ${
                           (user?.role === 'STUDENT' && systemSettings?.allowEditPhone === false) 
                             ? 'opacity-50 cursor-not-allowed' 
                             : 'focus:ring-4 focus:ring-blue-500/10'
                         }`}
                       />
                    </div>
                 </div>
                 <button 
                   type="submit"
                   disabled={loading || (user?.role === 'STUDENT' && systemSettings?.allowEditPhone === false && true)}
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                 >
                    {loading ? <Loader2 size={18} className="animate-spin m-auto" /> : 'Lưu thông tin'}
                 </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
