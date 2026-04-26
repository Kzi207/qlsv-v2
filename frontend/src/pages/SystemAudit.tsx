import React, { useState, useEffect, useCallback } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  User, 
  Clock, 
  Info,
  LogIn,
  LogOut,
  Edit,
  CheckCircle,
  Globe,
  Monitor
} from 'lucide-react';
import api from '../api/axios';

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  targetType: string;
  targetId: string;
  details: unknown;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    username: string;
    name: string;
    role: string;
  };
}

const SystemAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit', {
        params: {
          page,
          action: actionFilter || undefined,
          targetType: targetFilter || undefined,
        }
      });
      setLogs(response.data.items);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn size={14} className="text-emerald-500" />;
      case 'LOGOUT': return <LogOut size={14} className="text-slate-400" />;
      case 'APPROVE_DRL': return <CheckCircle size={14} className="text-blue-500" />;
      case 'SUBMIT_DRL': return <Edit size={14} className="text-amber-500" />;
      case 'UPDATE_GRADES': return <Edit size={14} className="text-indigo-500" />;
      default: return <Info size={14} className="text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'Đăng nhập';
      case 'LOGOUT': return 'Đăng xuất';
      case 'APPROVE_DRL': return 'Duyệt DRL';
      case 'SUBMIT_DRL': return 'Nộp DRL';
      case 'EDIT_DRL': return 'Sửa DRL';
      case 'UPDATE_GRADES': return 'Nhập điểm';
      default: return action;
    }
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false
    }).replace(/,/g, '');

  const formatDetails = (details: unknown) => {
    if (details == null) return 'Không có chi tiết';
    if (typeof details === 'string') return details;
    try {
      return JSON.stringify(details);
    } catch {
      return 'Không thể hiển thị chi tiết';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <HistoryIcon size={24} strokeWidth={2.5} />
            </div>
            Nhật ký hệ thống
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-11">Theo dõi lịch sử chỉnh sửa và hoạt động của người dùng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 md:gap-4 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 w-full sm:w-auto sm:min-w-[220px]">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 w-full"
          >
            <option value="">Tất cả hoạt động</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="APPROVE_DRL">Duyệt DRL</option>
            <option value="SUBMIT_DRL">Nộp DRL</option>
            <option value="UPDATE_GRADES">Nhập điểm</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 w-full sm:w-auto sm:min-w-[220px]">
          <Search size={16} className="text-slate-400" />
          <select 
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 w-full"
          >
            <option value="">Tất cả đối tượng</option>
            <option value="TrainingScore">Phiếu DRL</option>
            <option value="Grade">Bảng điểm</option>
            <option value="User">Người dùng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Người thực hiện</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hoạt động</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Chi tiết</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Thiết bị & IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">Không có dữ liệu nhật ký</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[13px] font-bold text-slate-600">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <User size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-800">{log.user?.name || 'Hệ thống'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{log.user?.username || 'system'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-[13px] font-extrabold text-slate-700">{getActionLabel(log.action)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[300px]">
                        <p className="text-[12px] font-medium text-slate-500 line-clamp-2 italic">
                          {log.targetType && <span className="font-black text-slate-700 not-italic">[{log.targetType}] </span>}
                          {formatDetails(log.details)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <Globe size={12} className="text-blue-400" />
                          {log.ipAddress || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 truncate max-w-[150px]">
                          <Monitor size={12} />
                          {log.userAgent || 'Unknown Device'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4">
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-400 font-bold italic">
              Không có dữ liệu nhật ký
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Thời gian</p>
                    <p className="text-xs font-bold text-slate-700">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1.5 shrink-0">
                    {getActionIcon(log.action)}
                    <span className="text-[11px] font-black text-slate-700">{getActionLabel(log.action)}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 space-y-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <User size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{log.user?.name || 'Hệ thống'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{log.user?.username || 'system'}</p>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed break-words">
                    {log.targetType && <span className="font-black text-slate-700">[{log.targetType}] </span>}
                    {formatDetails(log.details)}
                  </p>

                  <div className="space-y-1 text-[10px] font-bold text-slate-500">
                    <p className="inline-flex items-center gap-1.5 max-w-full">
                      <Globe size={11} className="text-blue-400 shrink-0" />
                      <span className="break-all">{log.ipAddress || 'Unknown'}</span>
                    </p>
                    <p className="inline-flex items-center gap-1.5 max-w-full">
                      <Monitor size={11} className="shrink-0" />
                      <span className="break-words">{log.userAgent || 'Unknown Device'}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-400 italic">Hiển thị tối đa 20 bản ghi mỗi trang</p>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Trình trước
            </button>
            <span className="text-xs font-black text-slate-800 px-2">Trang {page} / {totalPages}</span>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Tiếp theo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAudit;
