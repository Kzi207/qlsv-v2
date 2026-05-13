import { useAuthStore } from '../../store/useAuthStore';

const StudentHeader = () => {
  const { user } = useAuthStore();
  const displayName = user?.name || 'Sinh viên';

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100/50 flex items-center gap-6 md:gap-8">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg shadow-blue-200 shrink-0">
        {displayName.charAt(0).toUpperCase()}
      </div>
      
      <div className="flex-1">
        <h2 className="text-slate-400 text-sm font-medium mb-1">Xin chào,</h2>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
          {displayName}
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-emerald-600 text-sm font-bold tracking-tight">
            Hệ thống học vụ đã sẵn sàng
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;
