import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft, Loader2, Trophy, CheckCircle2, XCircle,
  ChevronRight, Clock, HelpCircle, Zap, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  correctOptionIndices: number[];
  correctAnswerText: string;
  type: string;
  imageUrl: string;
  explanation: string;
}

interface Quiz {
  id: number;
  title: string;
  timeLimitMinutes: number;
  negativeMarking: boolean;
  passingScore: number;
  questions: Question[];
}

type PhaseType = 'intro' | 'quiz' | 'result';

export const QuizPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<PhaseType>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  
  // Advanced answers state
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({}); // questionIndex -> selected indices
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({}); // questionIndex -> short text input
  
  const [result, setResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchQuiz();
  }, [courseId]);

  // Countdown timer & Auto submit
  useEffect(() => {
    if (phase !== 'quiz' || !quiz || quiz.timeLimitMinutes === 0) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Load progress from localStorage
  useEffect(() => {
    if (!quiz) return;
    const progressKey = `quiz_progress_${quiz.id}`;
    const saved = localStorage.getItem(progressKey);
    if (saved) {
      try {
        const { selectedOptions: savedOpts, textAnswers: savedTexts, currentQ: savedQ, timeLeft: savedTime } = JSON.parse(saved);
        if (savedOpts) setSelectedOptions(savedOpts);
        if (savedTexts) setTextAnswers(savedTexts);
        if (savedQ !== undefined) setCurrentQ(savedQ);
        if (savedTime !== undefined) setTimeLeft(savedTime);
        setPhase('quiz'); // Direct resume if they reloaded during quiz
      } catch (e) {
        console.error("Failed to restore quiz progress:", e);
      }
    }
  }, [quiz]);

  // Persist progress to localStorage
  useEffect(() => {
    if (!quiz || phase !== 'quiz') return;
    const progressKey = `quiz_progress_${quiz.id}`;
    localStorage.setItem(progressKey, JSON.stringify({
      selectedOptions,
      textAnswers,
      currentQ,
      timeLeft
    }));
  }, [selectedOptions, textAnswers, currentQ, timeLeft, quiz, phase]);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/api/lms/courses/${courseId}/quiz`);
      setQuiz(res.data);
      
      // Initialize answer states
      const optsMap: Record<number, number[]> = {};
      const textsMap: Record<number, string> = {};
      (res.data.questions || []).forEach((_: any, idx: number) => {
        optsMap[idx] = [];
        textsMap[idx] = '';
      });
      setSelectedOptions(optsMap);
      setTextAnswers(textsMap);
    } catch (err) {
      console.error('Quiz not available', err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (quiz) {
      setTimeLeft(quiz.timeLimitMinutes * 60);
      setPhase('quiz');
    }
  };

  const selectOptionSingle = (optIdx: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [currentQ]: [optIdx]
    }));
  };

  const selectOptionMultiple = (optIdx: number) => {
    setSelectedOptions(prev => {
      const current = prev[currentQ] || [];
      const updated = current.includes(optIdx)
        ? current.filter(idx => idx !== optIdx)
        : [...current, optIdx];
      return {
        ...prev,
        [currentQ]: updated
      };
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      // Map frontend answering structures to backend expected lists
      const selectedAnswersPayload = quiz.questions.map((_, i) => {
        const opts = selectedOptions[i] || [];
        return opts.length > 0 ? opts : [-1];
      });
      const shortAnswersPayload = quiz.questions.map((_, i) => {
        return textAnswers[i] || '';
      });

      const res = await api.post(`/api/lms/quizzes/${quiz.id}/submit`, {
        selectedAnswers: selectedAnswersPayload,
        shortAnswers: shortAnswersPayload
      });
      
      setResult(res.data);
      setPhase('result');
      localStorage.removeItem(`quiz_progress_${quiz.id}`);
    } catch (err) {
      console.error('Submit error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-20 space-y-4">
        <HelpCircle className="mx-auto text-muted-foreground" size={40} />
        <p className="text-lg font-semibold text-muted-foreground">No quiz found for this course yet.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

  /* ── INTRO PHASE ── */
  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        <button
          onClick={() => navigate(`/student/classroom/${courseId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to Classroom
        </button>

        <div className="bg-card border border-border rounded-3xl p-10 text-center space-y-6 shadow-lg">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto shadow-xl">
            <Zap size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{quiz.title}</h1>
            <p className="text-muted-foreground text-sm mt-2">Test your knowledge on this course module.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-secondary/40 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-foreground">{quiz.questions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Questions</p>
            </div>
            <div className="bg-secondary/40 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-foreground">
                {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} min` : '∞'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Time Limit</p>
            </div>
            <div className="bg-secondary/40 rounded-2xl p-4">
              <p className="text-2xl font-extrabold text-foreground">{quiz.passingScore}%</p>
              <p className="text-xs text-muted-foreground mt-1">Pass Score</p>
            </div>
          </div>

          {quiz.negativeMarking && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold">
              ⚠️ Negative Marking is enabled. Wrong answers will deduct points.
            </div>
          )}

          <button
            onClick={startQuiz}
            className="w-full py-4 gradient-bg text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 transition-all text-base"
          >
            Begin Quiz <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── QUIZ PHASE ── */
  if (phase === 'quiz') {
    const question = quiz.questions[currentQ];
    const progress = ((currentQ + 1) / quiz.questions.length) * 100;
    const questionType = question.type || 'MCQ_SINGLE';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-6 py-4 shadow-sm">
          <div className="space-y-1 flex-1">
            <p className="text-xs text-muted-foreground font-semibold">
              Question {currentQ + 1} of {quiz.questions.length}
            </p>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {quiz.timeLimitMinutes > 0 && (
            <div className={`flex items-center gap-2 ml-6 font-bold text-lg ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                {questionType === 'MCQ_SINGLE' ? 'Single Choice MCQ' :
                 questionType === 'MCQ_MULTIPLE' ? 'Multiple Choice MCQ' :
                 questionType === 'TRUE_FALSE' ? 'True / False Question' : 'Short Text Answer'}
              </span>
            </div>

            <h2 className="text-lg font-bold leading-relaxed">{question.questionText}</h2>
            
            {question.imageUrl && (
              <img src={question.imageUrl} alt="Context" className="max-h-64 rounded-2xl object-contain bg-slate-900 border border-border w-full p-2" />
            )}

            {/* Answer inputs according to Type */}
            {questionType === 'TEXT_ANSWER' ? (
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Type your answer here..."
                  value={textAnswers[currentQ] || ''}
                  onChange={(e) => setTextAnswers(prev => ({ ...prev, [currentQ]: e.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl border border-border bg-secondary/20 text-sm font-semibold outline-none focus:border-primary focus:bg-card text-foreground"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {question.options.map((option, idx) => {
                  const isChecked = questionType === 'MCQ_MULTIPLE'
                    ? (selectedOptions[currentQ] || []).includes(idx)
                    : (selectedOptions[currentQ] || [])[0] === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (questionType === 'MCQ_MULTIPLE') {
                          selectOptionMultiple(idx);
                        } else {
                          selectOptionSingle(idx);
                        }
                      }}
                      className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all duration-200
                        ${isChecked
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30 shadow-sm'
                          : 'border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-bold mr-3
                        ${isChecked ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ((q) => Math.max(q - 1, 0))}
            disabled={currentQ === 0}
            className="px-5 py-2.5 border border-border bg-card rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-secondary transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {quiz.questions.map((_, idx) => {
              const isAnswered = (quiz.questions[idx].type === 'TEXT_ANSWER' 
                ? (textAnswers[idx] || '').trim() !== '' 
                : (selectedOptions[idx] || []).length > 0);
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQ(idx)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-colors
                    ${idx === currentQ
                      ? 'bg-primary text-white animate-pulse'
                      : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                        : 'bg-secondary text-muted-foreground border border-border'
                    }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentQ < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 gradient-bg text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-md shadow-primary/20 animate-bounce"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── RESULT PHASE ── */
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Score Card */}
      <div className={`rounded-3xl p-10 text-center space-y-4 shadow-xl border ${
        result.passed
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-destructive/10 border-destructive/20'
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg text-white ${
          result.passed ? 'bg-emerald-500' : 'bg-destructive'
        }`}>
          {result.passed ? <Trophy size={36} /> : <XCircle size={36} />}
        </div>
        <h2 className="text-2xl font-extrabold">
          {result.passed ? '🎉 Congratulations! You Passed!' : 'Better Luck Next Time!'}
        </h2>
        <p className={`text-4xl font-black ${result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
          {result.score}%
        </p>
        <p className="text-sm text-muted-foreground">
          Passing threshold: {quiz.passingScore}% •{' '}
          {result.passed ? `You earned +100 XP!` : 'You earned +10 XP for attempting.'}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => { setPhase('intro'); setCurrentQ(0); setSelectedOptions({}); setTextAnswers({}); }}
            className="px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-secondary transition-all"
          >
            <RefreshCw size={14} /> Retry Quiz
          </button>
          <button
            onClick={() => navigate(`/student/classroom/${courseId}`)}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            Back to Classroom
          </button>
        </div>
      </div>

      {/* Question Review (only if showCorrectAnswers is allowed or showScoreImmediately is allowed) */}
      {result.questionExplanations && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Question Review</h3>
          {result.questionExplanations.map((q: any, idx: number) => {
            const isCorrect = q.isCorrect;
            return (
              <div key={idx} className={`bg-card border rounded-2xl p-6 space-y-3 ${isCorrect ? 'border-emerald-500/30' : 'border-destructive/30'}`}>
                <div className="flex items-start gap-3">
                  {isCorrect
                    ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    : <XCircle size={18} className="text-destructive shrink-0 mt-0.5" />
                  }
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Q{idx + 1}</span>
                      <span className="text-[9px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {q.type || 'MCQ_SINGLE'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-1">{q.questionText}</p>
                  </div>
                </div>
                
                <div className="pl-6 space-y-2 text-xs">
                  {q.type === 'TEXT_ANSWER' ? (
                    <div className="space-y-1.5 border border-border rounded-xl p-3 bg-secondary/15">
                      <p className="text-muted-foreground font-semibold">
                        Your answer: <span className={`font-extrabold ${isCorrect ? 'text-emerald-600' : 'text-destructive'}`}>{q.submittedAnswerText || '(Skipped)'}</span>
                      </p>
                      <p className="text-muted-foreground font-semibold">
                        Correct solution: <span className="font-extrabold text-emerald-600">{q.correctAnswerText}</span>
                      </p>
                    </div>
                  ) : (
                    q.options.map((opt: string, oIdx: number) => {
                      const isSelected = q.type === 'MCQ_MULTIPLE'
                        ? q.selectedOptionIndices?.includes(oIdx)
                        : oIdx === q.selectedOptionIndex;
                      const isCorr = q.type === 'MCQ_MULTIPLE'
                        ? q.correctOptionIndices?.includes(oIdx)
                        : oIdx === q.correctOptionIndex;
                      
                      return (
                        <div
                          key={oIdx}
                          className={`px-3 py-2 rounded-lg font-medium border ${
                            isCorr ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                            isSelected && !isCorr ? 'bg-destructive/15 text-destructive border-destructive/30' :
                            'text-muted-foreground border-transparent'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                          {isCorr && <span className="ml-2 text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-extrabold">Correct Option</span>}
                          {isSelected && !isCorr && <span className="ml-2 text-[9px] bg-destructive text-white px-1.5 py-0.5 rounded font-extrabold">Your Selection</span>}
                        </div>
                      );
                    })
                  )}
                  
                  {q.explanation && (
                    <p className="text-muted-foreground pt-2 italic border-t border-border mt-2 leading-relaxed">💡 {q.explanation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
