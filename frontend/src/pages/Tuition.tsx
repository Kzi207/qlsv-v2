import { CreditCard, Wallet, ArrowRight, ShieldCheck, Inbox } from 'lucide-react';


const Tuition = () => {
  return (
    <div className="max-w-4xl space-y-8 animate-fade-up">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Học phí & Lệ phí</h1>
        <p className="text-slate-500 font-medium">Quản lý các khoản phí và thực hiện thanh toán trực tuyến.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-slate-50 blur-3xl" />
            
            <div className="flex items-center gap-4 relative">
               <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center">
                  <Wallet size={28} />
               </div>
               <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Số dư hiện tại</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">0<span className="text-sm ml-1 text-slate-400">đ</span></p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-400">
                  <span className="text-xs font-black uppercase tracking-widest">Không có khoản phí mới</span>
                  <span className="text-sm font-black">0đ</span>
               </div>
            </div>

            <button disabled className="w-full py-4 bg-slate-100 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed">
               Thanh toán ngay
               <ArrowRight size={16} />
            </button>
         </div>

         <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest pl-2">Lịch sử giao dịch</h3>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/10 p-8 flex flex-col items-center justify-center text-center min-h-[250px]">
               <Inbox size={32} className="text-slate-100 mb-2" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chưa có giao dịch nào</p>
            </div>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl shadow-slate-900/10">
         <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
         <div className="space-y-2 relative">
            <h3 className="text-xl font-black tracking-tight">Cổng thanh toán trực tuyến</h3>
            <p className="text-slate-400 text-sm font-medium">Hệ thống sẽ sớm hỗ trợ thanh toán qua ngân hàng và ví điện tử.</p>
         </div>
         <div className="flex gap-3 relative opacity-20">
            <div className="h-12 w-20 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
               <CreditCard size={24} />
            </div>
            <div className="h-12 w-20 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
               <ShieldCheck size={24} />
            </div>
         </div>
      </div>
    </div>
  );
};

export default Tuition;
