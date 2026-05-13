import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  CalendarCheck,
  CalendarDays,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

const Attendance = () => {
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const [students, setStudents] = useState<any[]>([]);
  const [recordHistory, setRecordHistory] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState('');
  const [classOptions, setClassOptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [date, classFilter, isStudent]);

  useEffect(() => {
    if (!isStudent) fetchClasses();
  }, [isStudent]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClassOptions(res.data);
    } catch (e) {
      console.error('Lỗi khi tải danh sách lớp');
    }
  };

  const fetchData = async () => {
    if (isStudent && !user?.studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isStudent) {
        const res = await api.get(`/attendance/student/${user?.studentId}`);
        setRecordHistory(res.data);
      } else {
        const [studentRes, attendanceRes] = await Promise.all([
          api.get('/students', { params: { class_id: classFilter || undefined } }),
          api.get('/attendance', {
            params: {
              date,
              classId: classFilter || undefined,
            },
          }),
        ]);
        setStudents(studentRes.data);
        
        const attendanceMap: any = {};
        attendanceRes.data.forEach((a: any) => {
          attendanceMap[a.student_id] = a.status;
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (studentId: number, status: string) => {
    try {
      await api.post('/attendance', {
        student_id: studentId,
        date,
        status
      });
      setAttendance({ ...attendance, [studentId]: status });
      toast.success('Đã cập nhật', { 
        duration: 800,
        position: 'bottom-center',
        style: { borderRadius: '1rem', fontWeight: 'bold' }
      });
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  const adminStats = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    late: Object.values(attendance).filter(v => v === 'late').length,
  };

  const studentStats = {
    present: recordHistory.filter(r => r.status === 'present').length,
    late: recordHistory.filter(r => r.status === 'late').length,
    absent: recordHistory.filter(r => r.status === 'absent').length,
  };

  if (isStudent) {
    return (
      <div className="max-w-4xl px-2 md:px-4 space-y-6 md:space-y-8 pb-16 animate-fade-up">
        {/* Student Header */}
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">
            <CalendarCheck size={12} />
            Hồ sơ điểm danh cá nhân
          </div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Chuyên cần</h1>
          <p className="text-slate-500 font-medium text-xs md:text-base max-w-2xl">
            Lịch sử tham gia lớp học và các hoạt động ngoại khóa của bạn.
          </p>
        </header>

        {/* Student Stats Bento */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {[
            { label: 'Có mặt', value: studentStats.present, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
            { label: 'Vắng trễ', value: studentStats.late, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
            { label: 'Vắng', value: studentStats.absent, color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 shadow-sm shadow-slate-200/50">
              <div className={`h-10 w-10 md:h-14 md:w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-black text-slate-900 leading-tight tracking-tighter">{stat.value}</p>
                <p className="text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* History Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs md:text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              Lịch sử chi tiết
            </h3>
            <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">
              HK2 2024-2025
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 md:h-24 w-full bg-slate-100 animate-pulse rounded-3xl" />)}
            </div>
          ) : recordHistory.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {recordHistory.map((record, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-3xl border border-slate-100 p-4 md:p-5 flex items-center gap-4 md:gap-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="hidden md:flex flex-col items-center justify-center border-r border-slate-100 pr-6 min-w-[100px]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{new Date(record.created_at).toLocaleDateString('vi-VN', { weekday: 'short' })}</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">{new Date(record.created_at).getDate()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Tháng {new Date(record.created_at).getMonth() + 1}</p>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 md:hidden mb-1">
                       <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(record.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h4 className="text-sm md:text-base font-black text-slate-800 truncate tracking-tight">{record.session?.subject || record.session?.title || 'Buổi học'}</h4>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                       <CalendarDays size={12} className="text-blue-500" />
                       Học phần: {record.session?.subject_code || '---'}
                    </p>
                  </div>

                  <div className={`px-3 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl border ${
                    record.status === 'present' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-500/5' :
                    record.status === 'late' ? 'bg-amber-50 border-amber-100 text-amber-600 shadow-amber-500/5' : 
                    'bg-rose-50 border-rose-100 text-rose-600 shadow-rose-500/5'
                  } text-[9px] md:text-xs font-black uppercase tracking-widest shadow-sm`}>
                    {record.status === 'present' ? 'CÓ MẶT' : record.status === 'late' ? 'MUỘN' : 'VẮNG'}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                 <CalendarDays size={40} />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Chưa có dữ liệu điểm danh</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 space-y-8 md:space-y-10 pb-20 animate-fade-up">
      {/* Admin Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            <UserCheck size={12} />
            Quản trị chuyên cần
          </div>
          <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Điểm danh lớp</h1>
          <p className="text-slate-500 font-bold text-xs md:text-lg">
            {new Date(date).toLocaleDateString('vi-VN', { dateStyle: 'full' })}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 self-start lg:self-auto">
           <button 
             onClick={() => {
               const d = new Date(date);
               d.setDate(d.getDate() - 1);
               setDate(d.toISOString().split('T')[0]);
             }}
             className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-90 transition-all text-slate-400"
           >
             <ChevronLeft size={24} />
           </button>
           <div className="flex items-center gap-2 px-4 border-x border-slate-100">
             <Calendar size={20} className="text-indigo-600" />
             <input 
               type="date" 
               value={date}
               onChange={(e) => setDate(e.target.value)}
               className="font-black text-sm md:text-base text-slate-700 outline-none cursor-pointer bg-transparent"
             />
           </div>
           <button 
             onClick={() => {
               const d = new Date(date);
               d.setDate(d.getDate() + 1);
               setDate(d.toISOString().split('T')[0]);
             }}
             className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-90 transition-all text-slate-400"
           >
             <ChevronRight size={24} />
           </button>
        </div>
      </header>

      {/* Admin Quick Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        {[
          { label: 'Có mặt', value: adminStats.present, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'Vắng mặt', value: adminStats.absent, color: 'text-rose-600', bg: 'bg-rose-50', icon: XCircle },
          { label: 'Đi muộn', value: adminStats.late, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-100 p-4 md:p-6 flex flex-col md:flex-row items-center gap-3 md:gap-5 shadow-sm shadow-slate-200/50">
             <div className={`h-10 w-10 md:h-14 md:w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
             </div>
             <div className="text-center md:text-left">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl md:text-3xl font-black text-slate-900 leading-none mt-1 tracking-tighter">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
             <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                   type="text"
                   placeholder="Tìm tên hoặc MSSV..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 font-black text-sm transition-all"
                />
             </div>
             <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full md:w-auto pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 font-black text-sm appearance-none min-w-[180px] shadow-sm"
                >
                  <option value="">Tất cả lớp</option>
                  {classOptions.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16} />
             </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm shadow-slate-200/50">
             <Loader2 className="animate-spin text-indigo-600" size={32} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải danh sách...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/20">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50/50 border-b border-slate-100">
                   <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinh viên</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp học</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cập nhật trạng thái</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_code.includes(searchQuery)).map((s: any) => (
                     <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                             {s.name[0]}
                           </div>
                           <div>
                             <p className="font-black text-slate-800 leading-tight tracking-tight">{s.name}</p>
                             <p className="text-[11px] font-bold text-indigo-600 uppercase mt-0.5 tracking-tight">{s.student_code}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-5">
                         <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                           {s.class_id}
                         </span>
                       </td>
                       <td className="px-8 py-5 text-right">
                         <div className="inline-flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100 shadow-inner">
                           {[
                             { id: 'present', label: 'CÓ MẶT', color: 'bg-emerald-500' },
                             { id: 'absent', label: 'VẮNG', color: 'bg-rose-500' },
                             { id: 'late', label: 'MUỘN', color: 'bg-amber-500' }
                           ].map(btn => (
                             <button
                               key={btn.id}
                               onClick={() => handleStatusChange(s.id, btn.id)}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                                 attendance[s.id] === btn.id 
                                   ? `${btn.color} text-white shadow-lg` 
                                   : 'text-slate-400 hover:text-slate-600'
                               }`}
                             >
                               {btn.label}
                             </button>
                           ))}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 gap-3 px-1">
               {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_code.includes(searchQuery)).map((s: any) => (
                 <div key={s.id} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-5 shadow-sm shadow-slate-200/50">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                             {s.name[0]}
                          </div>
                          <div className="min-w-0">
                             <p className="font-black text-slate-800 leading-none truncate tracking-tight uppercase text-xs mb-1.5">{s.name}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{s.student_code}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.class_id}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                       {[
                         { id: 'present', label: 'CÓ MẶT', color: 'bg-emerald-500' },
                         { id: 'absent', label: 'VẮNG', color: 'bg-rose-500' },
                         { id: 'late', label: 'MUỘN', color: 'bg-amber-500' }
                       ].map(btn => (
                         <button
                           key={btn.id}
                           onClick={() => handleStatusChange(s.id, btn.id)}
                           className={`py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${
                             attendance[s.id] === btn.id 
                               ? `${btn.color} text-white shadow-lg` 
                               : 'text-slate-400 bg-white border border-slate-100'
                           }`}
                         >
                           {btn.label}
                         </button>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
