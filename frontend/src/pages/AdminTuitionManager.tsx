import { useState, useEffect } from 'react';
import { 
  Search, 
  AlertCircle, 
  User,
  Filter,
  ArrowRight,
  DollarSign,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const AdminTuitionManager = () => {
  const [tuitions, setTuitions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [genData, setGenData] = useState({ 
    semesterId: '', 
    classId: '', 
    curriculumSemesterNumber: '' 
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes, sRes] = await Promise.all([
        axios.get('/finance/all'),
        axios.get('/classes'),
        axios.get('/semesters')
      ]);
      setTuitions(tRes.data);
      setClasses(cRes.data);
      setSemesters(sRes.data);
      if (sRes.data.length > 0) setGenData(prev => ({ ...prev, semesterId: sRes.data[0].name }));
    } catch (error) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: number) => {
    const amount = prompt('Nhập số tiền thanh toán (VNĐ):', '0');
    if (!amount || isNaN(Number(amount))) return;

    try {
      await axios.post(`/finance/pay/${id}`, { amount: Number(amount) });
      toast.success('Đã cập nhật thanh toán');
      const res = await axios.get('/finance/all');
      setTuitions(res.data);
    } catch (error) {
      toast.error('Lỗi khi cập nhật thanh toán');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genData.semesterId) return toast.error('Vui lòng chọn học kỳ');
    
    try {
      setIsGenerating(true);
      const res = await axios.post('/finance/generate-semester', genData);
      toast.success(res.data.message);
      setIsGenerateModalOpen(false);
      const tRes = await axios.get('/finance/all');
      setTuitions(tRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi khởi tạo học phí');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTuitions = tuitions.filter(t => {
    const matchesSearch = t.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.student.student_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
             <DollarSign size={12} /> Quản lý tài chính hệ thống
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý học phí</h1>
          <p className="text-slate-500 font-bold text-sm">Theo dõi trạng thái đóng học phí và xác nhận thanh toán cho sinh viên.</p>
        </div>

        <button 
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
        >
           <Plus size={18} />
           <span>Khởi tạo học phí học kỳ</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20 space-y-8">
         <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            <div className="relative w-full md:w-96">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Tìm theo tên hoặc MSSV..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
               />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
               <Filter className="text-slate-400 shrink-0" size={20} />
               <select 
                 value={statusFilter}
                 onChange={e => setStatusFilter(e.target.value)}
                 className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer"
               >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="UNPAID">Chưa đóng</option>
                  <option value="PARTIAL">Đóng một phần</option>
                  <option value="PAID">Đã hoàn thành</option>
               </select>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-4">
               <thead>
                  <tr className="text-left">
                     <th className="px-8 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinh viên</th>
                     <th className="px-8 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học kỳ</th>
                     <th className="px-8 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền</th>
                     <th className="px-8 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã đóng</th>
                     <th className="px-8 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                     <th className="px-8 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredTuitions.map(t => (
                      <motion.tr 
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white hover:bg-slate-50/50 transition-all group"
                      >
                         <td className="px-8 py-6 rounded-l-[2rem] border-y border-l border-slate-100">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><User size={20} /></div>
                               <div>
                                  <p className="text-sm font-black text-slate-900 leading-tight">{t.student.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.student.student_code}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6 border-y border-slate-100 font-bold text-sm text-slate-600">{t.semesterId}</td>
                         <td className="px-8 py-6 border-y border-slate-100 font-black text-sm text-slate-900">{t.totalAmount.toLocaleString('vi-VN')}đ</td>
                         <td className="px-8 py-6 border-y border-slate-100 font-black text-sm text-emerald-600">{t.paidAmount.toLocaleString('vi-VN')}đ</td>
                         <td className="px-8 py-6 border-y border-slate-100 text-center">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                               t.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                               t.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                               {t.status === 'PAID' ? 'Hoàn thành' : t.status === 'PARTIAL' ? 'Một phần' : 'Chưa đóng'}
                            </span>
                         </td>
                         <td className="px-8 py-6 rounded-r-[2rem] border-y border-r border-slate-100 text-right">
                            <button 
                              onClick={() => handlePay(t.id)}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-slate-900/20"
                            >
                               Cập nhật thanh toán
                            </button>
                         </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
               </tbody>
            </table>
            
            {filteredTuitions.length === 0 && !loading && (
               <div className="py-20 text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto"><AlertCircle size={32} /></div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Không tìm thấy dữ liệu học phí</p>
               </div>
            )}
         </div>
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGenerateModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Khởi tạo học phí</h3>
                   <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                </div>
                <form onSubmit={handleGenerate} className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ hệ thống (HK hiện tại)</label>
                         <select 
                           required
                           value={genData.semesterId} 
                           onChange={e => setGenData({...genData, semesterId: e.target.value})} 
                           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1"
                         >
                            <option value="">--- Chọn học kỳ ---</option>
                            {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                         </select>
                      </div>

                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ khung (Học kỳ 1-13)</label>
                         <select 
                           value={genData.curriculumSemesterNumber} 
                           onChange={e => setGenData({...genData, curriculumSemesterNumber: e.target.value})} 
                           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1"
                         >
                            <option value="">--- Lấy theo CT khung (Tùy chọn) ---</option>
                            {[...Array(13)].map((_, i) => (
                               <option key={i+1} value={i+1}>Học kỳ {i+1}</option>
                            ))}
                         </select>
                      </div>

                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp học (Tùy chọn)</label>
                         <select 
                           value={genData.classId} 
                           onChange={e => setGenData({...genData, classId: e.target.value})} 
                           className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 mt-1"
                         >
                            <option value="">Tất cả các lớp</option>
                            {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                         </select>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                         <p className="text-[10px] font-bold text-blue-600 uppercase leading-relaxed">
                            <AlertCircle size={12} className="inline mb-0.5 mr-1" />
                            Hệ thống sẽ lấy danh sách môn học từ Chương trình khung của Ngành tương ứng với Học kỳ khung bạn chọn để tính học phí.
                         </p>
                      </div>
                   </div>

                   <button 
                     type="submit" 
                     disabled={isGenerating}
                     className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                      <span>{isGenerating ? 'Đang khởi tạo...' : 'Xác nhận khởi tạo'}</span>
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTuitionManager;
