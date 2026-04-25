import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { CheckCircle, Eye, Loader2, User, XCircle } from 'lucide-react';

const TrainingScoreApproval = () => {
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/training', {
        params: { status: statusFilter, page, pageSize },
      });

      if (Array.isArray(res.data)) {
        setScores(res.data);
        setPagination({
          page,
          pageSize,
          total: res.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        setScores(Array.isArray(res.data?.items) ? res.data.items : []);
        setPagination({
          page: Number(res.data?.pagination?.page || page),
          pageSize: Number(res.data?.pagination?.pageSize || pageSize),
          total: Number(res.data?.pagination?.total || 0),
          totalPages: Number(res.data?.pagination?.totalPages || 1),
          hasNext: Boolean(res.data?.pagination?.hasNext),
          hasPrev: Boolean(res.data?.pagination?.hasPrev),
        });
      }
    } catch (_error) {
      toast.error('Khong the tai danh sach phieu diem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchScores();
  }, [statusFilter, page, pageSize]);

  const handleApprove = async (id: number, status: string) => {
    try {
      await api.patch(`/training/${id}/approve`, { status });
      toast.success(status === 'APPROVED' ? 'Da duyet phieu diem' : 'Da tu choi phieu diem');
      fetchScores();
    } catch (_error) {
      toast.error('Loi khi cap nhat trang thai');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Duyet diem ren luyen</h2>
          <p className="text-slate-500">Phe duyet hoac tu choi phieu diem sinh vien nop</p>
        </div>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${statusFilter === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          Dang cho duyet
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${statusFilter === 'APPROVED' ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          Da duyet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Loader2 className="animate-spin mx-auto mb-2" />
            Dang tai du lieu...
          </div>
        ) : scores.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 italic">
            Khong co phieu diem nao {statusFilter === 'PENDING' ? 'dang cho' : 'da duyet'}
          </div>
        ) : (
          scores.map((score) => (
            <div key={score.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col gap-6 group hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{score.student?.name}</h4>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-tighter">{score.student?.student_code}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${score.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {score.status}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Hoc ky</span>
                  <span className="font-bold text-slate-700">{typeof score.semester === 'object' ? score.semester?.name : score.semester}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500 text-sm">Tong diem tu danh gia</span>
                  <span className="text-3xl font-black text-slate-900">{score.total}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                <Link
                  to={`/training/approval/${score.id}`}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                >
                  <Eye size={18} /> Phe duyet chi tiet
                </Link>

                {score.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(score.id, 'APPROVED')}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <CheckCircle size={16} /> Duyet nhanh
                    </button>
                    <button
                      onClick={() => handleApprove(score.id, 'REJECTED')}
                      className="flex-1 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-600 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <XCircle size={16} /> Tu choi
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold text-slate-500">
          Tong: <span className="font-black text-slate-800">{pagination.total}</span> phieu
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev || loading}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-50"
          >
            Truoc
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
  );
};

export default TrainingScoreApproval;
