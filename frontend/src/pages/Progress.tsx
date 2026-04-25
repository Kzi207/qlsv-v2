

export default function ProgressPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
      <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Tiến độ học tập</h1>
      <p className="text-slate-500 font-medium max-w-xs">Tính năng đang trong quá trình phát triển. Vui lòng quay lại sau.</p>
    </div>
  );
}
