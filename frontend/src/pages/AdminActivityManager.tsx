import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Users, 
  AlertCircle, 
  Loader2,
  X,
  Info,
  RefreshCw,
  Calendar,
  School,
  Activity,
  ClipboardCheck,
  CheckCircle,
  Eye,
  Filter
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { EVALUATION_DATA } from '../constants/evaluationData';
import ConfirmModal from '../components/ConfirmModal';

const AdminActivityManager = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'sessions' | 'evidence'>('sessions');
  const [pendingEvidence, setPendingEvidence] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedEvidenceClass, setSelectedEvidenceClass] = useState<string>('all');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    sectionId: '',
    criterionId: '',
    points: 0,
    semesterId: '',
    classId: ''
  });

  useEffect(() => {
    fetchSessions();
    fetchMetadata();
    fetchPendingEvidence();
  }, []);

  useEffect(() => {
    let intervalId: any;
    if (showStatsModal && selectedSession) {
      setIsPolling(true);
      fetchStats(selectedSession.id, true);
      intervalId = setInterval(() => fetchStats(selectedSession.id, true), 3000);
    } else {
      setIsPolling(false);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [showStatsModal, selectedSession]);

  const fetchMetadata = async () => {
    try {
      const [clsRes, semRes] = await Promise.all([
        axios.get('/classes'),
        axios.get('/semesters')
      ]);
      setClasses(clsRes.data);
      setSemesters(semRes.data);
      // Set defaults
      if (semRes.data.length > 0) {
         setFormData(prev => ({ ...prev, semesterId: semRes.data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching metadata');
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/activities/sessions');
      setSessions(res.data);
    } catch (error) {
      toast.error('Lỗi tải hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEvidence = async () => {
    try {
      const res = await axios.get('/activities/evidence/pending');
      setPendingEvidence(res.data);
    } catch (error) {
      console.error('Lỗi tải minh chứng chờ duyệt');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sectionId || !formData.criterionId || !formData.semesterId) {
      return toast.error('Vui lòng điền đủ thông tin bắt buộc');
    }

    const section = EVALUATION_DATA.find(s => s.id === formData.sectionId);
    let category = 'Hoạt động';
    if (section?.title.includes('I.')) category = 'Ý thức học tập';
    if (section?.title.includes('II.')) category = 'Kỷ luật & Nội quy';
    if (section?.title.includes('III.')) category = 'Hoạt động Đoàn Hội';
    if (section?.title.includes('IV.')) category = 'Hoạt động cộng đồng';

    try {
      await axios.post('/activities/generate', {
        ...formData,
        category,
        points: Number(formData.points)
      });
      toast.success('Tạo hoạt động thành công');
      setShowCreateModal(false);
      setFormData({ 
        title: '', sectionId: '', criterionId: '', points: 0, 
        semesterId: semesters[0]?.name || '', classId: '' 
      });
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo');
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa hoạt động?',
      message: 'Hành động này sẽ xóa vĩnh viễn mã QR và danh sách điểm danh liên quan. Bạn có chắc chắn?',
      onConfirm: async () => {
        try {
          await axios.delete(`/activities/session/${sessionId}`);
          toast.success('Đã xóa');
          fetchSessions();
        } catch (error) { toast.error('Lỗi xóa'); }
      },
      type: 'danger'
    });
  };

  const fetchStats = async (sessionId: number, silent = false) => {
    try {
      const res = await axios.get(`/activities/stats/${sessionId}`);
      setStats(prev => JSON.stringify(prev) === JSON.stringify(res.data) ? prev : res.data);
    } catch (error) { if (!silent) toast.error('Lỗi tải thống kê'); }
  };

  const handleUpdatePoints = async (recordId: number, newPoints: number) => {
    try {
      await axios.put(`/activities/record/${recordId}`, { points: newPoints });
      if (selectedSession) fetchStats(selectedSession.id);
    } catch (error) { toast.error('Lỗi cập nhật'); }
  };

  const handleDeleteRecord = async (recordId: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Gỡ sinh viên?',
      message: 'Bạn có muốn gỡ sinh viên này khỏi danh sách điểm danh? Điểm sẽ không được cộng vào DRL.',
      onConfirm: async () => {
        try {
          await axios.delete(`/activities/record/${recordId}`);
          if (selectedSession) fetchStats(selectedSession.id);
          toast.success('Đã xóa');
        } catch (error) { toast.error('Lỗi xóa bản ghi'); }
      },
      type: 'warning'
    });
  };

  const toggleStatus = async (session: any) => {
    try {
      await axios.patch(`/activities/session/${session.id}/status`, { isActive: !session.isActive });
      fetchSessions();
    } catch (error) { toast.error('Lỗi'); }
  };

  const handleReviewEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sectionId || !formData.criterionId || !formData.points || !formData.semesterId) {
      return toast.error('Vui lòng điền đủ thông tin để duyệt');
    }

    setReviewLoading(true);
    try {
      await axios.patch(`/activities/evidence/review/${selectedEvidence.id}`, {
        status: 'APPROVED',
        adminTitle: formData.title || selectedEvidence.title,
        points: Number(formData.points),
        sectionId: formData.sectionId,
        criterionId: formData.criterionId,
        semesterId: formData.semesterId
      });
      toast.success('Đã duyệt minh chứng');
      setShowReviewModal(false);
      setSelectedEvidence(null);
      fetchPendingEvidence();
    } catch (error) {
      toast.error('Lỗi khi duyệt');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRejectEvidence = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Từ chối minh chứng?',
      message: 'Minh chứng này sẽ bị hủy bỏ và sinh viên sẽ không được cộng điểm.',
      onConfirm: async () => {
        try {
          await axios.patch(`/activities/evidence/review/${id}`, { status: 'REJECTED' });
          toast.success('Đã từ chối');
          fetchPendingEvidence();
        } catch (error) { toast.error('Lỗi thao tác'); }
      },
      type: 'danger'
    });
  };

  const selectedSection = EVALUATION_DATA.find(s => s.id === formData.sectionId);
  const selectedCriterion = selectedSection?.criteria.find(c => c.id === formData.criterionId);

  const evidenceClasses = Array.from(new Set(pendingEvidence.map(ev => ev.student?.class_id).filter(Boolean)));
  const filteredEvidence = pendingEvidence.filter(ev => selectedEvidenceClass === 'all' || ev.student?.class_id === selectedEvidenceClass);

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Hoạt động QR</h1>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Thiết lập điểm danh tự động cộng vào DRL</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
             <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button onClick={() => setActiveTab('sessions')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                   <Activity size={16} /> QR Hoạt động
                </button>
                <button onClick={() => setActiveTab('evidence')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'evidence' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                   <ClipboardCheck size={16} /> Duyệt minh chứng {pendingEvidence.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-full">{pendingEvidence.length}</span>}
                </button>
             </div>
             {activeTab === 'sessions' && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Plus size={18} /> Tạo mã hoạt động
                </button>
             )}
          </div>
        </div>

        {activeTab === 'sessions' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden hover:border-blue-200 transition-all flex flex-col group">
                <div className="p-8 space-y-6 flex-1">
                   <div className="flex items-start justify-between">
                      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><QrCode size={24} /></div>
                      <div className="flex gap-2">
                         <button onClick={() => handleDeleteSession(session.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                         <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{session.isActive ? 'Đang mở' : 'Đã khóa'}</div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{session.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                         <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black uppercase rounded-md">{session.category}</span>
                         <span className="text-blue-600 font-black text-sm">+{session.points}đ</span>
                      </div>
                      {(session.semesterId || session.classId) && (
                         <div className="flex flex-wrap gap-2 pt-2">
                            {session.semesterId && <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-md flex items-center gap-1"><Calendar size={8}/> {session.semesterId}</div>}
                            {session.classId && <div className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-md flex items-center gap-1"><School size={8}/> Lớp: {session.classId}</div>}
                         </div>
                      )}
                   </div>
                   <div className="pt-4 flex items-center gap-3">
                      <button onClick={() => { setSelectedSession(session); setShowStatsModal(true); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"><Users size={14} /> Thống kê</button>
                      <button onClick={() => toggleStatus(session)} className={`p-3 rounded-xl border transition-all ${session.isActive ? 'border-rose-100 text-rose-500 hover:bg-rose-50' : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50'}`}><AlertCircle size={18} /></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
             <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Danh sách minh chứng chờ duyệt</h3>
                   <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      <Filter size={16} className="text-slate-400 ml-2" />
                      <select value={selectedEvidenceClass} onChange={e => setSelectedEvidenceClass(e.target.value)} className="bg-transparent border-none rounded-xl px-2 py-1 text-xs font-black uppercase tracking-tight outline-none focus:ring-0 cursor-pointer text-slate-600">
                         <option value="all">Tất cả các lớp</option>
                         {evidenceClasses.sort().map(c => <option key={c} value={c}>Lớp {c}</option>)}
                      </select>
                   </div>
                </div>
                <div className="p-8">
                   {filteredEvidence.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                         <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200"><ClipboardCheck size={40} /></div>
                         <p className="text-slate-400 font-bold text-sm">Không có minh chứng nào khớp với bộ lọc</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {filteredEvidence.map((ev) => (
                            <div key={ev.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col gap-6 hover:border-emerald-200 transition-all group">
                               <div className="flex items-start gap-4">
                                  <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0">
                                     <img src={axios.defaults.baseURL + ev.imageUrl} className="w-full h-full object-cover" alt="Evidence" />
                                  </div>
                                  <div className="flex-1">
                                     <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{ev.title}</h4>
                                     <p className="text-[10px] font-bold text-slate-400 mt-0.5">{ev.student?.name} • {ev.student?.student_code}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Lớp: {ev.student?.class_id}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3 pt-4 border-t border-slate-200/50">
                                  <button onClick={() => { setSelectedEvidence(ev); setFormData({ ...formData, title: ev.title }); setShowReviewModal(true); }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"><CheckCircle size={14} /> Duyệt & Cộng điểm</button>
                                  <button onClick={() => handleRejectEvidence(ev.id)} className="p-3 bg-white border border-rose-100 text-rose-500 rounded-xl hover:bg-rose-50 transition-all"><X size={18} /></button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tạo Hoạt động QR</h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
               </div>
               <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên hoạt động</label>
                     <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold" placeholder="VD: Tham gia dọn dẹp..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ (Bắt buộc)</label>
                        <select required value={formData.semesterId} onChange={e => setFormData({...formData, semesterId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs">
                           <option value="">-- Chọn học kỳ --</option>
                           {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp (Không bắt buộc)</label>
                        <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs">
                           <option value="">Tất cả các lớp</option>
                           {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục Lớn DRL</label>
                        <select required value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value, criterionId: ''})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs">
                           <option value="">-- Chọn --</option>
                           {EVALUATION_DATA.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục Nhỏ Cụ thể</label>
                        <select required disabled={!formData.sectionId} value={formData.criterionId} onChange={e => setFormData({...formData, criterionId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs disabled:opacity-50">
                           <option value="">-- Chọn --</option>
                           {selectedSection?.criteria.map(c => <option key={c.id} value={c.id}>{c.content.substring(0, 50)}...</option>)}
                        </select>
                     </div>
                  </div>

                  {selectedCriterion && (
                     <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                        <div className="flex items-center gap-2 text-blue-600"><Info size={16}/><span className="text-[10px] font-black uppercase tracking-widest">Quy định điểm tối đa: {selectedCriterion.maxPoints}</span></div>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed italic">{selectedCriterion.guide}</p>
                        <div className="flex items-center gap-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase">Điểm cộng mỗi lần quét:</label>
                           <input type="number" required value={isNaN(formData.points) ? '' : formData.points} onChange={e => {
                              const val = parseInt(e.target.value);
                              setFormData({...formData, points: isNaN(val) ? 0 : val});
                           }} className="w-20 h-12 bg-white border border-blue-200 rounded-xl text-center font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-100" />
                        </div>
                     </div>
                  )}
               </div>
               <div className="p-8 bg-slate-50 shrink-0">
                  <button onClick={handleCreate} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">Tạo & Kích hoạt hoạt động</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStatsModal && selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowStatsModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden z-10"
            >
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                  <div className="space-y-1">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSession.title}</h2>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase"><RefreshCw size={10} className={isPolling ? "animate-spin" : ""} /> Thời gian thực</div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tự động cập nhật mỗi 3s</span>
                     </div>
                  </div>
                  <button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
               </div>
               <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-6">
                     <div className="bg-slate-50 p-8 rounded-[2.5rem] flex flex-col items-center gap-8 border border-slate-100 shadow-inner">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100"><QRCodeSVG value={JSON.stringify({ type: 'activity', token: selectedSession.qrToken })} size={256} /></div>
                        <div className="text-center space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">QR ID: {selectedSession.qrToken.substring(0, 10)}</p></div>
                     </div>
                     <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Tổng sinh viên đã quét</p>
                        <h4 className="text-5xl font-black tracking-tighter mt-1">{stats.length}</h4>
                     </div>
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                     <div className="flex items-center justify-between"><h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Danh sách điểm danh</h4><div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">{stats.length} sinh viên</div></div>
                     <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.length === 0 ? (
                           <div className="py-24 text-center space-y-4 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                              <Users size={40} className="text-slate-200 mx-auto" /><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang chờ lượt quét đầu tiên...</p>
                           </div>
                        ) : (
                           stats.map((record) => (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={record.id} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-[1rem] bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-black shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all text-lg">{record.student?.name?.[0]}</div>
                                    <div><p className="text-sm font-black text-slate-900 tracking-tight">{record.student?.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{record.student?.student_code} • {record.student?.class_id}</p></div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-1"><span className="text-[8px] font-black text-slate-400 uppercase">Điểm</span><input type="number" value={isNaN(record.points) ? '' : record.points} onChange={(e) => {
                                     const val = parseInt(e.target.value);
                                     handleUpdatePoints(record.id, isNaN(val) ? 0 : val);
                                  }} className="w-14 h-9 bg-white border border-slate-200 rounded-xl text-center text-xs font-black outline-none focus:ring-4 focus:ring-blue-100" /></div>
                                    <button onClick={() => handleDeleteRecord(record.id)} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                 </div>
                              </motion.div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedEvidence && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowReviewModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden z-10">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Phê duyệt Minh chứng</h2>
                  <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24} /></button>
               </div>
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ảnh minh chứng</label>
                        <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-lg">
                           <img src={axios.defaults.baseURL + selectedEvidence.imageUrl} className="w-full h-auto" alt="Original Evidence" />
                        </div>
                        <a href={axios.defaults.baseURL + selectedEvidence.imageUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs mt-2"><Eye size={14} /> Xem ảnh gốc</a>
                     </div>
                  </div>
                  <form onSubmit={handleReviewEvidence} className="space-y-6">
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin từ sinh viên</p>
                        <div><p className="text-xs font-bold text-slate-400">Tên hoạt động:</p><p className="text-sm font-black text-slate-900">{selectedEvidence.title}</p></div>
                        <div><p className="text-xs font-bold text-slate-400">Sinh viên:</p><p className="text-sm font-black text-slate-900">{selectedEvidence.student?.name} ({selectedEvidence.student?.student_code})</p></div>
                     </div>

                     <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chuẩn hóa tên hoạt động (Sẽ hiển thị trong phiếu)</label>
                           <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-sm" />
                        </div>
                        
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Học kỳ áp dụng</label>
                           <select required value={formData.semesterId} onChange={e => setFormData({...formData, semesterId: e.target.value})} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-xs">
                              <option value="">-- Chọn --</option>
                              {semesters.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                           </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục Lớn DRL</label>
                              <select required value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value, criterionId: ''})} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-xs">
                                 <option value="">-- Chọn --</option>
                                 {EVALUATION_DATA.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục Nhỏ</label>
                              <select required disabled={!formData.sectionId} value={formData.criterionId} onChange={e => setFormData({...formData, criterionId: e.target.value})} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-xs disabled:opacity-50">
                                 <option value="">-- Chọn --</option>
                                 {EVALUATION_DATA.find(s => s.id === formData.sectionId)?.criteria.map(c => <option key={c.id} value={c.id}>{c.content.substring(0, 30)}...</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điểm cộng</label>
                           <input type="number" required value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value)})} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-black text-emerald-600" />
                        </div>
                     </div>

                     <div className="pt-6">
                        <button type="submit" disabled={reviewLoading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                           {reviewLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                           {reviewLoading ? 'Đang xử lý...' : 'Xác nhận Duyệt & Cộng điểm'}
                        </button>
                     </div>
                  </form>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </>
  );
};

export default AdminActivityManager;

