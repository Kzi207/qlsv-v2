const ScheduleLegend = () => {
  const items = [
    { label: 'Lịch học', color: 'bg-blue-500' },
    { label: 'Thi', color: 'bg-amber-500' },
    { label: 'Online', color: 'bg-cyan-500' },
    { label: 'Hybrid', color: 'bg-purple-500' },
    { label: 'Tạm ngưng', color: 'bg-slate-400' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-5 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
      <span className="text-xs font-bold text-slate-500 hidden sm:block">Ghi chú:</span>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div className={`h-3 w-3 rounded-full ${item.color} shadow-sm`} />
          <span className="text-xs font-semibold text-slate-700">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ScheduleLegend;
