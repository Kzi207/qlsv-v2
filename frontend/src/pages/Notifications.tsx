import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Megaphone, 
  Clock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  content: string | null;
  tag: string;
  color: string;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'QTV';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tag: 'Học vụ',
    color: 'blue'
  });

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notifications', formData);
      toast.success('Đã đăng thông báo mới');
      setIsModalOpen(false);
      setFormData({ title: '', content: '', tag: 'Học vụ', color: 'blue' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to create notification', error);
      toast.error('Lỗi khi đăng thông báo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xác nhận xóa thông báo này?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Đã xóa thông báo');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification', error);
      toast.error('Lỗi khi xóa thông báo');
    }
  };

  const tagColors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-up">
      {/* Header Section */}
      <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
            <Bell size={12} className="animate-pulse" /> Trung tâm thông báo
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 md:text-5xl leading-none italic">
            Thông báo <span className="text-blue-600">mới nhất</span>
          </h1>
          <p className="text-sm font-bold text-slate-400">Cập nhật tin tức quan trọng từ nhà trường và các phòng ban.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus size={18} /> Đăng thông báo
          </button>
        )}
      </section>

      {/* Notifications List */}
      <div className="space-y-4 px-2">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[2rem]" />
          ))
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={notif.id}
              className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100 border border-white ${tagColors[notif.color] || tagColors.blue} group-hover:scale-110 transition-transform duration-500`}>
                  <Megaphone size={24} />
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${tagColors[notif.color] || tagColors.blue}`}>
                      {notif.tag}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 italic">
                      <Clock size={12} />
                      {new Date(notif.createdAt).toLocaleDateString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                    {notif.title}
                  </h3>
                  
                  {notif.content && (
                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-3xl">
                      {notif.content}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="absolute top-6 right-6 md:static h-10 w-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
            <div className="h-20 w-20 bg-white shadow-xl shadow-slate-200/50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
              <Bell size={40} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Không có thông báo mới</h3>
            <p className="text-xs font-bold text-slate-300 mt-2 italic">Mọi tin tức mới nhất sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <Plus size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Đăng thông báo mới</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nhập đầy đủ thông tin bên dưới</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Tiêu đề</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="VD: Thông báo nghỉ học ngày 30/4"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Phân loại</label>
                      <select
                        value={formData.tag}
                        onChange={e => setFormData({ ...formData, tag: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
                      >
                        <option>Học vụ</option>
                        <option>Đoàn Hội</option>
                        <option>Tài chính</option>
                        <option>Kỹ thuật</option>
                        <option>Khác</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Màu sắc</label>
                      <select
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
                      >
                        <option value="blue">Xanh dương</option>
                        <option value="rose">Đỏ hồng</option>
                        <option value="amber">Vàng cam</option>
                        <option value="emerald">Xanh lá</option>
                        <option value="indigo">Tím</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Nội dung chi tiết</label>
                    <textarea
                      rows={4}
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Nhập nội dung chi tiết thông báo..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] mt-4"
                  >
                    Đăng thông báo ngay
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
