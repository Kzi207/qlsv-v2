import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  BookOpen, 
  Plus, 
  Download,
  Layers,
  Menu,
  X,
  Edit3,
  Search,
  Save
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

  const [activeTab, setActiveTab] = useState<'roadmap' | 'subjects'>('roadmap');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  // Subject Manager State
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogSubject, setEditingCatalogSubject] = useState<any>(null);
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
    fetchAllSubjects();
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
         if (res.data[0].majors.length > 0) setSelectedMajorId(res.data[0].majors[0].id);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách khoa');
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const res = await axios.get('/academic/subjects');
      setAllSubjects(res.data);
    } catch (error) {
      toast.error('Lỗi tải danh mục môn học');
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

  // Roadmap Handlers
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

  // Catalog Handlers
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
      fetchAllSubjects();
    } catch (error) {
      toast.error('Lỗi khi lưu môn học');
    }
  };

  const openCatalogModal = (subject: any = null) => {
    if (subject) {
      setEditingCatalogSubject(subject);
      setCatalogFormData({
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        pricePerCredit: subject.pricePerCredit,
        theoryPeriods: subject.theoryPeriods,
        practicePeriods: subject.practicePeriods,
        subjectType: subject.subjectType
      });
    } else {
      setEditingCatalogSubject(null);
      setCatalogFormData({
        code: '',
        name: '',
        credits: 3,
        pricePerCredit: 500000,
        theoryPeriods: 30,
        practicePeriods: 0,
        subjectType: 'LECTURE'
      });
    }
    setIsCatalogModalOpen(true);
  };

  const filteredCatalogSubjects = allSubjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Faculty Handlers
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

  // Major Handlers
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
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-[60] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
                <Menu size={20} />
             </button>
             <h1 className="font-black text-slate-900 uppercase text-sm tracking-tighter flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" /> Quản lý Chương trình khung
             </h1>
          </div>
          
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl hidden md:flex">
             <button 
               onClick={() => setActiveTab('roadmap')}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'roadmap' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
             >
                Lộ trình đào tạo
             </button>
             <button 
               onClick={() => setActiveTab('subjects')}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'subjects' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
             >
                Danh mục môn học
             </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === 'roadmap' && (
          <FacultyMajorSidebar 
            faculties={faculties}
            selectedMajorId={selectedMajorId}
            onSelectMajor={setSelectedMajorId}
            isOpen={isSidebarOpen}
            isAdmin={isAdmin}
            onAddFaculty={() => { setEditingFaculty(null); setFacultyForm({ name: '' }); setIsFacultyModalOpen(true); }}
            onEditFaculty={(f) => { setEditingFaculty(f); setFacultyForm({ name: f.name }); setIsFacultyModalOpen(true); }}
            onDeleteFaculty={handleDeleteFaculty}
            onAddMajor={(fId) => { setEditingMajor(null); setMajorForm({ name: '', code: '', facultyId: fId }); setIsMajorModalOpen(true); }}
            onEditMajor={(m) => { setEditingMajor(m); setMajorForm({ name: m.name, code: m.code, facultyId: m.facultyId }); setIsMajorModalOpen(true); }}
            onDeleteMajor={handleDeleteMajor}
          />
        )}

        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {activeTab === 'roadmap' ? (
            <>
              <div className="p-4 md:p-8 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                     <Layers size={14} /> {curriculum?.faculty?.name}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {curriculum?.name || 'Đang tải...'}
                  </h2>
                </div>
                
                <CreditSummary curriculum={curriculum} />
                
                <div className="flex items-center gap-3">
                   <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                      <Download size={14} /> Xuất PDF
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <SemesterGrid 
                    curriculum={curriculum}
                    isAdmin={isAdmin}
                    onAdd={handleAddSubject}
                    onEdit={handleEditSubject}
                    onDelete={handleDeleteSubject}
                    onAddSemester={handleAddSemester}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
               <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Danh mục môn học</h2>
                     <p className="text-slate-500 font-bold text-sm">Quản lý thông tin gốc của toàn bộ môn học trong hệ thống.</p>
                  </div>
                  <button 
                    onClick={() => openCatalogModal()}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2"
                  >
                     <Plus size={18} /> Thêm môn học
                  </button>
               </div>

               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="relative w-full md:w-96">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                       type="text" 
                       placeholder="Tìm mã hoặc tên môn học..."
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                     />
                  </div>
                  <div className="px-6 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                     Tổng số: {allSubjects.length} môn
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCatalogSubjects.map(s => (
                    <motion.div key={s.id} layout className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-2xl transition-all group relative">
                       <div className="flex justify-between items-start mb-6">
                          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-600">
                             <span className="text-lg font-black">{s.credits}</span>
                             <span className="text-[7px] font-black uppercase tracking-tighter">Tín chỉ</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => openCatalogModal(s)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600"><Edit3 size={16}/></button>
                          </div>
                       </div>
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">{s.name}</h4>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.code}</p>
                       <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-[8px] font-black uppercase text-slate-400">
                          <span>{s.subjectType}</span>
                          <span className="text-emerald-600">{s.pricePerCredit.toLocaleString()}đ/TC</span>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          )}
        </main>

        {/* Modals */}
        <AnimatePresence>
          {/* Faculty Modal */}
          {isFacultyModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFacultyModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">{editingFaculty ? 'Sửa tên khoa' : 'Thêm khoa mới'}</h3>
                  <form onSubmit={handleSaveFaculty} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên khoa</label>
                        <input required value={facultyForm.name} onChange={e => setFacultyForm({name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none mt-1" />
                     </div>
                     <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Xác nhận</button>
                  </form>
               </motion.div>
            </div>
          )}

          {/* Major Modal */}
          {isMajorModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMajorModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-sm relative z-10 p-8 shadow-2xl">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">{editingMajor ? 'Sửa ngành' : 'Thêm ngành mới'}</h3>
                  <form onSubmit={handleSaveMajor} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã ngành</label>
                        <input required value={majorForm.code} onChange={e => setMajorForm({...majorForm, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none mt-1" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên ngành</label>
                        <input required value={majorForm.name} onChange={e => setMajorForm({...majorForm, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none mt-1" />
                     </div>
                     <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Xác nhận</button>
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCatalogModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingCatalogSubject ? 'Sửa môn học' : 'Thêm môn học'}</h3>
                     <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleCatalogSubmit} className="p-8 space-y-6">
                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã môn học</label>
                           <input required value={catalogFormData.code} onChange={e => setCatalogFormData({...catalogFormData, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên môn học</label>
                           <input required value={catalogFormData.name} onChange={e => setCatalogFormData({...catalogFormData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tín chỉ</label>
                             <input type="number" required value={catalogFormData.credits} onChange={e => setCatalogFormData({...catalogFormData, credits: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá/TC</label>
                             <input type="number" required value={catalogFormData.pricePerCredit} onChange={e => setCatalogFormData({...catalogFormData, pricePerCredit: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
                          </div>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
                        <Save size={18} /> {editingCatalogSubject ? 'Lưu thay đổi' : 'Xác nhận thêm'}
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
