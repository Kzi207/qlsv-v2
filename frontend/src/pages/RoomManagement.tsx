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
  User,
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
  
  // Availability check state
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

  // Sync checkTime with borrowForm when borrowing modal opens
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
    <>
      <div className="max-w-[1200px] mx-auto animate-fade-up pb-20 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              <DoorOpen size={12} /> Quản lý cơ sở vật chất
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Danh sách Phòng học</h1>
            <p className="text-slate-500 font-bold text-sm">Quản lý và kiểm tra tình trạng sử dụng phòng học</p>
          </div>

          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Thêm phòng mới</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm mã phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
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
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                             <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                               <DoorOpen size={20} />
                             </div>
                             <div>
                               <h3 className="font-black text-lg text-slate-900">{room.name}</h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{room.type}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5 text-slate-500">
                               <Users size={14} />
                               <span className="text-xs font-bold">{room.capacity}</span>
                             </div>
                             <div className={`flex items-center gap-1.5 ${isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                               {isAvailable ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                               <span className="text-xs font-bold">{isAvailable ? 'Trống' : 'Đang bận'}</span>
                             </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleEdit(room)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lịch sử mượn phòng</h3>
                   <ClipboardList className="text-slate-400" size={20} />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người mượn</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {borrowings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4 font-black text-blue-600 text-xs">{b.roomName}</td>
                            <td className="px-8 py-4">
                               <p className="text-xs font-bold text-slate-900">{b.borrowerName}</p>
                               <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{b.purpose}</p>
                            </td>
                            <td className="px-8 py-4">
                               <p className="text-xs font-bold text-slate-600">{new Date(b.date).toLocaleDateString('vi-VN')}</p>
                               <p className="text-[10px] font-black text-slate-400">Tiết {b.startPeriod} - {b.endPeriod}</p>
                            </td>
                            <td className="px-8 py-4">
                               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                 b.status === 'RETURNED' ? 'bg-slate-100 text-slate-400' :
                                 'bg-rose-50 text-rose-600 border border-rose-100'
                               }`}>
                                 {b.status}
                               </span>
                            </td>
                            <td className="px-8 py-4 text-right">
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
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                <CalendarDays size={120} />
              </div>
              
              <div className="relative">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Kiểm tra phòng trống</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn ngày</label>
                    <input 
                      type="date"
                      value={checkTime.date}
                      onChange={(e) => {
                        const date = e.target.value;
                        const day = new Date(date).getDay() + 1;
                        setCheckTime({...checkTime, date, day});
                      }}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Từ tiết</label>
                      <select 
                        value={checkTime.startPeriod}
                        onChange={(e) => setCheckTime({...checkTime, startPeriod: parseInt(e.target.value)})}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white appearance-none"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p} className="text-slate-900">Tiết {p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đến tiết</label>
                      <select 
                        value={checkTime.endPeriod}
                        onChange={(e) => setCheckTime({...checkTime, endPeriod: parseInt(e.target.value)})}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white appearance-none"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p} className="text-slate-900">Tiết {p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCheckAvailability}
                  disabled={isChecking}
                  className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChecking ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
                </button>

                <button 
                  onClick={() => setIsBorrowing(true)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/40 active:scale-95 mt-3 flex items-center justify-center gap-2"
                >
                  <ClipboardList size={16} />
                  Mượn phòng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setIsAdding(false)} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 p-8 space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mã phòng</label>
                  <input 
                    type="text"
                    required
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="VD: P.402"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Sức chứa</label>
                    <input 
                      type="number"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value)})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Loại phòng</label>
                    <select 
                      value={newRoom.type}
                      onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="lecture">Lý thuyết</option>
                      <option value="lab">Thực hành</option>
                      <option value="hall">Hội trường</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Xác nhận
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBorrowing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setIsBorrowing(false)} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 p-8 space-y-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đăng ký mượn phòng</h3>
                   {isChecking && <Loader2 className="animate-spin text-blue-500" size={20} />}
                </div>
              </div>

              <form onSubmit={handleBorrow} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Ngày mượn</label>
                        <input 
                          type="date"
                          required
                          value={borrowForm.date}
                          onChange={(e) => {
                             const date = e.target.value;
                             const day = new Date(date).getDay() + 1;
                             setBorrowForm({...borrowForm, date});
                             fetchAvailabilityForBorrow(day, borrowForm.startPeriod, borrowForm.endPeriod, date);
                          }}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Từ tiết</label>
                            <input 
                              type="number" min="1" max="15"
                              required
                              value={borrowForm.startPeriod}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setBorrowForm({...borrowForm, startPeriod: val});
                                 const day = new Date(borrowForm.date).getDay() + 1;
                                 fetchAvailabilityForBorrow(day, val, borrowForm.endPeriod, borrowForm.date);
                              }}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Đến tiết</label>
                            <input 
                              type="number" min="1" max="15"
                              required
                              value={borrowForm.endPeriod}
                              onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setBorrowForm({...borrowForm, endPeriod: val});
                                 const day = new Date(borrowForm.date).getDay() + 1;
                                 fetchAvailabilityForBorrow(day, borrowForm.startPeriod, val, borrowForm.date);
                              }}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Chọn phòng khả dụng</label>
                      <select 
                        required
                        value={borrowForm.roomName}
                        onChange={(e) => {
                           const room = rooms.find(r => r.name === e.target.value);
                           setBorrowForm({...borrowForm, roomName: e.target.value, roomId: room?.id || ''});
                        }}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="">-- Chọn phòng --</option>
                        {rooms.map(r => {
                          const isAvailable = availableRoomNames.includes(r.name);
                          return (
                            <option key={r.id} value={r.name} className={isAvailable ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                              {r.name} {isAvailable ? '✓ (Trống)' : '✗ (Đã có lịch)'}
                            </option>
                          );
                        })}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên người mượn / Đơn vị</label>
                      <div className="relative">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                           type="text"
                           required
                           value={borrowForm.borrowerName}
                           onChange={(e) => setBorrowForm({...borrowForm, borrowerName: e.target.value})}
                           className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                           placeholder="VD: Khoa CNTT - Nguyễn Văn A"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Lý do mượn</label>
                      <textarea 
                        required
                        value={borrowForm.purpose}
                        onChange={(e) => setBorrowForm({...borrowForm, purpose: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[100px]"
                        placeholder="VD: Tổ chức hội thảo, học bù..."
                      />
                   </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50">
                  <button 
                    type="button"
                    onClick={() => setIsBorrowing(false)}
                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoomManagement;

