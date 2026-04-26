import { useState, useEffect } from 'react';
import { X, Save, Book } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [formData, setFormData] = useState({
    semesterId: initialData?.semesterId || '',
    subjectId: initialData?.subjectId || '',
    isRequired: initialData?.isRequired !== undefined ? initialData.isRequired : true,
    prerequisiteSubjectId: initialData?.prerequisiteSubjectId || '',
    displayOrder: initialData?.displayOrder || 0
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/curriculum/subjects');
      setSubjects(res.data);
    } catch (error) {
      toast.error('Lỗi tải danh sách môn học');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await axios.put(`/curriculum/subjects/${initialData.id}`, formData);
        toast.success('Cập nhật thành công');
      } else {
        await axios.post(`/curriculum/majors/${majorId}/subjects`, formData);
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Semester selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ gán vào</label>
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

          {/* Subject selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn học</label>
            <select 
              value={formData.subjectId}
              onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
              required
              disabled={!!initialData?.id}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">--- Chọn môn học ---</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code}) - {sub.credits} TC</option>
              ))}
            </select>
          </div>

          {/* Prerequisite */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn tiên quyết (Nếu có)</label>
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

          <div className="pt-10">
             <button 
               type="submit"
               disabled={loading}
               className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
             >
                {loading ? (
                   <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
