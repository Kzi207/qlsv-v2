import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Trash2, Clock, Plus, Calendar, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERIODS } from '../../utils/timetable';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

interface TimetableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onDelete?: (id: number) => void;
  initialData?: any;
  currentWeekDate?: Date;
  isAdmin?: boolean;
}

const getMondayOfWeek = (baseDate: Date) => {
  const d = new Date(baseDate);
  const dayOfWeek = d.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  d.setDate(d.getDate() + diffToMonday);
  return d;
};

const getDateForDay = (monday: Date, timetableDay: number) => {
  const d = new Date(monday);
  const offset = timetableDay === 8 ? 6 : timetableDay - 2;
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const TimetableFormModal: React.FC<TimetableFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  currentWeekDate,
  isAdmin
}) => {
  const defaultWeekStart = useMemo(() => getMondayOfWeek(currentWeekDate || new Date()), [currentWeekDate]);
  
  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    room: '',
    day: 2,
    startPeriod: 1,
    endPeriod: 2,
    classId: '',
    semesterId: '',
    type: 'offline',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [batchItems, setBatchItems] = useState<any[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [availableRoomNames, setAvailableRoomNames] = useState<string[]>([]);
  const [suggestedSubjects, setSuggestedSubjects] = useState<any[]>([]);
  const [semesterNumber] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const fetchSuggestions = async (classIdOverride?: string) => {
    const selectedClassId = classIdOverride || formData.classId;
    if (!selectedClassId) return;

    const primaryClass = selectedClassId.split(' + ')[0];
    try {
      const res = await axios.get('/timetable/suggest-subjects', {
        params: { classId: primaryClass, semesterNumber }
      });
      setSuggestedSubjects(res.data.subjects);
    } catch (error: any) {
      toast.error('Lỗi khi lấy gợi ý môn học');
    }
  };

  useEffect(() => {
    if (formData.day && formData.startPeriod && formData.endPeriod) {
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
      checkAvailableRooms();
    }
  }, [formData.day, formData.startPeriod, formData.endPeriod, formData.startDate]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setIsBatchMode(false);
    }
  }, [initialData]);

  const fetchMetadata = React.useCallback(async () => {
    try {
      const [semRes, clsRes, lecRes, roomRes] = await Promise.all([
        axios.get('/semesters'),
        axios.get('/classes'),
        axios.get('/timetable/lecturers'),
        axios.get('/rooms')
      ]);
      setClasses(clsRes.data);
      setLecturers(lecRes.data);
      setRooms(roomRes.data);
      
      if (!initialData) {
        const defaultStartDate = getDateForDay(defaultWeekStart, 2);
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
  }, [initialData, defaultWeekStart]);

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen, fetchMetadata]);

  const addToBatch = () => {
    if (!formData.subject || !formData.classId || !formData.room || !formData.teacher) {
      toast.error('Vui lòng điền đủ thông tin tiết học');
      return;
    }
    
    const hasConflict = batchItems.some(item => 
      item.day === formData.day && 
      formData.startPeriod <= item.endPeriod && 
      formData.endPeriod >= item.startPeriod
    );

    if (hasConflict) {
      toast.error('Tiết này trùng giờ với một tiết khác trong danh sách chờ');
      return;
    }

    setBatchItems(prev => [...prev, { ...formData, id: Date.now() }]);
    toast.success(`Đã thêm ${formData.subject} vào danh sách chờ`);
  };

  const removeFromBatch = (id: number) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmitAll = async () => {
    try {
      setSubmitting(true);
      if (isBatchMode) {
        if (batchItems.length === 0) {
          toast.error('Chưa có môn nào trong danh sách chờ');
          return;
        }
        await axios.post('/timetable/bulk', { events: batchItems });
        toast.success(`Đã tạo thành công ${batchItems.length} tiết học`);
      } else {
        await onSubmit(formData);
      }
      onClose();
      setBatchItems([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu dữ liệu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 mx-4"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <Calendar size={20} />
                </div>
                <div>
                   <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                     {initialData ? 'Cập nhật lịch học' : 'Thiết lập lịch học tuần'}
                   </h2>
                   {!initialData && (
                     <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => setIsBatchMode(false)}
                          className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all ${!isBatchMode ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}
                        >Đơn lẻ</button>
                        <button 
                          onClick={() => setIsBatchMode(true)}
                          className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all ${isBatchMode ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}
                        >Hàng loạt</button>
                     </div>
                   )}
                </div>
              </div>
              <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Left Side: Form */}
              <div className={`overflow-y-auto p-5 space-y-6 custom-scrollbar border-r border-slate-100 ${isBatchMode ? 'w-3/5' : 'w-full'}`}>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp học</label>
                       <select 
                         value={formData.classId}
                         onChange={(e) => {
                           setFormData({...formData, classId: e.target.value});
                           fetchSuggestions(e.target.value);
                         }}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                       >
                          <option value="">Chọn lớp...</option>
                          {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Giảng viên</label>
                       <select 
                         value={formData.teacher}
                         onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                       >
                          <option value="">Chọn GV...</option>
                          {lecturers.map(l => <option key={l.username} value={l.name}>{l.name}</option>)}
                       </select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên môn học</label>
                       <input 
                         type="text" 
                         value={formData.subject}
                         onChange={(e) => setFormData({...formData, subject: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                         placeholder="Nhập tên môn hoặc chọn gợi ý..."
                       />
                       {suggestedSubjects.length > 0 && (
                         <div className="flex flex-wrap gap-1.5 mt-2">
                            {suggestedSubjects.slice(0, 4).map((s, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setFormData({...formData, subject: s.name})}
                                className={`text-[8px] font-bold px-2 py-1 rounded-md border transition-all ${formData.subject === s.name ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                              >{s.name}</button>
                            ))}
                         </div>
                       )}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phòng học</label>
                       <select 
                         value={formData.room}
                         onChange={(e) => setFormData({...formData, room: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
                       >
                          <option value="">Chọn phòng...</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.name} className={availableRoomNames.includes(r.name) ? 'text-emerald-600' : 'text-slate-300'}>
                              {r.name} {availableRoomNames.includes(r.name) ? '(Trống)' : '(Bận)'}
                            </option>
                          ))}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bắt đầu</label>
                          <select 
                            value={formData.startPeriod}
                            onChange={(e) => setFormData({...formData, startPeriod: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                          >
                             {PERIODS.map(p => <option key={p.id} value={p.id}>T{p.id}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kết thúc</label>
                          <select 
                            value={formData.endPeriod}
                            onChange={(e) => setFormData({...formData, endPeriod: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                          >
                             {PERIODS.map(p => <option key={p.id} value={p.id}>T{p.id}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày & Thứ</label>
                       <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => {
                               const date = e.target.value;
                               const jsDay = new Date(date).getDay();
                               setFormData({ ...formData, startDate: date, day: jsDay === 0 ? 8 : jsDay + 1 });
                            }}
                            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                          />
                          <div className="flex items-center justify-center bg-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase">
                             {formData.day === 8 ? 'Chủ Nhật' : `Thứ ${formData.day}`}
                          </div>
                       </div>
                    </div>
                 </div>

                 {isBatchMode && (
                   <button 
                     onClick={addToBatch}
                     className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                   >
                     <Plus size={16} />
                     Thêm vào danh sách chờ
                   </button>
                 )}
              </div>

              {/* Right Side: Batch Preview (only in batch mode) */}
              {isBatchMode && (
                <div className="w-2/5 bg-slate-50/50 flex flex-col p-5 overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Danh sách chờ ({batchItems.length})</h4>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                      <AnimatePresence initial={false}>
                        {batchItems.length > 0 ? (
                           batchItems.sort((a,b) => (a.day*100 + a.startPeriod) - (b.day*100 + b.startPeriod)).map((item) => (
                             <motion.div 
                               key={item.id}
                               initial={{ opacity: 0, x: 20 }}
                               animate={{ opacity: 1, x: 0 }}
                               exit={{ opacity: 0, x: -20 }}
                               className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative group"
                             >
                                <div className="flex flex-col gap-1 pr-6">
                                   <p className="text-[10px] font-black text-slate-900 truncate uppercase">{item.subject}</p>
                                   <div className="flex flex-wrap gap-2">
                                      <span className="flex items-center gap-0.5 text-[7px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                         <Clock size={8} /> T{item.day} (T{item.startPeriod}-{item.endPeriod})
                                      </span>
                                      <span className="flex items-center gap-0.5 text-[7px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                         <MapPin size={8} /> {item.room}
                                      </span>
                                   </div>
                                </div>
                                <button onClick={() => removeFromBatch(item.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                             </motion.div>
                           ))
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-4">
                              <AlertCircle size={32} className="mb-2" />
                              <p className="text-[9px] font-black uppercase leading-relaxed">Chưa có môn nào trong danh sách chờ</p>
                           </div>
                        )}
                      </AnimatePresence>
                   </div>
                   {batchItems.length > 0 && (
                     <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <p className="text-[8px] font-bold text-emerald-800 uppercase leading-tight">Sẵn sàng tạo {batchItems.length} tiết học cho tuần này</p>
                     </div>
                   )}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <button onClick={onClose} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Hủy</button>
                  {initialData && onDelete && isAdmin && (
                    <button 
                      onClick={() => { if(window.confirm('Xóa?')) { onDelete(initialData.id); onClose(); } }}
                      className="text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  )}
               </div>
               <button 
                 onClick={handleSubmitAll}
                 disabled={submitting || (!isBatchMode && !formData.subject) || (isBatchMode && batchItems.length === 0)}
                 className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
               >
                 {submitting ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                 <span>{isBatchMode ? `Xác nhận tạo ${batchItems.length} môn` : (initialData ? 'Lưu thay đổi' : 'Xác nhận')}</span>
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TimetableFormModal;
