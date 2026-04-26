import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Loader2, UserCheck, FileDown, Shield, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Assignment {
  classId: string;
  fromOrder: number;
  toOrder: number;
}

const BCHManagement = () => {
  const [bchList, setBchList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentBch, setCurrentBch] = useState<any>(null);
  const [classOptions, setClassOptions] = useState<any[]>([]);
  const [selectedClassForExport, setSelectedClassForExport] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    class_id: '',
    role: 'BCH'
  });

  const [assignments, setAssignments] = useState<Assignment[]>([
    { classId: '', fromOrder: 1, toOrder: 10 }
  ]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClassOptions(res.data);
    } catch (error) {
      console.error('Không thể tải danh sách lớp');
    }
  };

  const fetchBchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bch');
      setBchList(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBchAccounts();
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentBch) {
        await api.put(`/bch/${currentBch.id}`, formData);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/bch', formData);
        toast.success('Thêm tài khoản thành công');
      }
      setIsModalOpen(false);
      fetchBchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bch/assign', {
        bchUserId: currentBch.id,
        assignments: assignments.filter(a => a.classId && a.fromOrder > 0 && a.toOrder >= a.fromOrder)
      });
      toast.success('Phân công thành công');
      setIsAssignModalOpen(false);
      fetchBchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thực hiện phân công');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await api.delete(`/bch/${id}`);
        toast.success('Đã xóa tài khoản');
        fetchBchAccounts();
      } catch (error) {
        toast.error('Không thể xóa tài khoản');
      }
    }
  };

  const handleExportAssignments = async () => {
    if (!selectedClassForExport) {
      toast.error('Vui lòng chọn lớp để xuất file');
      return;
    }

    try {
      const res = await api.get('/bch/export-assignments', {
        params: { class_id: selectedClassForExport },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `phan-cong-${selectedClassForExport}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (_error) {
      toast.error('Khong the xuat file phan cong');
    }
  };

  const openEditModal = (bch: any = null) => {
    if (bch) {
      setCurrentBch(bch);
      setFormData({
        username: bch.username,
        password: '',
        name: bch.name,
        email: bch.email || '',
        phone: bch.phone || '',
        class_id: bch.class_id || '',
        role: bch.role || 'BCH'
      });
    } else {
      setCurrentBch(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        class_id: '',
        role: 'BCH'
      });
    }
    setIsModalOpen(true);
  };

  const openAssignModal = (bch: any) => {
    setCurrentBch(bch);
    if (bch.assignments && bch.assignments.length > 0) {
      setAssignments(bch.assignments.map((a: any) => ({
        classId: a.classId || '',
        fromOrder: Number(a.fromOrder) || 0,
        toOrder: Number(a.toOrder) || 0
      })));
    } else {
      setAssignments([{ classId: bch.class_id || '', fromOrder: 1, toOrder: 10 }]);
    }
    setIsAssignModalOpen(true);
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'QTV': return { label: 'Quản trị viên', color: 'text-rose-600 bg-rose-50 border-rose-100' };
      case 'LECTURER': return { label: 'Giảng viên', color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'BCH': return { label: 'Ban chấp hành', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      default: return { label: role, color: 'text-slate-600 bg-slate-50 border-slate-100' };
    }
  };

  const filteredBch = bchList.filter((b: any) => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.username.toLowerCase().includes(search.toLowerCase()) ||
    (b.class_id && b.class_id.toLowerCase().includes(search.toLowerCase())) ||
    (b.role && b.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                <Shield size={12} /> System Administration
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý Tài khoản Quản trị</h2>
             <p className="text-slate-500 font-bold text-sm">Quản lý QTV, Giảng viên và Ban chấp hành hệ thống</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-white border border-slate-100 rounded-[1.5rem] px-4 py-1 shadow-sm">
              <select
                value={selectedClassForExport}
                onChange={(e) => setSelectedClassForExport(e.target.value)}
                className="bg-transparent border-none outline-none py-3 text-xs font-black text-slate-600 min-w-[140px] uppercase tracking-wider"
              >
                <option value="">-- Chọn lớp --</option>
                {classOptions.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={handleExportAssignments}
                disabled={!selectedClassForExport}
                className="ml-2 p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                title="Xuất file phân công"
              >
                <FileDown size={18} />
              </button>
            </div>

            <button
              onClick={() => openEditModal()}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              <Plus size={20} />
              <span>Tạo tài khoản mới</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, tài khoản, vai trò..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm font-bold text-sm"
          />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin thành viên</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vai trò</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân công (BCH)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu hệ thống...</p>
                    </td>
                  </tr>
                ) : filteredBch.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Chưa có tài khoản nào được tạo
                    </td>
                  </tr>
                ) : (
                  filteredBch.map((bch: any) => {
                    const roleInfo = getRoleLabel(bch.role);
                    return (
                      <tr key={bch.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                <UserCircle size={24} />
                             </div>
                             <div className="flex flex-col">
                               <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{bch.name}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{bch.class_id || 'Quản lý Hệ thống'}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 font-black text-xs text-blue-600 uppercase tracking-widest bg-blue-50/10">{bch.username}</td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${roleInfo.color} shadow-sm`}>
                             {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          {bch.role === 'BCH' ? (
                             bch.assignments && bch.assignments.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {bch.assignments.map((a: any, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black border border-indigo-100 uppercase">
                                    STT {a.fromOrder}-{a.toOrder}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Chấm toàn lớp</span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic uppercase">Không áp dụng</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right space-x-2">
                          {bch.role === 'BCH' && (
                            <button
                              onClick={() => openAssignModal(bch)}
                              className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Phân công chấm điểm"
                            >
                              <UserCheck size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(bch)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Sửa tài khoản"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(bch.id)}
                            className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Account Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white w-full max-w-xl p-10 rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                     {currentBch ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Điền đầy đủ thông tin quản trị</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'QTV', label: 'QUẢN TRỊ' },
                        { id: 'LECTURER', label: 'GIẢNG VIÊN' },
                        { id: 'BCH', label: 'BCH LỚP' }
                      ].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setFormData({...formData, role: r.id})}
                          className={`py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === r.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                        >
                          {r.label}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                    <input
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!!currentBch}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                    <input
                      type="password"
                      placeholder={currentBch ? 'Để trống nếu giữ nguyên' : 'Mặc định 1234'}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Họ tên thành viên</label>
                  <input
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Lớp (Nếu là BCH)</label>
                    <select
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    >
                      <option value="">Không phân lớp</option>
                      {classOptions.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-3xl flex items-center justify-between mt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Hủy bỏ</button>
                   <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                    {currentBch ? 'Lưu thay đổi' : 'Cấp tài khoản'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assignment Modal (Only for BCH) */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsAssignModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Phân công chấm điểm</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{currentBch?.name}</p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-6">
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {assignments.map((assign, index) => (
                    <div key={index} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phần {index + 1}</span>
                        {assignments.length > 1 && (
                          <button
                            type="button" onClick={() => setAssignments(assignments.filter((_, i) => i !== index))}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-600 uppercase ml-1">Lớp</label>
                          <select
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                            value={assign.classId}
                            onChange={(e) => {
                              const newAssigns = [...assignments];
                              newAssigns[index].classId = e.target.value;
                              setAssignments(newAssigns);
                            }}
                          >
                            <option value="">Chọn lớp</option>
                            {classOptions.map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase ml-1">Từ STT</label>
                            <input
                              type="number"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                              value={assign.fromOrder === 0 ? '' : assign.fromOrder}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                const newAssigns = [...assignments];
                                newAssigns[index].fromOrder = isNaN(val) ? 0 : val;
                                setAssignments(newAssigns);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase ml-1">Đến STT</label>
                            <input
                              type="number"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                              value={assign.toOrder === 0 ? '' : assign.toOrder}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                const newAssigns = [...assignments];
                                newAssigns[index].toOrder = isNaN(val) ? 0 : val;
                                setAssignments(newAssigns);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAssignments([...assignments, { classId: currentBch?.class_id || '', fromOrder: 1, toOrder: 10 }])}
                  className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-[1.5rem] hover:border-blue-500 hover:text-blue-500 transition-all font-black text-xs uppercase tracking-widest"
                >
                  <Plus size={18} /> Thêm dải STT
                </button>

                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                  Lưu phân công
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BCHManagement;
