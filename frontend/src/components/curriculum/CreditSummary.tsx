import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';

interface CreditSummaryProps {
  curriculum: any;
}

const CreditSummary = ({ curriculum }: CreditSummaryProps) => {
  if (!curriculum) return null;

  const totalCredits = curriculum.curriculumSemesters.reduce((acc: number, sem: any) => {
    return acc + sem.subjects.reduce((sum: number, s: any) => sum + s.subject.credits, 0);
  }, 0);

  const targetCredits = curriculum.totalCredits || 161;
  const isPerfect = totalCredits === targetCredits;
  const isDeficit = totalCredits < targetCredits;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${
          isPerfect ? 'bg-emerald-600 text-white shadow-emerald-200' : 
          isDeficit ? 'bg-amber-600 text-white shadow-amber-200' : 'bg-rose-600 text-white shadow-rose-200'
        }`}>
          {isPerfect ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tín chỉ</p>
          <div className="flex items-end gap-2">
            <h4 className="text-2xl font-black text-slate-900 leading-none">{totalCredits}</h4>
            <span className="text-xs font-bold text-slate-400">/ {targetCredits}</span>
          </div>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-4 bg-blue-50 p-4 rounded-3xl border border-blue-100">
        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
           <TrendingUp size={24} />
        </div>
        <div>
           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Học kỳ</p>
           <h4 className="text-2xl font-black text-slate-900 leading-none">{curriculum.totalSemesters}</h4>
        </div>
      </div>
    </div>
  );
};

export default CreditSummary;
