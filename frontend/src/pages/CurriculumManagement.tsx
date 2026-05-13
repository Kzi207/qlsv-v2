import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Plus, 
  Download,
  Layers,
  X,
  Search,
  Save,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

// Sub-components
import FacultyMajorSidebar from '../components/curriculum/FacultyMajorSidebar.tsx';
import SemesterGrid from '../components/curriculum/SemesterGrid.tsx';
import CreditSummary from '../components/curriculum/CreditSummary.tsx';
import SubjectFormPanel from '../components/curriculum/SubjectFormPanel.tsx';

const CurriculumManagement = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'QTV';

  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  // Subject Manager State

  const [searchTerm, setSearchTerm] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogSubject] = useState<any>(null);
  const [catalogFormData, setCatalogFormData] = useState({
    code: '',
    name: '',
    credits: 3,
    pricePerCredit: 500000,
    theoryPeriods: 30,
    practicePeriods: 0,
    subjectType: 'LECTURE'
  });

  // Faculty & Major CRUD State
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [facultyForm, setFacultyForm] = useState({ name: '' });

  const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<any>(null);
  const [majorForm, setMajorForm] = useState({ name: '', code: '', facultyId: 0 });

  useEffect(() => {
    fetchFaculties();
    
    const handleResize = () => {
      // Logic removed as isSidebarOpen was unused
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (selectedMajorId) {
      fetchCurriculum(selectedMajorId);
    }
  }, [selectedMajorId]);

  const fetchFaculties = async () => {
    try {
      const res = await axios.get('/curriculum/faculties');
      setFaculties(res.data);
      if (res.data.length > 0 && !selectedMajorId) {
        const firstMajor = res.data.find((f: any) => f.majors.length > 0)?.majors[0];
        if (firstMajor) setSelectedMajorId(firstMajor.id);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách khoa');
    }
  };


  const fetchCurriculum = async (majorId: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/curriculum/majors/${majorId}/curriculum`);
      setCurriculum(res.data);
    } catch (error) {
      toast.error('Lỗi tải chương trình khung');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = (semesterId: number) => {
    setEditingSubject({ semesterId, majorId: selectedMajorId });
    setIsFormOpen(true);
  };

  const handleEditSubject = (item: any) => {
    setEditingSubject(item);
    setIsFormOpen(true);
  };

  const handleDeleteSubject = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa môn học này khỏi chương trình khung?')) return;
    try {
      await axios.delete(`/curriculum/subjects/${id}`);
      toast.success('Đã xóa thành công');
      fetchCurriculum(selectedMajorId!);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa');
    }
  };

  const handleAddSemester = async () => {
    if (!selectedMajorId) return;
    try {
      await axios.post(`/curriculum/majors/${selectedMajorId}/semesters`);
      toast.success('Đã thêm học kỳ mới');
      fetchCurriculum(selectedMajorId);
    } catch (error) {
      toast.error('Lỗi khi thêm học kỳ');
    }
  };

  const handleCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCatalogSubject) {
        await axios.put(`/academic/subjects/${editingCatalogSubject.id}`, catalogFormData);
        toast.success('Cập nhật thành công');
      } else {
        await axios.post('/academic/subjects', catalogFormData);
        toast.success('Thêm mới thành công');
      }
      setIsCatalogModalOpen(false);

    } catch (error) {
      toast.error('Lỗi khi lưu môn học');
    }
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await axios.put(`/curriculum/faculties/${editingFaculty.id}`, facultyForm);
        toast.success('Cập nhật khoa thành công');
      } else {
        await axios.post('/curriculum/faculties', facultyForm);
        toast.success('Thêm khoa mới thành công');
      }
      setIsFacultyModalOpen(false);
      fetchFaculties();
    } catch (error) {
      toast.error('Lỗi khi lưu khoa');
    }
  };

  const handleDeleteFaculty = async (id: number) => {
    if (!window.confirm('Xóa khoa sẽ xóa toàn bộ ngành và chương trình liên quan. Bạn có chắc?')) return;
    try {
      await axios.delete(`/curriculum/faculties/${id}`);
      toast.success('Đã xóa khoa');
      fetchFaculties();
    } catch (error) {
      toast.error('Lỗi khi xóa khoa');
    }
  };

  const handleSaveMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMajor) {
        await axios.put(`/curriculum/majors/${editingMajor.id}`, majorForm);
        toast.success('Cập nhật ngành thành công');
      } else {
        await axios.post('/curriculum/majors', majorForm);
        toast.success('Thêm ngành mới thành công');
      }
      setIsMajorModalOpen(false);
      fetchFaculties();
    } catch (error) {
      toast.error('Lỗi khi lưu ngành');
    }
  };

  const handleDeleteMajor = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa ngành này?')) return;
    try {
      await axios.delete(`/curriculum/majors/${id}`);
      toast.success('Đã xóa ngành');
      fetchFaculties();
    } catch (error) {
      toast.error('Lỗi khi xóa ngành');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden relative">
        <div className="hidden lg:block">
          <FacultyMajorSidebar 
              faculties={faculties}
              selectedMajorId={selectedMajorId}
              onSelectMajor={setSelectedMajorId}
              isOpen={true}
              isAdmin={isAdmin}
              onAddFaculty={() => { setEditingFaculty(null); setFacultyForm({ name: '' }); setIsFacultyModalOpen(true); }}
              onEditFaculty={(f) => { setEditingFaculty(f); setFacultyForm({ name: f.name }); setIsFacultyModalOpen(true); }}
              onDeleteFaculty={handleDeleteFaculty}
              onAddMajor={(fId) => { setEditingMajor(null); setMajorForm({ name: '', code: '', facultyId: fId }); setIsMajorModalOpen(true); }}
              onEditMajor={(m) => { setEditingMajor(m); setMajorForm({ name: m.name, code: m.code, facultyId: m.facultyId }); setIsMajorModalOpen(true); }}
              onDeleteMajor={handleDeleteMajor}
              isPermanent={true}
            />
        </div>

        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          <div className="p-4 md:p-8 lg:bg-white lg:border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
            <div className="flex flex-col gap-4 flex-1">
              {/* Mobile Always-Visible Selector with Search */}
              <div className="lg:hidden space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Tìm nhanh khoa/ngành..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                  {faculties.filter((f: any) => 
                    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    f.majors.some((m: any) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).map((f: any) => {
                    const isSelected = f.majors?.some((m: any) => m.id === selectedMajorId);
                    return (
                      <button 
                        key={f.id}
                        onClick={() => {
                          const firstMajor = f.majors?.[0];
                          if (firstMajor) setSelectedMajorId(firstMajor.id);
                        }}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                          : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
                
                {faculties.find(f => f.majors?.some((m: any) => m.id === selectedMajorId))?.majors?.length > 0 && (
                  <div className="flex overflow-x-auto gap-2 no-scrollbar">
                    {faculties.find(f => f.majors?.some((m: any) => m.id === selectedMajorId))?.majors.map((m: any) => (
                      <button 
                        key={m.id}
                        onClick={() => setSelectedMajorId(m.id)}
                        className={`shrink-0 px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                          selectedMajorId === m.id 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Layers size={14} className="shrink-0" /> 
                    <span className="truncate">{curriculum?.faculty?.name || 'Vui lòng chọn ngành'}</span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
                    {curriculum?.name || 'Chương trình đào tạo'}
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-8 shrink-0">
              <CreditSummary curriculum={curriculum} />
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all w-full sm:w-auto justify-center">
                <Download size={14} /> Xuất PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
              </div>
            ) : curriculum && (curriculum.curriculumSemesters?.length > 0 || isAdmin) ? (
              <SemesterGrid 
                curriculum={curriculum}
                isAdmin={isAdmin}
                onAdd={handleAddSubject}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
                onAddSemester={handleAddSemester}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center py-20">
                <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                  <Grid size={40} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Chưa có chương trình</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">
                  Ngành học này hiện chưa được thiết lập chương trình khung hoặc học kỳ.
                </p>
                {isAdmin && (
                  <button 
                    onClick={handleAddSemester}
                    className="mt-8 px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3"
                  >
                    <Plus size={16} /> Thiết lập học kỳ đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <button 
              onClick={handleAddSemester}
              className="lg:hidden fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center active:scale-95 transition-all z-[80]"
              title="Thêm học kỳ"
            >
              <Plus size={28} />
            </button>
          )}
        </main>

        <AnimatePresence>
          {isFacultyModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFacultyModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div 
                 initial={{ y: 100, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 exit={{ y: 100, opacity: 0 }} 
                 className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl"
               >
                  <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 sm:hidden" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">{editingFaculty ? 'Sửa tên khoa' : 'Thêm khoa mới'}</h3>
                  <form onSubmit={handleSaveFaculty} className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên khoa</label>
                        <input required value={facultyForm.name} onChange={e => setFacultyForm({name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none mt-1 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="Nhập tên khoa..." />
                     </div>
                     <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30">Lưu thông tin</button>
                  </form>
               </motion.div>
            </div>
          )}

          {isMajorModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMajorModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div 
                 initial={{ y: 100, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 exit={{ y: 100, opacity: 0 }} 
                 className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl"
               >
                  <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 sm:hidden" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">{editingMajor ? 'Sửa ngành' : 'Thêm ngành mới'}</h3>
                  <form onSubmit={handleSaveMajor} className="space-y-5">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã ngành</label>
                        <input required value={majorForm.code} onChange={e => setMajorForm({...majorForm, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none mt-1 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="Mã định danh (VD: CNTT)" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên ngành</label>
                        <input required value={majorForm.name} onChange={e => setMajorForm({...majorForm, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none mt-1 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="Nhập tên ngành đào tạo..." />
                     </div>
                     <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30">Xác nhận ngành học</button>
                  </form>
               </motion.div>
            </div>
          )}

          {isFormOpen && (
            <SubjectFormPanel 
              isOpen={isFormOpen}
              onClose={() => { setIsFormOpen(false); setEditingSubject(null); }}
              initialData={editingSubject}
              majorId={selectedMajorId!}
              semesters={curriculum?.curriculumSemesters || []}
              onSuccess={() => { fetchCurriculum(selectedMajorId!); setIsFormOpen(false); }}
            />
          )}

          {isCatalogModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCatalogModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div 
                 initial={{ y: 200, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 exit={{ y: 200, opacity: 0 }} 
                 className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md relative z-10 overflow-hidden shadow-2xl h-[90vh] sm:h-auto flex flex-col"
               >
                  <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingCatalogSubject ? 'Sửa môn học hệ thống' : 'Thêm môn học hệ thống'}</h3>
                     <button onClick={() => setIsCatalogModalOpen(false)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleCatalogSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã môn học</label>
                           <input required value={catalogFormData.code} onChange={e => setCatalogFormData({...catalogFormData, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên môn học</label>
                           <input required value={catalogFormData.name} onChange={e => setCatalogFormData({...catalogFormData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số tín chỉ</label>
                             <input type="number" required value={catalogFormData.credits} onChange={e => setCatalogFormData({...catalogFormData, credits: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá/TC</label>
                             <input type="number" required value={catalogFormData.pricePerCredit} onChange={e => setCatalogFormData({...catalogFormData, pricePerCredit: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiết Lý thuyết</label>
                             <input type="number" required value={catalogFormData.theoryPeriods} onChange={e => setCatalogFormData({...catalogFormData, theoryPeriods: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiết Thực hành</label>
                             <input type="number" required value={catalogFormData.practicePeriods} onChange={e => setCatalogFormData({...catalogFormData, practicePeriods: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                          </div>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all mb-4">
                        <Save size={18} /> {editingCatalogSubject ? 'Cập nhật môn học' : 'Lưu môn học hệ thống'}
                     </button>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CurriculumManagement;
