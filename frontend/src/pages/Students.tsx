import React, { useDeferredValue, useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, UserX, Loader2, ClipboardCheck, FileSpreadsheet, Download, Key, Mail, Upload, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 30,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    student_code: '',
    email: '',
    class_id: '',
  });
  const [classOptions, setClassOptions] = useState<any[]>([]);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassId, setImportClassId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClassOptions(res.data);
    } catch (error) {
      console.error('Không thể tải danh sách lớp');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', {
        params: {
          class_id: classFilter || undefined,
          keyword: deferredSearch || undefined,
          page,
          pageSize,
        }
      });
      if (Array.isArray(res.data)) {
        setStudents(res.data);
        setPagination({
          page,
          pageSize,
          total: res.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        setStudents(Array.isArray(res.data?.items) ? res.data.items : []);
        setPagination({
          page: Number(res.data?.pagination?.page || page),
          pageSize: Number(res.data?.pagination?.pageSize || pageSize),
          total: Number(res.data?.pagination?.total || 0),
          totalPages: Number(res.data?.pagination?.totalPages || 1),
          hasNext: Boolean(res.data?.pagination?.hasNext),
          hasPrev: Boolean(res.data?.pagination?.hasPrev),
        });
      }
    } catch (error) {
      toast.error('Không thể tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [classFilter, deferredSearch]);

  useEffect(() => {
    fetchStudents();
  }, [classFilter, deferredSearch, page, pageSize]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Vui lòng chọn file Excel');
    if (!importClassId) return toast.error('Vui lòng chọn lớp để nhập');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('classId', importClassId);

    const loadingToast = toast.loading('Đang xử lý file...');
    try {
      const res = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message, { id: loadingToast });
      setIsImportModalOpen(false);
      setSelectedFile(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể nhập file', { id: loadingToast });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/students/template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau-nhap-sinh-vien.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Không thể tải file mẫu');
    }
  };

  const handleDeleteAccount = async (student: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản của sinh viên ${student.name}? Chú ý: Thao tác này chỉ xóa tài khoản đăng nhập, không xóa thông tin sinh viên.`)) return;

    try {
      await api.delete(`/students/${student.id}/account`);
      toast.success('Đã xóa tài khoản thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài khoản');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentStudent) {
        await api.put(`/students/${currentStudent.id}`, formData);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/students', formData);
        toast.success('Thêm sinh viên thành công');
      }
      setIsModalOpen(false);
      fetchStudents();
      setFormData({ name: '', student_code: '', email: '', class_id: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCreateAccount = async (student: any) => {
    const password = prompt(`Nhập mật khẩu cho tài khoản ${student.student_code} (Để trống để dùng mặc định: 1234):`, '1234');
    if (password === null) return;

    try {
      await api.post(`/students/${student.id}/account`, { password });
      toast.success('Đã tạo/cập nhật tài khoản thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo tài khoản');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      try {
        await api.delete(`/students/${id}`);
        toast.success('Đã xóa sinh viên');
        fetchStudents();
      } catch (error) {
        toast.error('Không thể xóa sinh viên');
      }
    }
  };

  const openModal = (student: any = null) => {
    if (student) {
      setCurrentStudent(student);
      setFormData({
        name: student.name,
        student_code: student.student_code,
        email: student.email,
        class_id: student.class_id,
      });
    } else {
      setCurrentStudent(null);
      setFormData({ name: '', student_code: '', email: '', class_id: '' });
    }
    setIsModalOpen(true);
  };

  const filteredStudents = students;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Quản lý sinh viên</h2>
            <p className="text-slate-500">Xem và quản lý thông tin sinh viên</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
            >
              <Download size={20} />
              <span>Tải file mẫu</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet size={20} />
              <span>Nhập Excel</span>
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
            >
              <Plus size={20} />
              <span>Thêm sinh viên</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm sinh viên bằng tên hoặc mã số..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700"
            >
              <option value="">Tất cả các lớp</option>
              {classOptions.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã SV</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Họ tên</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      <Loader2 className="animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Không tìm thấy sinh viên nào
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-primary-600 text-sm">{student.student_code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{student.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{student.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                          {student.class_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/evaluation/${student.id}`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                          title="Chấm điểm rèn luyện"
                        >
                          <ClipboardCheck size={18} />
                        </button>
                        <>
                          <button
                            onClick={() => handleCreateAccount(student)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Đặt lại mật khẩu"
                          >
                            <Key size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(student)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            title="Xóa tài khoản đăng nhập"
                          >
                            <UserX size={18} />
                          </button>
                        </>

                        <button
                          onClick={() => openModal(student)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Xóa sinh viên"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" />
                Đang tải dữ liệu...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                Không tìm thấy sinh viên nào
              </div>
            ) : (
              filteredStudents.map((student: any) => (
                <div key={student.id} className="p-5 space-y-4 active:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{student.name}</h4>
                      <p className="text-sm font-mono font-bold text-primary-600 mt-0.5">{student.student_code}</p>
                    </div>
                    <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-bold border border-primary-100 uppercase">
                      {student.class_id}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-slate-500">
                    <Mail size={14} className="mr-2 text-slate-400" />
                    <span className="truncate">{student.email}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button 
                      onClick={() => navigate(`/evaluation/${student.id}`)}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs"
                    >
                      <ClipboardCheck size={14} /> Chấm điểm
                    </button>
                    <button 
                      onClick={() => openModal(student)}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 bg-primary-50 text-primary-600 rounded-xl font-bold text-xs"
                    >
                      <Edit2 size={14} /> Sửa
                    </button>
                    <button 
                      onClick={() => handleCreateAccount(student)}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"
                      title="Mật khẩu"
                    >
                      <Key size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            Tổng: <span className="font-black text-slate-800">{pagination.total}</span> sinh viên
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrev || loading}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-xs font-bold text-slate-600">{pagination.page}/{pagination.totalPages}</span>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNext || loading}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  {currentStudent ? 'Chỉnh sửa sinh viên' : 'Thêm sinh viên mới'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Họ tên</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Mã sinh viên</label>
                    <input
                      type="text"
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-mono font-bold"
                      value={formData.student_code}
                      onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Lớp</label>
                    <select
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold"
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    >
                      <option value="" disabled>Chọn lớp</option>
                      {classOptions.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/20 mt-4 active:scale-95 transition-all"
                >
                  {currentStudent ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Excel Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsImportModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nhập sinh viên từ Excel</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Vui lòng chọn lớp trước khi tải file</p>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleImport} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp học tiếp nhận</label>
                  <select
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-sm"
                    value={importClassId}
                    onChange={(e) => setImportClassId(e.target.value)}
                  >
                    <option value="">--- Chọn lớp học ---</option>
                    {classOptions.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File Excel (.xlsx, .xls)</label>
                   <div className="relative">
                      <input 
                        type="file" 
                        required 
                        accept=".xlsx, .xls"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden" 
                        id="excel-upload"
                      />
                      <label 
                        htmlFor="excel-upload"
                        className="w-full px-5 py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                      >
                         <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all">
                            <Upload size={24} />
                         </div>
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {selectedFile ? selectedFile.name : 'Nhấn để chọn file Excel'}
                         </span>
                      </label>
                   </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                   <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed">
                      Lưu ý: Mọi sinh viên trong file sẽ được gán trực tiếp vào lớp <span className="font-black text-amber-900 underline">{importClassId || '...'}</span> mà bạn đã chọn ở trên.
                   </p>
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || !importClassId}
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  Bắt đầu nhập dữ liệu
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Students;
