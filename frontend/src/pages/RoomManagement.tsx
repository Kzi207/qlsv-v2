import { useState, useEffect } from 'react';
import { 
  DoorOpen, 
  Plus, 
  Trash2, 
  Users, 
  Search,
  CheckCircle2,
  XCircle,
  Pencil,
  ClipboardList,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const RoomManagement = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    capacity: 40,
    type: 'lecture'
  });
  const [borrowForm, setBorrowForm] = useState({
    roomId: '',
    roomName: '',
    borrowerName: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    startPeriod: 1,
    endPeriod: 2
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [checkTime, setCheckTime] = useState({
    day: new Date().getDay() + 1,
    startPeriod: 1,
    endPeriod: 2,
    date: new Date().toISOString().split('T')[0]
  });
  const [availableRoomNames, setAvailableRoomNames] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchBorrowings();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get('/rooms');
      setRooms(res.data);
    } catch (error) {
      toast.error('Lỗi tải danh sách phòng');
    }
  };

  const fetchBorrowings = async () => {
    try {
      const res = await axios.get('/borrowings');
      setBorrowings(res.data);
    } catch (error) {
      toast.error('Lỗi tải danh sách mượn phòng');
    }
  };

  const fetchAvailabilityForBorrow = async (day: number, startPeriod: number, endPeriod: number, date: string) => {
    setIsChecking(true);
    try {
      const res = await axios.get('/rooms/available', {
        params: { day, startPeriod, endPeriod, date }
      });
      setAvailableRoomNames(res.data.map((r: any) => r.name));
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isBorrowing) {
      const day = new Date(borrowForm.date).getDay() + 1;
      fetchAvailabilityForBorrow(day, borrowForm.startPeriod, borrowForm.endPeriod, borrowForm.date);
    }
  }, [isBorrowing]);

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowForm.roomName) {
      toast.error('Vui lòng chọn phòng');
      return;
    }
    try {
      await axios.post('/borrowings', borrowForm);
      toast.success('Mượn phòng thành công');
      setIsBorrowing(false);
      setBorrowForm({
        roomId: '',
        roomName: '',
        borrowerName: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
        startPeriod: 1,
        endPeriod: 2
      });
      fetchBorrowings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi mượn phòng');
    }
  };

  const handleUpdateBorrowStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`/borrowings/${id}/status`, { status });
      toast.success('Cập nhật trạng thái thành công');
      fetchBorrowings();
    } catch (error) {
      toast.error('Lỗi cập nhật');
    }
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setNewRoom({ name: '', capacity: 40, type: 'lecture' });
    setIsAdding(true);
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setNewRoom({
      name: room.name,
      capacity: room.capacity,
      type: room.type
    });
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await axios.put(`/rooms/${editingRoom.id}`, newRoom);
        toast.success('Cập nhật phòng thành công');
      } else {
        await axios.post('/rooms', newRoom);
        toast.success('Thêm phòng thành công');
      }
      setIsAdding(false);
      setEditingRoom(null);
      setNewRoom({ name: '', capacity: 40, type: 'lecture' });
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi xử lý');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm('Xóa phòng này?')) return;
    try {
      await axios.delete(`/rooms/${id}`);
      toast.success('Đã xóa phòng');
      fetchRooms();
    } catch (error) {
      toast.error('Lỗi xóa phòng');
    }
  };

  const handleCheckAvailability = async () => {
    setIsChecking(true);
    try {
      const res = await axios.get('/rooms/available', { params: checkTime });
      setAvailableRoomNames(res.data.map((r: any) => r.name));
      toast.success('Đã cập nhật danh sách phòng trống');
    } catch (error) {
      toast.error('Lỗi kiểm tra phòng trống');
    } finally {
      setIsChecking(false);
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-up pb-20 space-y-8 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
            <DoorOpen size={10} /> Quản lý cơ sở vật chất
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Danh sách Phòng học</h1>
          <p className="text-slate-500 font-bold text-xs">Quản lý và kiểm tra tình trạng sử dụng phòng học</p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 w-fit"
        >
          <Plus size={14} />
          <span>Thêm phòng mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm mã phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredRooms.map((room) => {
                const isAvailable = availableRoomNames.length === 0 || availableRoomNames.includes(room.name);
                return (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                             <DoorOpen size={18} />
                           </div>
                           <div>
                             <h3 className="font-bold text-sm text-slate-900">{room.name}</h3>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{room.type}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5 text-slate-500">
                             <Users size={12} />
                             <span className="text-[10px] font-bold">{room.capacity}</span>
                           </div>
                           <div className={`flex items-center gap-1.5 ${isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {isAvailable ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                             <span className="text-[10px] font-bold">{isAvailable ? 'Trống' : 'Đang bận'}</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEdit(room)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Lịch sử mượn phòng</h3>
                 <ClipboardList className="text-slate-300" size={16} />
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Phòng</th>
                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Người mượn</th>
                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {borrowings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 font-bold text-blue-600 text-[11px]">{b.roomName}</td>
                          <td className="px-6 py-3">
                             <p className="text-[11px] font-bold text-slate-900">{b.borrowerName}</p>
                             <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{b.purpose}</p>
                          </td>
                          <td className="px-6 py-3">
                             <p className="text-[11px] font-bold text-slate-600">{new Date(b.date).toLocaleDateString('vi-VN')}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase">Tiết {b.startPeriod} - {b.endPeriod}</p>
                          </td>
                          <td className="px-6 py-3">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                               b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                               b.status === 'RETURNED' ? 'bg-slate-100 text-slate-400' :
                               'bg-rose-50 text-rose-600'
                             }`}>
                               {b.status}
                             </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                             {b.status === 'APPROVED' && (
                               <button 
                                 onClick={() => handleUpdateBorrowStatus(b.id, 'RETURNED')}
                                 className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                               >
                                 Trả phòng
                               </button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
              <CalendarDays size={100} />
            </div>
            
            <div className="relative">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-blue-400">Kiểm tra phòng trống</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Chọn ngày</label>
                  <input 
                    type="date"
                    value={checkTime.date}
                    onChange={(e) => {
                      const date = e.target.value;
                      const day = new Date(date).getDay() + 1;
                      setCheckTime({...checkTime, date, day});
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Từ tiết</label>
                    <select 
                      value={checkTime.startPeriod}
                      onChange={(e) => setCheckTime({...checkTime, startPeriod: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white appearance-none"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p} className="text-slate-900">Tiết {p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Đến tiết</label>
                    <select 
                      value={checkTime.endPeriod}
                      onChange={(e) => setCheckTime({...checkTime, endPeriod: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white appearance-none"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p} className="text-slate-900">Tiết {p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <button 
                  onClick={handleCheckAvailability}
                  disabled={isChecking}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChecking ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra phòng'}
                </button>

                <button 
                  onClick={() => setIsBorrowing(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <ClipboardList size={14} />
                  Mượn phòng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Standardized size */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-7 space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingRoom ? 'Sửa phòng' : 'Thêm phòng mới'}</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã phòng</label>
                  <input required value={newRoom.name} onChange={(e) => setNewRoom({...newRoom, name: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="VD: P.402" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sức chứa</label>
                    <input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value)})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại phòng</label>
                    <select value={newRoom.type} onChange={(e) => setNewRoom({...newRoom, type: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all">
                      <option value="lecture">Lý thuyết</option>
                      <option value="lab">Thực hành</option>
                      <option value="hall">Hội trường</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Xác nhận thông tin</button>
              </form>
            </motion.div>
          </div>
        )}

        {isBorrowing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBorrowing(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 p-7 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Đăng ký mượn phòng</h3>
                  {isChecking && <Loader2 className="animate-spin text-blue-500" size={16} />}
               </div>
               <form onSubmit={handleBorrow} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày mượn</label>
                      <input type="date" required value={borrowForm.date} onChange={(e) => {
                         const date = e.target.value;
                         const day = new Date(date).getDay() + 1;
                         setBorrowForm({...borrowForm, date});
                         fetchAvailabilityForBorrow(day, borrowForm.startPeriod, borrowForm.endPeriod, date);
                      }} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-[11px] outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Từ</label>
                          <input type="number" min="1" max="15" value={borrowForm.startPeriod} onChange={(e) => {
                             const val = parseInt(e.target.value);
                             setBorrowForm({...borrowForm, startPeriod: val});
                             const day = new Date(borrowForm.date).getDay() + 1;
                             fetchAvailabilityForBorrow(day, val, borrowForm.endPeriod, borrowForm.date);
                          }} className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đến</label>
                          <input type="number" min="1" max="15" value={borrowForm.endPeriod} onChange={(e) => {
                             const val = parseInt(e.target.value);
                             setBorrowForm({...borrowForm, endPeriod: val});
                             const day = new Date(borrowForm.date).getDay() + 1;
                             fetchAvailabilityForBorrow(day, borrowForm.startPeriod, val, borrowForm.date);
                          }} className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" />
                       </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn phòng khả dụng</label>
                    <select required value={borrowForm.roomName} onChange={(e) => {
                       const room = rooms.find(r => r.name === e.target.value);
                       setBorrowForm({...borrowForm, roomName: e.target.value, roomId: room?.id || ''});
                    }} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5">
                      <option value="">-- Chọn phòng --</option>
                      {rooms.map(r => {
                        const isAvailable = availableRoomNames.includes(r.name);
                        return <option key={r.id} value={r.name} className={isAvailable ? 'text-emerald-600 font-bold' : 'text-slate-300'}>{r.name} {isAvailable ? '✓' : '✗'}</option>
                      })}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Người mượn / Đơn vị</label>
                    <input required value={borrowForm.borrowerName} onChange={(e) => setBorrowForm({...borrowForm, borrowerName: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" placeholder="VD: Khoa CNTT - Nguyễn Văn A" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lý do mượn</label>
                    <textarea required value={borrowForm.purpose} onChange={(e) => setBorrowForm({...borrowForm, purpose: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs min-h-[80px]" placeholder="VD: Tổ chức hội thảo..." />
                  </div>
                  <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2">Gửi yêu cầu mượn phòng</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomManagement;
