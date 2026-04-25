import React, { useState, useEffect } from "react";
import { X, Save, Search, Trash2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { PERIODS } from "../../utils/timetable";
import axios from "../../api/axios";
import toast from "react-hot-toast";

interface TimetableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onDelete?: (id: number) => void;
  initialData?: any;
  currentWeekDate?: Date;
  isAdmin?: boolean;
}

const TimetableFormModal: React.FC<TimetableFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  currentWeekDate,
  isAdmin = true
}) => {
  const [formData, setFormData] = useState({
    subject: "",
    teacher: "",
    room: "",
    day: 2,
    startPeriod: 1,
    endPeriod: 2,
    classId: "",
    semesterId: "",
    type: "offline",
    startDate: new Date().toISOString().split('T')[0]
  });

  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [availableRoomNames, setAvailableRoomNames] = useState<string[]>([]);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [suggestedSubjects, setSuggestedSubjects] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [semesterNumber, setSemesterNumber] = useState(1);

  const fetchSuggestions = async () => {
    if (!formData.classId) {
      toast.error('Vui lòng chọn lớp trước');
      return;
    }
    
    // Lấy lớp đầu tiên nếu là gộp lớp
    const primaryClass = formData.classId.split(' + ')[0];

    try {
      setLoadingSuggestions(true);
      const res = await axios.get('/timetable/suggest-subjects', {
        params: {
          classId: primaryClass,
          semesterNumber: semesterNumber
        }
      });
      setSuggestedSubjects(res.data.subjects);
      if (res.data.subjects.length === 0) {
        toast.error('Không tìm thấy môn học nào cho học kỳ này trong chương trình khung');
      } else {
        toast.success(`Đã tìm thấy ${res.data.subjects.length} môn học từ ngành ${res.data.major}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi lấy gợi ý');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (formData.day && formData.startPeriod && formData.endPeriod) {
      checkAvailableRooms();
    }
  }, [formData.day, formData.startPeriod, formData.endPeriod, formData.startDate]);

  const checkAvailableRooms = async () => {
    try {
      const res = await axios.get('/rooms/available', {
        params: {
          day: formData.day,
          startPeriod: formData.startPeriod,
          endPeriod: formData.endPeriod,
          date: formData.startDate
        }
      });
      setAvailableRoomNames(res.data.map((r: any) => r.name));
    } catch (error) {}
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen) {
       fetchMetadata();
    }
  }, [isOpen]);

  const fetchMetadata = async () => {
    try {
      const [semRes, clsRes, lecRes, roomRes] = await Promise.all([
        axios.get('/semesters'),
        axios.get('/classes'),
        axios.get('/timetable/lecturers'),
        axios.get('/rooms')
      ]);
      setSemesters(semRes.data);
      setClasses(clsRes.data);
      setLecturers(lecRes.data);
      setRooms(roomRes.data);
      if (!initialData) {
         // Calculate Monday of the selected week
         const baseDate = new Date(currentWeekDate || new Date());
         const dayOfWeek = baseDate.getDay();
         const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
         baseDate.setDate(baseDate.getDate() + diffToMonday);
         
         const defaultStartDate = baseDate.toISOString().split('T')[0];

         setFormData(prev => ({ 
           ...prev, 
           semesterId: semRes.data[0]?.name || '',
           classId: clsRes.data[0]?.name || '',
           teacher: lecRes.data[0]?.name || '',
           room: roomRes.data[0]?.name || '',
           startDate: defaultStartDate,
           day: 2
         }));
      }
    } catch (error) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
         <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {initialData ? 'Cập nhật lịch học' : 'Tạo lịch học mới'}
               </h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Thông tin chi tiết thời khóa biểu</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400"><X size={24}/></button>
         </div>

         <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
            <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-blue-600" />
                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Gợi ý từ chương trình khung</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <select 
                          value={semesterNumber}
                          onChange={(e) => setSemesterNumber(parseInt(e.target.value))}
                          className="px-3 py-1 bg-white border border-blue-100 rounded-lg text-[10px] font-black outline-none"
                        >
                           {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => (
                             <option key={n} value={n}>Học kỳ {n}</option>
                           ))}
                        </select>
                        <button 
                          onClick={fetchSuggestions}
                          disabled={loadingSuggestions}
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                           {loadingSuggestions ? 'Đang lấy...' : 'Lấy môn học'}
                        </button>
                    </div>
                </div>

                {suggestedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100/50">
                        {suggestedSubjects.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => setFormData({...formData, subject: s.name})}
                                className="px-3 py-1.5 bg-white border border-blue-100 rounded-xl text-[9px] font-black text-blue-600 uppercase tracking-tight hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            >
                                {s.name} ({s.credits}TC)
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên môn học</label>
               <input 
                 type="text" 
                 value={formData.subject} 
                 onChange={e => setFormData({...formData, subject: e.target.value})}
                 placeholder="Nhập hoặc chọn môn học gợi ý bên trên..."
                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
               />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Học kỳ</label>
                  <select 
                    value={formData.semesterId} 
                    onChange={e => setFormData({...formData, semesterId: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Hình thức</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                     <option value="offline">Trực tiếp (Offline)</option>
                     <option value="online">Trực tuyến (Online)</option>
                     <option value="hybrid">Kết hợp (Hybrid)</option>
                  </select>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Lớp học (Chọn để gộp lớp)</label>
                  <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       type="text" 
                       placeholder="Tìm lớp..."
                       value={classSearchQuery}
                       onChange={e => setClassSearchQuery(e.target.value)}
                       className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-blue-500 w-40"
                     />
                  </div>
               </div>
               <div className="flex flex-wrap gap-2 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] min-h-[80px] max-h-[200px] overflow-y-auto custom-scrollbar">
                  {classes.filter(c => c.name.toLowerCase().includes(classSearchQuery.toLowerCase())).map(c => {
                    const selectedClasses = formData.classId.split(' + ').filter(Boolean);
                    const isSelected = selectedClasses.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          let newClasses;
                          if (isSelected) {
                            newClasses = selectedClasses.filter(name => name !== c.name);
                          } else {
                            newClasses = [...selectedClasses, c.name];
                          }
                          setFormData({ ...formData, classId: newClasses.join(' + ') });
                        }}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 -translate-y-1' 
                            : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200 hover:text-blue-500 hover:shadow-lg'
                        } ${!isAdmin ? 'pointer-events-none' : ''}`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Giảng viên</label>
                  <select 
                    value={formData.teacher} 
                    onChange={e => setFormData({...formData, teacher: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     <option value="">Chọn giảng viên...</option>
                     {lecturers.map(l => <option key={l.username} value={l.name}>{l.name} ({l.username})</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Phòng học</label>
                  <select 
                    value={formData.room} 
                    onChange={e => setFormData({...formData, room: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     <option value="">Chọn phòng...</option>
                     {rooms.map(r => {
                       const isAvailable = availableRoomNames.includes(r.name);
                       return (
                         <option key={r.id} value={r.name} className={isAvailable ? 'text-emerald-600' : 'text-slate-400'}>
                           {r.name} {isAvailable ? '(Trống)' : '(Bận)'}
                         </option>
                       );
                     })}
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Ngày học</label>
                    <input 
                      type="date" 
                      value={formData.startDate} 
                      onChange={e => {
                         const date = e.target.value;
                         const jsDay = new Date(date).getDay();
                         const timetableDay = jsDay === 0 ? 8 : jsDay + 1;
                         setFormData({...formData, startDate: date, day: timetableDay});
                      }}
                      disabled={!isAdmin}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all focus:bg-white disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Thứ (Tự động)</label>
                   <div className="w-full px-5 py-4 bg-slate-100/50 border border-slate-100 rounded-2xl font-black text-blue-600 text-sm flex items-center gap-2">
                      <Clock size={16} />
                      {formData.day === 8 ? 'Chủ Nhật' : `Thứ ${formData.day}`}
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Từ tiết</label>
                  <select 
                    value={formData.startPeriod} 
                    onChange={e => setFormData({...formData, startPeriod: parseInt(e.target.value)})}
                    disabled={!isAdmin}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {PERIODS.map(p => <option key={p.id} value={p.id}>Tiết {p.id}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Đến tiết</label>
                  <select 
                    value={formData.endPeriod} 
                    onChange={e => setFormData({...formData, endPeriod: parseInt(e.target.value)})}
                    disabled={!isAdmin}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {PERIODS.map(p => <option key={p.id} value={p.id}>Tiết {p.id}</option>)}
                  </select>
               </div>
            </div>
         </div>

         <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={onClose} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Hủy bỏ</button>
               {initialData && onDelete && (
                  <button 
                    onClick={() => {
                       if(window.confirm('Bạn có chắc muốn xóa lịch này?')) {
                          onDelete(initialData.id);
                          onClose();
                       }
                    }}
                    className="flex items-center gap-2 text-rose-500 hover:text-rose-700 text-xs font-black uppercase tracking-widest transition-colors ml-4"
                  >
                     <Trash2 size={16}/>
                     <span>Xóa lịch</span>
                  </button>
               )}
            </div>
            <button 
               onClick={() => onSubmit(formData)}
               className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
               <Save size={18}/>
               <span>{initialData ? 'Lưu thay đổi' : 'Tạo lịch học'}</span>
            </button>
         </div>
      </motion.div>
    </div>
  );
};

export default TimetableFormModal;
