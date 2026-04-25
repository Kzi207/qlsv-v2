

export default function ServicesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
      <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Dịch vụ hành chính</h1>
      <p className="text-slate-500 font-medium max-w-xs">Các thủ tục hành chính online sẽ sớm được tích hợp vào hệ thống.</p>
    </div>
  );
}
