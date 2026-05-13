import { useState, useEffect, useMemo } from 'react';
import { X, Save, Book, Search, Plus, List, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

interface SubjectFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  majorId: number;
  semesters: any[];
  onSuccess: () => void;
}

const SubjectFormPanel = ({ onClose, initialData, majorId, semesters, onSuccess }: SubjectFormPanelProps) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'select' | 'manual'>(initialData?.id ? 'select' : 'select');

  const [formData, setFormData] = useState({
    semesterId: initialData?.semesterId || '',
    subjectId: initialData?.subjectId || '',
    isRequired: initialData?.isRequired !== undefined ? initialData.isRequired : true,
    prerequisiteSubjectId: initialData?.prerequisiteSubjectId || '',
    displayOrder: initialData?.displayOrder || 0,
    // Manual input fields
    customCode: '',
    customName: '',
    customCredits: 3
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsFetching(true);
    try {
      // Subjects list is in the academic module - FIXING 404
      const res = await axios.get('/academic/subjects');
      setSubjects(res.data);
      
      // If editing, find the subject name for display
      if (initialData?.subjectId) {
        const sub = res.data.find((s: any) => s.id === initialData.subjectId);
        if (sub) setSearchQuery(sub.name);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách môn học');
    } finally {
      setIsFetching(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects.slice(0, 10);
    return subjects.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [subjects, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalSubjectId = formData.subjectId;

      // Handle manual input
      if (inputMode === 'manual') {
        const newSubRes = await axios.post('/academic/subjects', {
          code: formData.customCode,
          name: formData.customName,
          credits: formData.customCredits,
          subjectType: 'LECTURE'
        });
        finalSubjectId = newSubRes.data.id;
      }

      if (!finalSubjectId) {
        toast.error('Vui lòng chọn hoặc nhập môn học');
        setLoading(false);
        return;
      }

      // Payload matching backend expectations - FIXING 400
      const payload = {
        majorId: Number(majorId),
        semesterId: Number(formData.semesterId),
        subjectId: Number(finalSubjectId),
        isRequired: formData.isRequired,
        prerequisiteSubjectId: formData.prerequisiteSubjectId ? Number(formData.prerequisiteSubjectId) : null,
        displayOrder: Number(formData.displayOrder)
      };

      if (initialData?.id) {
        await axios.put(`/curriculum/subjects/${initialData.id}`, payload);
        toast.success('Cập nhật thành công');
      } else {
        // Use the centralized route - FIXING 400/404
        await axios.post('/curriculum/subjects', payload);
        toast.success('Thêm môn học thành công');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Book size={20} className="text-blue-600" /> {initialData?.id ? 'Sửa môn học' : 'Thêm môn học'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quản lý chương trình khung</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {/* Mode Selector */}
          {!initialData?.id && (
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button 
                type="button"
                onClick={() => setInputMode('select')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${inputMode === 'select' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={14} /> Chọn từ danh sách
              </button>
              <button 
                type="button"
                onClick={() => setInputMode('manual')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${inputMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Plus size={14} /> Nhập thủ công
              </button>
            </div>
          )}

          {/* Semester selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ gán vào</label>
            <div className="relative">
              <select 
                value={formData.semesterId}
                onChange={e => setFormData({ ...formData, semesterId: e.target.value })}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              >
                <option value="">--- Chọn học kỳ ---</option>
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>Học kỳ {sem.semesterNumber}</option>
                ))}
              </select>
            </div>
          </div>

          {inputMode === 'select' ? (
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tìm kiếm môn học</label>
              <div className="relative">
                {isFetching ? (
                  <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />
                ) : (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                )}
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  disabled={!!initialData?.id}
                  placeholder="Nhập tên hoặc mã môn học..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                />
              </div>
              
              <AnimatePresence>
                {isDropdownOpen && filteredSubjects.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                  >
                    {filteredSubjects.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, subjectId: sub.id });
                          setSearchQuery(sub.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-6 py-4 text-left hover:bg-blue-50 transition-colors flex flex-col gap-1 ${formData.subjectId === sub.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-black text-slate-900">{sub.name}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase tracking-tighter">{sub.code}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.credits} tín chỉ • {sub.subjectType}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Mã môn học mới</label>
                <input 
                  required
                  value={formData.customCode}
                  onChange={e => setFormData({ ...formData, customCode: e.target.value.toUpperCase() })}
                  placeholder="VD: CNTT101"
                  className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Tên môn học mới</label>
                <input 
                  required
                  value={formData.customName}
                  onChange={e => setFormData({ ...formData, customName: e.target.value })}
                  placeholder="VD: Lập trình nâng cao"
                  className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Số tín chỉ</label>
                <input 
                  type="number"
                  required
                  value={formData.customCredits}
                  onChange={e => setFormData({ ...formData, customCredits: Number(e.target.value) })}
                  className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>
          )}

          {/* Prerequisite */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn tiên quyết (Nếu có)</label>
            <div className="relative">
              <select 
                value={formData.prerequisiteSubjectId}
                onChange={e => setFormData({ ...formData, prerequisiteSubjectId: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
              >
                <option value="">--- Không có ---</option>
                {subjects.filter(s => s.id !== Number(formData.subjectId)).map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Required status */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Loại môn học</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Bắt buộc hay tự chọn</p>
             </div>
             <button 
               type="button"
               onClick={() => setFormData({ ...formData, isRequired: !formData.isRequired })}
               className={`h-7 w-14 rounded-full p-1 transition-all flex items-center ${
                 formData.isRequired ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
               }`}
             >
                <div className="h-5 w-5 rounded-full bg-white shadow-md" />
             </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thứ tự hiển thị</label>
            <input 
              type="number"
              value={formData.displayOrder}
              onChange={e => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="pt-6">
             <button 
               type="submit"
               disabled={loading}
               className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
             >
                {loading ? (
                   <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                   <>
                      <Save size={20} /> Lưu thay đổi
                   </>
                )}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SubjectFormPanel;
