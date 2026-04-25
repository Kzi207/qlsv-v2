const Legend = () => {
  const items = [
    { label: 'Lịch học', color: 'bg-blue-500' },
    { label: 'Thi học kỳ', color: 'bg-amber-500' },
    { label: 'Thi chính thức', color: 'bg-rose-500' },
    { label: 'Online', color: 'bg-cyan-500' },
    { label: 'Tạm ngưng', color: 'bg-slate-400' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
      <span className="text-[10px] font-black text-slate-400">Ghi chú</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
          <span className="text-[11px] font-black text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Legend;
