import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle,
  AlertCircle,
  Timer,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const TakeExam: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/elearning/exams/${id}`);
      setExam(res.data);
      setTimeLeft((res.data.duration || 60) * 60);
    } catch (error) {
      toast.error('Không thể tải bài thi');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/elearning/exams/submit', {
        examId: id,
        answers
      });
      setResult(res.data);
      setIsFinished(true);
      toast.success('Đã nộp bài thành công!');
    } catch (error) {
      toast.error('Lỗi khi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, answers, isSubmitting, isFinished]);

  useEffect(() => {
    if (loading || isFinished) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft, isFinished, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-8 animate-fade-up">
        <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
           <CheckCircle size={48} />
        </div>
        <div className="space-y-2">
           <h1 className="text-3xl font-black text-slate-900">Kết quả bài thi</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{exam.title}</p>
        </div>
        
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 space-y-6">
           <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Điểm của bạn</span>
              <span className="text-7xl font-black text-indigo-600 tabular-nums">
                 {result?.score?.toFixed(1)}
              </span>
              <span className="text-lg font-black text-slate-300 mt-2">/ {exam.maxPoints}</span>
           </div>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
           Quay lại khóa học
        </button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-6 z-50 backdrop-blur-xl bg-white/90">
         <div className="flex items-center gap-6">
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
               <Timer size={24} />
            </div>
            <div>
               <h2 className="text-lg font-black text-slate-900 leading-none">{exam.title}</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Câu {currentQuestionIndex + 1} / {exam.questions.length}</p>
            </div>
         </div>

         <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${
           timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-900'
         }`}>
            <Clock size={20} />
            <span className="text-xl font-black tabular-nums">{formatTime(timeLeft)}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Main Question Area */}
         <div className="lg:col-span-2 space-y-8">
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/10 space-y-10"
            >
               <div className="space-y-4">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Câu hỏi {currentQuestionIndex + 1}</span>
                  <h3 className="text-xl font-black text-slate-900 leading-relaxed">{currentQuestion.question}</h3>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.options.map((option: any) => (
                    <button 
                      key={option.id}
                      onClick={() => setAnswers({ ...answers, [currentQuestion.id]: option.id })}
                      className={`group p-6 rounded-[2rem] border text-left transition-all flex items-center justify-between ${
                        answers[currentQuestion.id] === option.id 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02]' 
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-white hover:border-indigo-200'
                      }`}
                    >
                       <span className="text-sm font-bold">{option.content}</span>
                       <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                         answers[currentQuestion.id] === option.id 
                           ? 'border-white bg-white/20' 
                           : 'border-slate-300 group-hover:border-indigo-400'
                       }`}>
                          {answers[currentQuestion.id] === option.id && <div className="h-2.5 w-2.5 bg-white rounded-full" />}
                       </div>
                    </button>
                  ))}
               </div>
            </motion.div>

            <div className="flex items-center justify-between gap-4">
               <button 
                 disabled={currentQuestionIndex === 0}
                 onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                 className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-lg disabled:opacity-30 active:scale-95 transition-all"
               >
                  <ChevronLeft size={18} /> Câu trước
               </button>

               {currentQuestionIndex === exam.questions.length - 1 ? (
                 <button 
                   onClick={handleSubmit}
                   disabled={isSubmitting}
                   className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all"
                 >
                    {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài thi'} <Send size={18} />
                 </button>
               ) : (
                 <button 
                   onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                   className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                 >
                    Câu tiếp theo <ChevronRight size={18} />
                 </button>
               )}
            </div>
         </div>

         {/* Navigation Grid */}
         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách câu hỏi</h4>
               <div className="grid grid-cols-5 gap-3">
                  {exam.questions.map((_: any, index: number) => (
                    <button 
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`h-10 w-10 rounded-xl text-xs font-black transition-all flex items-center justify-center ${
                        currentQuestionIndex === index 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : answers[exam.questions[index].id] 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}
                    >
                       {index + 1}
                    </button>
                  ))}
               </div>
               
               <div className="pt-6 border-t border-slate-50 space-y-4">
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                     <div className="h-3 w-3 bg-indigo-600 rounded-sm" /> Đang xem
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                     <div className="h-3 w-3 bg-emerald-100 rounded-sm" /> Đã trả lời
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                     <div className="h-3 w-3 bg-slate-100 rounded-sm" /> Chưa trả lời
                  </div>
               </div>
            </div>

            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-start gap-4">
               <AlertCircle size={20} className="text-rose-600 shrink-0" />
               <p className="text-[10px] font-bold text-rose-600 leading-relaxed uppercase">Hệ thống sẽ tự động nộp bài khi thời gian kết thúc. Vui lòng kiểm tra kỹ các câu trả lời.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TakeExam;
