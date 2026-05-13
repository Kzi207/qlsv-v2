import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Save, 
  BookOpen, 
  AlertCircle,
  FileText,
  Calculator,
  CheckCircle2,
  FileUp,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const GradeManagement = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [subject, setSubject] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAssignments, setFetchingAssignments] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setFetchingAssignments(true);
      const res = await axios.get('/grades/assignments');
      setAssignments(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách học phần phân công');
    } finally {
      setFetchingAssignments(false);
    }
  };

  const handleAssignmentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedAssignment(null);
      setSelectedClass('');
      setSelectedSemester('');
      setSubject('');
      setStudents([]);
      return;
    }

    const assignment = JSON.parse(val);
    setSelectedAssignment(assignment);
    setSelectedClass(assignment.classId);
    setSelectedSemester(assignment.semesterId);
    setSubject(assignment.subject);
    
    // Automatically fetch students for this assignment
    fetchStudentsForAssignment(assignment);
  };

  const fetchStudentsForAssignment = async (assignment: any) => {
    setLoading(true);
    try {
      const res = await axios.get('/grades/class', {
        params: { 
          classId: assignment.classId, 
          subject: assignment.subject, 
          semesterId: assignment.semesterId 
        }
      });
      
      const formatted = res.data.map((s: any) => ({
        ...s,
        processScore: s.grade?.processScore ?? '',
        midtermScore: s.grade?.midtermScore ?? '',
        finalScore: s.grade?.finalScore ?? ''
      }));
      
      setStudents(formatted);
    } catch (error) {
      toast.error('Lỗi tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (id: number, field: string, value: string) => {
    const val = value === '' ? '' : parseFloat(value);
    if (val !== '' && (isNaN(val) || val < 0 || val > 10)) return;

    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    if (!subject || !selectedSemester) return;
    
    setSaving(true);
    try {
      const gradesData = students.map(s => ({
        studentId: s.id,
        midtermScore: s.midtermScore === '' ? 0 : parseFloat(s.midtermScore),
        finalScore: s.finalScore === '' ? 0 : parseFloat(s.finalScore)
      }));

      await axios.post('/grades/bulk', {
        subject,
        semesterId: selectedSemester,
        grades: gradesData
      });

      toast.success('Đã lưu điểm thành công');
      fetchStudentsForAssignment(selectedAssignment);
    } catch (error) {
      toast.error('Lỗi khi lưu điểm');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = (m: any, f: any) => {
    const mVal = parseFloat(m) || 0;
    const fVal = parseFloat(f) || 0;
    const total = (mVal * 0.4) + (fVal * 0.6);
    return Math.round(total * 100) / 100;
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !students.length) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        let updatedCount = 0;
        const newStudents = [...students];

        jsonData.forEach((row: any) => {
          // Normalize keys (handle Vietnamese or English headers)
          const mssv = row['MSSV'] || row['student_code'] || row['Mã sinh viên'];
          const midterm = row['Giữa kỳ'] || row['Midterm'] || row['GK2'];
          const final = row['Cuối kỳ'] || row['Final'] || row['CK'];

          if (mssv) {
            const studentIdx = newStudents.findIndex(s => s.student_code === String(mssv));
            if (studentIdx !== -1) {
              if (midterm !== undefined) newStudents[studentIdx].midtermScore = midterm;
              if (final !== undefined) newStudents[studentIdx].finalScore = final;
              updatedCount++;
            }
          }
        });

        setStudents(newStudents);
        toast.success(`Đã cập nhật điểm cho ${updatedCount} sinh viên từ file Excel`);
      } catch (error) {
        toast.error('Lỗi khi đọc file Excel');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    if (!students.length) {
      toast.error('Vui lòng lấy danh sách sinh viên trước để tải mẫu');
      return;
    }

    const templateData = students.map(s => ({
      'MSSV': s.student_code,
      'Họ và tên': s.name,
      'Giữa kỳ': s.midtermScore,
      'Cuối kỳ': s.finalScore
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DiemHocPhan");
    XLSX.writeFile(wb, `Mau_Nhap_Diem_${subject}_${selectedClass}.xlsx`);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
             <Calculator size={12} /> Hệ thống quản lý điểm số
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight text-gradient">Nhập điểm học phần</h1>
          <p className="text-slate-500 font-bold text-sm">Hệ thống tính điểm theo tỷ lệ: Giữa kỳ (40%) và Cuối kỳ (60%).</p>
        </div>
      </div>

      {/* Assignment Selector */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/20">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 items-end">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
               <BookOpen size={14} className="text-blue-500" /> Chọn học phần đang giảng dạy
            </label>
            <select 
              onChange={handleAssignmentSelect}
              value={selectedAssignment ? JSON.stringify(selectedAssignment) : ''}
              disabled={fetchingAssignments}
              className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer hover:bg-slate-100/50"
            >
              <option value="">{fetchingAssignments ? 'Đang tải danh sách...' : '--- Nhấp để chọn học phần từ thời khóa biểu ---'}</option>
              {assignments.map((a, idx) => (
                <option key={idx} value={JSON.stringify(a)}>
                  {a.subject || '(Chưa có tên môn)'} - Lớp {a.classId} ({a.semesterId})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedAssignment && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-6 flex flex-wrap gap-4"
           >
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Users size={12} /> Lớp: {selectedClass}
              </div>
              <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <FileText size={12} /> Môn: {subject}
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <CheckCircle2 size={12} /> Học kỳ: {selectedSemester}
              </div>
           </motion.div>
        )}

        {students.length > 0 && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between"
           >
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all"
                 >
                    <FileUp size={16} /> Nhập từ Excel
                 </button>
                 <button 
                   onClick={downloadTemplate}
                   className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                 >
                    <Download size={16} /> Tải file mẫu
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleExcelImport} 
                   accept=".xlsx, .xls" 
                   className="hidden" 
                 />
              </div>
              
              <div className="flex items-center gap-2 text-slate-400">
                 <AlertCircle size={14} />
                 <span className="text-[10px] font-bold italic">Lưu ý: File Excel phải có cột MSSV để hệ thống tự động khớp dữ liệu.</span>
              </div>
           </motion.div>
        )}
      </div>

      {/* Main Table */}
      <AnimatePresence mode="wait">
        {loading ? (
           <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-xl">
              <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải danh sách sinh viên...</p>
           </motion.div>
        ) : students.length > 0 ? (
          <motion.div 
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-16 text-center">STT</th>
                        <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Sinh viên</th>
                        <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-40">Giữa kỳ (40%)</th>
                        <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-40">Cuối kỳ (60%)</th>
                        <th className="p-6 text-center text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 w-40 bg-blue-50/30">Tổng kết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-6 text-center font-black text-slate-400 text-xs">{idx + 1}</td>
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs shadow-sm">
                                {s.name[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 leading-tight">{s.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.student_code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <input 
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={s.midtermScore}
                              onChange={e => handleScoreChange(s.id, 'midtermScore', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={s.finalScore}
                              onChange={e => handleScoreChange(s.id, 'finalScore', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                            />
                          </td>
                          <td className="p-4 bg-blue-50/20">
                            <div className="text-center font-black text-blue-600 text-sm">
                              {calculateTotal(s.midtermScore, s.finalScore).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/40 active:scale-95 disabled:opacity-50"
              >
                <Save size={20} />
                <span>{saving ? 'Đang lưu...' : 'Lưu tất cả điểm số'}</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center space-y-6 shadow-xl shadow-slate-200/10"
          >
            <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto border border-slate-100">
               <FileText size={48} />
            </div>
            <div className="max-w-xs mx-auto space-y-2">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Chưa chọn học phần</h3>
               <p className="text-sm font-bold text-slate-400">Vui lòng chọn một học phần được phân công ở phía trên để bắt đầu nhập điểm cho sinh viên.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GradeManagement;
