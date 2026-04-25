import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  Users, 
  Loader2, 
  Layers, 
  School,
  Edit3,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Classes = () => {
  const [activeTab, setActiveTab] = useState<'faculties' | 'majors' | 'classes'>('faculties');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, mRes, cRes, sRes] = await Promise.all([
        api.get('/curriculum/faculties'),
        api.get('/curriculum/majors'),
        api.get('/classes'),
        api.get('/semesters')
      ]);
      setFaculties(fRes.data);
      setMajors(mRes.data);
      setClasses(cRes.data);
      setSemesters(sRes.data);
    } catch (e) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (tab: string, item: any = null) => {
    setEditingItem(item);
    if (tab === 'faculties') {
      setFormData(item ? { code: item.code, name: item.name, description: item.description } : { code: '', name: '', description: '' });
    } else if (tab === 'majors') {
      setFormData(item ? { code: item.code, name: item.name, facultyId: item.facultyId } : { code: '', name: '', facultyId: faculties[0]?.id || '' });
    } else if (tab === 'classes') {
      setFormData(item ? { name: item.name, majorId: item.majorId } : { name: '', majorId: majors[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'faculties' ? '/curriculum/faculties' : (activeTab === 'majors' ? '/curriculum/majors' : '/classes');
      
      if (editingItem) {
        const id = activeTab === 'classes' ? editingItem.name : editingItem.id;
        await api.put(`${endpoint}/${id}`, formData);
        toast.success('Cập nhật thành công');
      } else {
        await api.post(endpoint, formData);
        toast.success('Thêm mới thành công');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu dữ liệu');
    }
  };

  const handleDelete = async (id: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa? Thao tác này không thể hoàn tác.')) return;
    try {
      const endpoint = activeTab === 'faculties' ? '/curriculum/faculties' : (activeTab === 'majors' ? '/curriculum/majors' : '/classes');
      await api.delete(`${endpoint}/${id}`);
      toast.success('Đã xóa thành công');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa');
    }
  };

  const updateClassSemester = async (classId: string, semesterId: string) => {
    try {
      await api.put(`/classes/${classId}`, { active_semester_id: semesterId || null });
      toast.success('Cập nhật học kỳ thành công');
      fetchData();
    } catch (error) {
      toast.error('Lỗi cập nhật học kỳ');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
              <School size={12} /> Hệ thống tổ chức
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Khoa & Lớp học</h1>
           <p className="text-slate-500 font-bold text-sm">Quản lý cơ cấu tổ chức từ cấp Khoa, Ngành đến từng Lớp học.</p>
        </div>

        <button 
          onClick={() => handleOpenModal(activeTab)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95"
        >
          <Plus size={20} />
          <span>Thêm {activeTab === 'faculties' ? 'Khoa' : (activeTab === 'majors' ? 'Ngành' : 'Lớp')} mới</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {(['faculties', 'majors', 'classes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab === 'faculties' ? 'Khoa' : (tab === 'majors' ? 'Ngành' : 'Lớp học')}
          </button>
        ))}
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-8">
         <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={`Tìm kiếm ${activeTab === 'faculties' ? 'khoa' : (activeTab === 'majors' ? 'ngành' : 'lớp')}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
            />
         </div>

         {loading ? (
           <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                 {activeTab === 'faculties' && faculties.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
                   <motion.div key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                         <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100"><School size={24}/></div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleOpenModal('faculties', f)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm"><Edit3 size={16}/></button>
                            <button onClick={() => handleDelete(f.id)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-rose-600 shadow-sm"><Trash2 size={16}/></button>
                         </div>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{f.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mã khoa: {f.code}</p>
                   </motion.div>
                 ))}

                 {activeTab === 'majors' && majors.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                   <motion.div key={m.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                         <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100"><Layers size={24}/></div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleOpenModal('majors', m)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm"><Edit3 size={16}/></button>
                            <button onClick={() => handleDelete(m.id)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-rose-600 shadow-sm"><Trash2 size={16}/></button>
                         </div>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{m.name}</h4>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Khoa {m.faculty?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mã ngành: {m.code}</p>
                   </motion.div>
                 ))}

                 {activeTab === 'classes' && classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                   <motion.div key={c.name} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                         <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm border border-slate-100"><BookOpen size={24}/></div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleOpenModal('classes', c)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-blue-600 shadow-sm"><Edit3 size={16}/></button>
                            <button onClick={() => handleDelete(c.name)} className="p-2 bg-white rounded-lg text-slate-400 hover:text-rose-600 shadow-sm"><Trash2 size={16}/></button>
                         </div>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{c.name}</h4>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{c.major?.name || 'Chưa gán ngành'}</p>
                      
                      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                         <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                            <Users size={14}/> {c.students?.length || 0} SV
                         </div>
                         <select 
                           value={c.active_semester_id || ''}
                           onChange={(e) => updateClassSemester(c.name, e.target.value)}
                           className="text-[10px] font-black uppercase text-blue-600 bg-transparent outline-none cursor-pointer"
                         >
                            <option value="">Học kỳ hiện tại</option>
                            {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                         </select>
                      </div>
                   </motion.div>
                 ))}
              </AnimatePresence>
           </div>
         )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                     {editingItem ? 'Chỉnh sửa' : 'Thêm'} {activeTab === 'faculties' ? 'Khoa' : (activeTab === 'majors' ? 'Ngành' : 'Lớp')}
                   </h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={32}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   {activeTab === 'faculties' && (
                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã khoa</label>
                           <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên khoa</label>
                           <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1" />
                        </div>
                     </div>
                   )}

                   {activeTab === 'majors' && (
                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thuộc khoa</label>
                           <select value={formData.facultyId} onChange={e => setFormData({...formData, facultyId: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1">
                              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã ngành</label>
                           <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên ngành</label>
                           <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1" />
                        </div>
                     </div>
                   )}

                   {activeTab === 'classes' && (
                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thuộc ngành</label>
                           <select value={formData.majorId} onChange={e => setFormData({...formData, majorId: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1">
                              {majors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên lớp học</label>
                           <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1" />
                        </div>
                     </div>
                   )}

                   <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3">
                      <span>{editingItem ? 'Cập nhật' : 'Xác nhận thêm'}</span>
                      <ChevronRight size={18} />
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Classes;
