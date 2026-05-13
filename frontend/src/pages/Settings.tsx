import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  School, 
  Calendar, 
  Lock, 
  ShieldAlert, 
  Save, 
  Mail, 
  Phone,
  Users,
  Loader2,
  Globe
} from 'lucide-react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    schoolName: '',
    schoolAddress: '',
    activeSemester: '',
    registrationOpen: false,
    maintenanceMode: false,
    contactEmail: '',
    contactPhone: ''
  });

  const [semesters, setSemesters] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [setRes, semRes] = await Promise.all([
        axios.get('/settings'),
        axios.get('/semesters')
      ]);
      setSettings(setRes.data);
      setSemesters(semRes.data);
    } catch (error) {
      toast.error('Lỗi tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch('/settings', settings);
      toast.success('Đã lưu thay đổi hệ thống');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-up pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <SettingsIcon size={12} /> System Administration
          </div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight text-gradient">Cài đặt hệ thống</h1>
          <p className="text-slate-500 font-bold text-sm">Cấu hình các tham số vận hành và thông tin tổ chức.</p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Lưu tất cả thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Organization Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h3 className="flex items-center gap-3 text-sm font-black text-slate-900 uppercase tracking-widest">
                <School className="text-blue-600" size={20} /> Thông tin trường học
              </h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đơn vị / Trường học</label>
                  <input 
                    type="text"
                    value={settings.schoolName}
                    onChange={e => setSettings({...settings, schoolName: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="VD: Trường Đại học Công nghệ"
                  />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ trụ sở</label>
                  <input 
                    type="text"
                    value={settings.schoolAddress}
                    onChange={e => setSettings({...settings, schoolAddress: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Nhập địa chỉ..."
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email liên hệ</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      value={settings.contactEmail}
                      onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={settings.contactPhone}
                      onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h3 className="flex items-center gap-3 text-sm font-black text-slate-900 uppercase tracking-widest">
                <Calendar className="text-emerald-600" size={20} /> Chu kỳ đào tạo
              </h3>
            </div>
            <div className="p-8 space-y-8">
               <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-sm font-black text-emerald-900">Học kỳ hiện tại</p>
                     <p className="text-[10px] font-bold text-emerald-600 uppercase">Dữ liệu mặc định cho toàn hệ thống</p>
                  </div>
                  <select 
                    value={settings.activeSemester}
                    onChange={e => setSettings({...settings, activeSemester: e.target.value})}
                    className="px-6 py-3 bg-white border border-emerald-200 rounded-xl font-black text-xs outline-none shadow-sm"
                  >
                    <option value="">Chọn học kỳ...</option>
                    {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
               </div>
            </div>
          </div>
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <h3 className="flex items-center gap-3 text-sm font-black text-slate-900 uppercase tracking-widest">
                <Users className="text-blue-600" size={20} /> Cấu hình thông tin sinh viên
              </h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               {[
                 { key: 'showGpa', label: 'Hiển thị điểm GPA' },
                 { key: 'allowEditPhone', label: 'Cho phép đổi SĐT' },
                 { key: 'allowEditAddress', label: 'Cho phép đổi địa chỉ' },
                 { key: 'showActivityPoints', label: 'Hiển thị điểm rèn luyện' }
               ].map((item) => (
                 <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-black text-slate-700">{item.label}</span>
                    <button 
                      onClick={() => setSettings({...settings, [item.key]: !(settings as any)[item.key]})}
                      className={`h-6 w-11 rounded-full relative transition-all duration-300 ${(settings as any)[item.key] ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ${(settings as any)[item.key] ? 'left-6' : 'left-1'}`} />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* System Controls */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-slate-900/20 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldAlert size={160} /></div>
              
              <h3 className="text-sm font-black uppercase tracking-widest relative z-10 flex items-center gap-2">
                <Lock size={18} className="text-blue-400" /> Chế độ vận hành
              </h3>

              <div className="space-y-6 relative z-10">
                 {/* Registration Toggle */}
                 <div className="flex items-center justify-between p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="space-y-1">
                       <p className="text-xs font-black uppercase tracking-widest">Cổng đăng ký môn</p>
                       <p className="text-[10px] text-slate-400 font-bold">Mở cho sinh viên đăng ký</p>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, registrationOpen: !settings.registrationOpen})}
                      className={`h-7 w-12 rounded-full relative transition-all duration-300 ${settings.registrationOpen ? 'bg-blue-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ${settings.registrationOpen ? 'left-6' : 'left-1'}`} />
                    </button>
                 </div>

                 {/* Maintenance Toggle */}
                 <div className="flex items-center justify-between p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="space-y-1">
                       <p className="text-xs font-black uppercase tracking-widest text-rose-400">Chế độ bảo trì</p>
                       <p className="text-[10px] text-slate-400 font-bold">Tạm khóa toàn hệ thống</p>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                      className={`h-7 w-12 rounded-full relative transition-all duration-300 ${settings.maintenanceMode ? 'bg-rose-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ${settings.maintenanceMode ? 'left-6' : 'left-1'}`} />
                    </button>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/5 relative z-10">
                 <div className="flex items-center gap-3 text-slate-400">
                    <Globe size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Hệ thống: v2.4.0 PRO</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
