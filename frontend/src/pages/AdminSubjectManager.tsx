import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  X,
  Save,
  Layers,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const AdminSubjectManager = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'mapping'>('catalog');
  
  // Catalog State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: 3,
    pricePerCredit: 500000,
    theoryPeriods: 30,
    practicePeriods: 0,
    subjectType: 'LECTURE'
  });
  const [globalPrice, setGlobalPrice] = useState(500000);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Mapping State
  const [classes, setClasses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [classSubjects, setClassSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [subRes, classRes, semRes] = await Promise.all([
        axios.get('/academic/subjects'),
        axios.get('/classes'),
        axios.get('/semesters')
      ]);
      setSubjects(subRes.data);
      setClasses(classRes.data);
      setSemesters(semRes.data);
      
      if (subRes.data.length > 0) {
        setGlobalPrice(subRes.data[0].pricePerCredit);
      }
      if (semRes.data.length > 0) {
        setSelectedSemester(semRes.data[0].name);
      }
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSubjects = async () => {
    if (!selectedClass || !selectedSemester) return;
    try {
      const res = await axios.get('/academic/class-subjects', {
        params: { classId: selectedClass, semesterId: selectedSemester }
      });
      setClassSubjects(res.data);
    } catch (error) {
      toast.error('Lỗi tải môn học theo lớp');
    }
  };

  useEffect(() => {
    if (activeTab === 'mapping' && selectedClass && selectedSemester) {
      fetchClassSubjects();
    }
  }, [selectedClass, selectedSemester, activeTab]);

  // Catalog Actions
  const handleUpdateGlobalPrice = async () => {
    if (!window.confirm(`Bạn có chắc muốn cập nhật đơn giá ${globalPrice.toLocaleString()}đ/TC cho TẤT CẢ các môn học?`)) return;
    try {
      setIsUpdatingPrice(true);
      await axios.put('/academic/subjects/bulk-update-price', { pricePerCredit: globalPrice });
      toast.success('Đã cập nhật đơn giá cho toàn bộ môn học');
      const res = await axios.get('/academic/subjects');
      setSubjects(res.data);
    } catch (error) {
      toast.error('Lỗi cập nhật đơn giá hàng loạt');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await axios.put(`/academic/subjects/${editingSubject.id}`, formData);
        toast.success('Cập nhật môn học thành công');
      } else {
        await axios.post('/academic/subjects', formData);
        toast.success('Thêm môn học mới thành công');
      }
      setIsModalOpen(false);
      const res = await axios.get('/academic/subjects');
      setSubjects(res.data);
    } catch (error) {
      toast.error('Lỗi khi lưu môn học');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa môn học này?')) return;
    try {
      await axios.delete(`/academic/subjects/${id}`);
      toast.success('Đã xóa môn học');
      const res = await axios.get('/academic/subjects');
      setSubjects(res.data);
    } catch (error) {
      toast.error('Lỗi khi xóa môn học');
    }
  };

  const openModal = (subject: any = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        pricePerCredit: subject.pricePerCredit,
        theoryPeriods: subject.theoryPeriods || 0,
        practicePeriods: subject.practicePeriods || 0,
        subjectType: subject.subjectType || 'LECTURE'
      });
    } else {
      setEditingSubject(null);
      setFormData({ 
        code: '', 
        name: '', 
        credits: 3, 
        pricePerCredit: globalPrice,
        theoryPeriods: 30,
        practicePeriods: 0,
        subjectType: 'LECTURE'
      });
    }
    setIsModalOpen(true);
  };

  // Mapping Actions
  const handleAssign = async (subjectId: number) => {
    try {
      await axios.post('/academic/class-subjects', {
        classId: selectedClass,
        subjectId,
        semesterId: selectedSemester
      });
      toast.success('Đã gán môn học');
      fetchClassSubjects();
    } catch (error) {
      toast.error('Lỗi khi gán môn học');
    }
  };

  const handleUnassign = async (id: number) => {
    try {
      await axios.delete(`/academic/class-subjects/${id}`);
      toast.success('Đã hủy gán môn học');
      fetchClassSubjects();
    } catch (error) {
      toast.error('Lỗi khi hủy gán');
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableSubjects = subjects.filter(s => 
    !classSubjects.some(cs => cs.subjectId === s.id) &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
              <Layers size={12} /> Quản lý đào tạo
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Môn học & Chương trình</h1>
           <p className="text-slate-500 font-bold text-sm">Quản lý danh mục môn học và phân bổ chương trình giảng dạy cho từng lớp.</p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('catalog')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Danh mục môn</button>
          <button onClick={() => setActiveTab('mapping')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'mapping' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Phân bổ theo lớp</button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-8">
           <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="flex flex-wrap gap-4 items-center">
                 <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đơn giá chung</p>
                       <div className="flex items-center gap-2">
                          <input type="number" value={globalPrice} onChange={e => setGlobalPrice(Number(e.target.value))} className="w-24 bg-transparent border-none text-sm font-black text-blue-600 focus:ring-0 p-0" />
                          <span className="text-[10px] font-bold text-slate-400">đ/TC</span>
                       </div>
                    </div>
                    <button onClick={handleUpdateGlobalPrice} disabled={isUpdatingPrice} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50">Cập nhật tất cả</button>
                 </div>
                 <button onClick={() => openModal()} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"><Plus size={18}/> Thêm môn mới</button>
              </div>
              <div className="relative w-full lg:w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input type="text" placeholder="Tìm mã hoặc tên môn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map(s => (
                <motion.div key={s.id} layout className="p-6 bg-white rounded-3xl border border-slate-100 group hover:shadow-2xl transition-all relative">
                   <div className="flex justify-between items-start mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-600">
                         <span className="text-lg font-black">{s.credits}</span>
                         <span className="text-[7px] font-black uppercase tracking-tighter">Tín chỉ</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => openModal(s)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600"><Edit3 size={16}/></button>
                         <button onClick={() => handleDelete(s.id)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button>
                      </div>
                   </div>
                   <h4 className="text-base font-black text-slate-900 uppercase tracking-tight line-clamp-1">{s.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.code}</p>
                   <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-[9px] font-black uppercase text-slate-400">
                      <span>{s.subjectType}</span>
                      <span className="text-emerald-600">{s.pricePerCredit.toLocaleString()}đ/TC</span>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-12">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row gap-6 items-end">
                 <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp học</label>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                       <option value="">--- Chọn lớp ---</option>
                       {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ</label>
                    <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                       {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                 </div>
                 <div className="relative w-full lg:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Lọc môn học..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6 min-h-[500px]">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" /> Môn học của lớp
                 </h3>
                 <div className="space-y-3">
                    {classSubjects.map(cs => (
                      <div key={cs.id} className="p-4 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between group">
                         <div>
                            <p className="text-xs font-black">{cs.subject.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{cs.subject.code} • {cs.subject.credits} TC</p>
                         </div>
                         <button onClick={() => handleUnassign(cs.id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                    ))}
                    {classSubjects.length === 0 && <div className="py-20 text-center opacity-20"><Filter size={40} className="mx-auto mb-2"/><p className="text-[10px] font-black uppercase">Chưa gán môn</p></div>}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl space-y-6">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" /> Kho môn học sẵn có
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableSubjects.map(s => (
                      <div key={s.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-white hover:shadow-lg transition-all group">
                         <div>
                            <p className="text-xs font-black text-slate-900">{s.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.code} • {s.credits} TC</p>
                         </div>
                         <button onClick={() => handleAssign(s.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Plus size={14}/></button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Catalog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingSubject ? 'Sửa môn học' : 'Thêm môn học'}</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã môn học</label>
                         <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên môn học</label>
                         <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tín chỉ</label>
                           <input type="number" required value={formData.credits} onChange={e => setFormData({...formData, credits: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá/TC</label>
                           <input type="number" required value={formData.pricePerCredit} onChange={e => setFormData({...formData, pricePerCredit: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                        </div>
                      </div>
                   </div>
                   <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3">
                      <Save size={18} /> {editingSubject ? 'Lưu thay đổi' : 'Xác nhận thêm'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSubjectManager;

