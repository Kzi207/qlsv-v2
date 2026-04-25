import React from 'react';
import { Edit3, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  events: any[];
  onEdit: (event: any) => void;
  onDelete: (id: number) => void;
  isAdmin?: boolean;
}

const TimetableTable: React.FC<Props> = ({ events, onEdit, onDelete, isAdmin = true }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Môn học / Lớp</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giảng viên</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng / Tiết</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
              {isAdmin && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold text-sm">Chưa có lịch học nào được xếp</td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 leading-tight mb-1">{event.subject}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Lớp: {event.classId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                          {event.teacher?.[0] || 'G'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{event.teacher}</span>
                     </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-blue-600">{event.room}</span>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                           <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                              Thứ {event.day}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {event.startDate ? new Date(event.startDate).toLocaleDateString('vi-VN') : 'N/A'}
                           </span>
                           <span className="text-[10px] font-black text-blue-400 uppercase tracking-tight">
                              | Tiết {event.startPeriod} - {event.endPeriod}
                           </span>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-5">
                    {event.isConflict ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase border border-rose-100">
                        <AlertCircle size={12} /> Trùng lịch
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                        Đã xếp lịch
                      </div>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => onEdit(event)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => onDelete(event.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableTable;
