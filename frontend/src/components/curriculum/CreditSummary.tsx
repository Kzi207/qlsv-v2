import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';

interface CreditSummaryProps {
  curriculum: any;
}

const CreditSummary = ({ curriculum }: CreditSummaryProps) => {
  if (!curriculum) return null;

  // Actual semester count from the created data
  const actualSemesters = (curriculum.curriculumSemesters || []).length;

  // Safe credit calculation matching the updated backend structure
  const totalCredits = (curriculum.curriculumSemesters || []).reduce((acc: number, sem: any) => {
    const semCredits = (sem.subjects || []).reduce((sum: number, s: any) => {
      // Handle both old structure (s.subject.credits) and new structure (s.credits)
      const credits = s.credits || s.subject?.credits || 0;
      return sum + credits;
    }, 0);
    return acc + semCredits;
  }, 0);

  const targetCredits = curriculum.totalCredits || 161;
  const isPerfect = totalCredits === targetCredits;
  const isDeficit = totalCredits < targetCredits;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Credit Box - Standardized size */}
      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-100">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
          isPerfect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
          isDeficit ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
        }`}>
          {isPerfect ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Tổng tín chỉ</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <h4 className="text-xl font-bold text-slate-900 leading-none">{totalCredits}</h4>
            <span className="text-[10px] font-bold text-slate-400">/ {targetCredits}</span>
          </div>
        </div>
      </div>

      {/* Semester Box - Standardized size */}
      <div className="hidden sm:flex items-center gap-3 bg-blue-50 p-3 rounded-2xl border border-blue-100 shadow-sm transition-all hover:border-blue-200">
        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
           <TrendingUp size={20} />
        </div>
        <div>
           <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-tight">Số học kỳ</p>
           <h4 className="text-xl font-bold text-slate-900 mt-0.5 leading-none">{actualSemesters}</h4>
        </div>
      </div>
    </div>
  );
};

export default CreditSummary;
