import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Loader2, UserCheck, Shield, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

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
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const { user } = useAuthStore();
  const isQtv = String(user?.role || '').toUpperCase() === 'QTV';
  const isBch = String(user?.role || '').toUpperCase() === 'BCH';
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    class_id: '',
    position: '',
    teachingSubjectIds: [] as string[],
    role: isQtv ? 'QTV' : 'BCH'
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

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/academic/subjects');
      setSubjectOptions(res.data);
    } catch (error) {
      console.error('Không thể tải danh sách môn học');
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
    fetchSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        class_id: isBch ? String(user?.class_id || formData.class_id || '') : formData.class_id,
        role: isBch ? 'BCH' : formData.role,
      };

      if (currentBch) {
        await api.put(`/bch/${currentBch.id}`, payload);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/bch', payload);
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


  const openEditModal = (bch: any = null) => {
    if (bch) {
      setCurrentBch(bch);
      setFormData({
        username: bch.username,
        password: '',
        name: bch.name,
        email: bch.email || '',
        phone: bch.phone || '',
        class_id: bch.class_id || (isBch ? String(user?.class_id || '') : ''),
        position: bch.position || '',
        teachingSubjectIds: bch.teachingSubjects?.map((s: any) => String(s.id)) || [],
        role: bch.role || (isQtv ? 'QTV' : 'BCH')
      });
      setSubjectSearch('');
    } else {
      setCurrentBch(null);
      setSubjectSearch('');
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        class_id: isBch ? String(user?.class_id || '') : '',
        position: '',
        teachingSubjectIds: [],
        role: isQtv ? 'QTV' : 'BCH'
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

  const getRoleLabel = (role: string, position?: string) => {
    switch(role) {
      case 'QTV': return { label: 'Quản trị viên', color: 'text-rose-600 bg-rose-50 border-rose-100', note: 'Cao nhất' };
      case 'LECTURER': return { label: 'Giảng viên', color: 'text-blue-600 bg-blue-50 border-blue-100', note: 'Nhập điểm, xem TKB, điểm danh' };
      case 'BCH': return { label: position ? `BCH - ${position}` : 'Ban chấp hành', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', note: 'Duyệt phiếu điểm theo lớp' };
      default: return { label: role, color: 'text-slate-600 bg-slate-50 border-slate-100', note: '' };
    }
  };

  const filteredBch = bchList.filter((b: any) => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.username.toLowerCase().includes(search.toLowerCase()) ||
    (b.class_id && b.class_id.toLowerCase().includes(search.toLowerCase())) ||
    (b.position && b.position.toLowerCase().includes(search.toLowerCase())) ||
    (Array.isArray(b.teachingSubjects) && b.teachingSubjects.some((subject: any) => String(subject?.name || '').toLowerCase().includes(search.toLowerCase()))) ||
    (b.role && b.role.toLowerCase().includes(search.toLowerCase()))
  );

  const roleChoices = isQtv
    ? [
        { id: 'QTV', label: 'QUẢN TRỊ' },
        { id: 'LECTURER', label: 'GIẢNG VIÊN' },
        { id: 'BCH', label: 'BCH LỚP' }
      ]
    : [
        { id: 'BCH', label: 'BCH LỚP' }
      ];

  const visibleClassOptions = isBch ? classOptions.filter((clazz: any) => clazz.name === String(user?.class_id || '')) : classOptions;

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                <Shield size={12} /> CBNT ACCOUNT CENTER
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý tài khoản CBNT</h2>
             <p className="text-slate-500 font-bold text-sm">Quản trị viên cao nhất, giảng viên theo môn dạy, BCH theo lớp và chức vụ</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">

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
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phạm vi phụ trách</th>
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
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{bch.position || bch.class_id || 'Quản lý hệ thống'}</span>
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
                          {bch.role === 'LECTURER' ? (
                            bch.teachingSubjects && bch.teachingSubjects.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {bch.teachingSubjects.map((subject: any) => (
                                  <span key={subject.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black border border-blue-100 uppercase">
                                    {subject.code}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Chưa gán môn</span>
                            )
                          ) : bch.role === 'BCH' ? (
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
                            <span className="text-[10px] font-bold text-slate-300 italic uppercase">Quản lý chung</span>
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
          <div className="fixed inset-0 z-[100] flex justify-center items-start overflow-y-auto bg-slate-900/60 backdrop-blur-md p-4 py-8 custom-scrollbar">
            <div 
              className="fixed inset-0" 
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col"
            >
              <div className="flex justify-between items-start p-8 pb-4 shrink-0">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                     {currentBch ? 'Cập nhật tài khoản CBNT' : 'Tạo tài khoản CBNT'}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{isQtv ? 'QTV tạo tài khoản giảng viên, BCH hoặc chính mình' : 'BCH chỉ tạo tài khoản BCH trong lớp của mình'}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 px-8 py-4">
                <form id="bchAccountForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                   <div className={`grid gap-3 ${roleChoices.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      {roleChoices.map(r => (
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                    <input
                      type="text" required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm dark:text-white"
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
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm dark:text-white"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    {formData.role === 'LECTURER' ? 'Tên giảng viên' : formData.role === 'BCH' ? 'Tên ban chấp hành' : 'Tên quản trị viên'}
                  </label>
                  <input
                    type="text" required
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm dark:text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Gmail (nếu có)</label>
                    <input
                      type="email"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Số điện thoại / liên hệ</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {formData.role === 'LECTURER' && (
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Môn dạy ({formData.teachingSubjectIds.length} môn đã chọn)</label>
                    
                    {formData.teachingSubjectIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        {formData.teachingSubjectIds.map(id => {
                          const sub = subjectOptions.find(s => String(s.id) === id);
                          return (
                            <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm">
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase">{sub?.code} - {sub?.name}</span>
                              <button 
                                type="button"
                                onClick={() => setFormData({ ...formData, teachingSubjectIds: formData.teachingSubjectIds.filter(tid => tid !== id) })}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Gõ mã hoặc tên môn học để tìm..."
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm dark:text-white"
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        onFocus={() => setShowSubjectDropdown(true)}
                      />
                      <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      
                      <AnimatePresence>
                        {showSubjectDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowSubjectDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-20 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl p-2 custom-scrollbar"
                            >
                              {subjectOptions
                                .filter(s => 
                                  s.code.toLowerCase().includes(subjectSearch.toLowerCase()) || 
                                  s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                                )
                                .slice(0, 50) // Limit for performance
                                .map(subject => (
                                  <button
                                    key={subject.id}
                                    type="button"
                                    onClick={() => {
                                      if (!formData.teachingSubjectIds.includes(String(subject.id))) {
                                        setFormData({ 
                                          ...formData, 
                                          teachingSubjectIds: [...formData.teachingSubjectIds, String(subject.id)] 
                                        });
                                      }
                                      setSubjectSearch('');
                                      setShowSubjectDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${formData.teachingSubjectIds.includes(String(subject.id)) ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600 dark:text-slate-300'}`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>{subject.name}</span>
                                      <span className={`text-[10px] ${formData.teachingSubjectIds.includes(String(subject.id)) ? 'text-blue-100' : 'text-slate-400'}`}>{subject.code}</span>
                                    </div>
                                  </button>
                                ))}
                              {subjectOptions.filter(s => 
                                s.code.toLowerCase().includes(subjectSearch.toLowerCase()) || 
                                s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase">Không tìm thấy môn học</div>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {formData.role === 'BCH' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Quản lý lớp</label>
                      <select
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm dark:text-white disabled:opacity-80"
                        value={formData.class_id}
                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        disabled={isBch}
                      >
                        <option value="">Không phân lớp</option>
                        {(isBch ? visibleClassOptions : classOptions).map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Chức vụ</label>
                      <select
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      >
                        <option value="">Chọn chức vụ</option>
                        <option value="Bí thư">Bí thư</option>
                        <option value="Phó bí thư">Phó bí thư</option>
                        <option value="Ủy viên">Ủy viên</option>
                      </select>
                    </div>
                  </div>
                )}

                </form>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 shrink-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Hủy bỏ</button>
                <button type="submit" form="bchAccountForm" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                  {currentBch ? 'Lưu thay đổi' : 'Cấp tài khoản'}
                </button>
              </div>
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
                            {(isBch ? visibleClassOptions : classOptions).map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  onClick={() => setAssignments([...assignments, { classId: currentBch?.class_id || (isBch ? String(user?.class_id || '') : ''), fromOrder: 1, toOrder: 10 }])}
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

