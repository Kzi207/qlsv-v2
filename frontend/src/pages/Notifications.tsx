

export default function NotificationsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
      <div className="h-20 w-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Thông báo</h1>
      <p className="text-slate-500 font-medium max-w-xs">Bạn chưa có thông báo mới nào tại thời điểm này.</p>
    </div>
  );
}
