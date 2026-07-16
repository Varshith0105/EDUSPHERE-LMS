import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft, Loader2, Plus, Trash2, BookOpen, Award,
  ClipboardList, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Video, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Lesson {
  id: number;
  title: string;
  estimatedMinutes: number;
  sortOrder: number;
}

interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  type?: string;
  imageUrl?: string;
  explanation?: string;
  correctOptionIndices?: number[];
  correctAnswerText?: string;
}

interface Quiz {
  id: number;
  title: string;
  timeLimitMinutes: number;
  negativeMarking: boolean;
  passingScore: number;
  questions: Question[];
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
}

interface CourseDetail {
  id: number;
  title: string;
  status: string;
}

type ActiveTab = 'lessons' | 'quizzes' | 'assignments';

export const CourseManager: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('lessons');

  // Lesson form
  const [lessonForm, setLessonForm] = useState({
    title: '', videoUrl: '', content: '', estimatedMinutes: 10, sortOrder: 1
  });
  const [addingLesson, setAddingLesson] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  // Quiz form
  const [quizForm, setQuizForm] = useState({
    title: '', timeLimitMinutes: 30, negativeMarking: false, passingScore: 60, status: 'DRAFT', attemptsLimit: 1, showScoreImmediately: true, showCorrectAnswers: true
  });
  const [addingQuiz, setAddingQuiz] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);

  // Question form (per quiz)
  const [questionForms, setQuestionForms] = useState<Record<number, {
    questionText: string; options: string[]; correctOptionIndex: number; correctOptionIndices: number[]; correctAnswerText: string; type: string; imageUrl: string; explanation: string;
  }>>({});
  const [addingQuestion, setAddingQuestion] = useState<number | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', description: '', fileUrl: '', deadline: ''
  });
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (courseId) fetchData();
  }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes, lessonsRes, quizzesRes, assignmentsRes] = await Promise.all([
        api.get(`/api/courses/${courseId}`),
        api.get(`/api/courses/${courseId}/lessons`),
        api.get(`/api/lms/courses/${courseId}/quizzes`),
        api.get(`/api/lms/courses/${courseId}/assignments`)
      ]);
      setCourse(courseRes.data);
      // Sort lessons by sortOrder initially
      const sortedLessons = (lessonsRes.data || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
      setLessons(sortedLessons);
      setQuizzes(quizzesRes.data || []);
      setAssignments(assignmentsRes.data.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        deadline: a.deadline
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg: string, isError = false) => {
    if (isError) setErrorMsg(msg); else setSuccessMsg(msg);
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 3000);
  };

  // ---- Lessons ----
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingLesson(true);
    try {
      if (editingLessonId) {
        await api.put(`/api/courses/lessons/${editingLessonId}`, {
          ...lessonForm,
          externalLinks: []
        });
        showFeedback('Lesson updated successfully!');
      } else {
        await api.post(`/api/courses/${courseId}/lessons`, {
          ...lessonForm,
          externalLinks: []
        });
        showFeedback('Lesson added successfully!');
      }
      setLessonForm({ title: '', videoUrl: '', content: '', estimatedMinutes: 10, sortOrder: lessons.length + 1 });
      setEditingLessonId(null);
      setShowLessonForm(false);
      await fetchData();
    } catch (err: any) {
      showFeedback(err.response?.data?.message || 'Failed to save lesson.', true);
    } finally {
      setAddingLesson(false);
    }
  };

  const handleEditLesson = (lesson: any) => {
    setLessonForm({
      title: lesson.title,
      videoUrl: lesson.videoUrl || '',
      content: lesson.content || '',
      estimatedMinutes: lesson.estimatedMinutes,
      sortOrder: lesson.sortOrder
    });
    setEditingLessonId(lesson.id);
    setShowLessonForm(true);
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm('Delete this lesson? This cannot be undone.')) return;
    try {
      await api.delete(`/api/courses/lessons/${lessonId}`);
      showFeedback('Lesson deleted.');
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (err: any) {
      showFeedback('Failed to delete lesson.', true);
    }
  };

  const handleReorderLesson = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const reordered = [...lessons];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Update sort orders
    const updated = reordered.map((l, i) => ({ ...l, sortOrder: i + 1 }));
    setLessons(updated);

    try {
      const ids = updated.map(l => l.id);
      await api.post(`/api/courses/${courseId}/lessons/reorder`, ids);
      showFeedback('Lessons reordered successfully.');
    } catch (err) {
      showFeedback('Failed to reorder lessons.', true);
    }
  };

  // ---- Quizzes ----
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingQuiz(true);
    try {
      if (editingQuizId) {
        const res = await api.put(`/api/lms/quizzes/${editingQuizId}`, quizForm);
        setQuizzes(prev => prev.map(q => q.id === editingQuizId ? { ...q, ...res.data } : q));
        showFeedback('Quiz settings updated successfully!');
      } else {
        const res = await api.post(`/api/lms/courses/${courseId}/quizzes`, quizForm);
        setQuizzes(prev => [...prev, { ...res.data, questions: [] }]);
        showFeedback('Quiz created successfully!');
      }
      setQuizForm({ title: '', timeLimitMinutes: 30, negativeMarking: false, passingScore: 60, status: 'DRAFT', attemptsLimit: 1, showScoreImmediately: true, showCorrectAnswers: true });
      setEditingQuizId(null);
      setShowQuizForm(false);
    } catch (err: any) {
      showFeedback('Failed to save quiz.', true);
    } finally {
      setAddingQuiz(false);
    }
  };

  const handleEditQuizSettings = (quiz: Quiz) => {
    setQuizForm({
      title: quiz.title,
      timeLimitMinutes: quiz.timeLimitMinutes,
      negativeMarking: quiz.negativeMarking,
      passingScore: quiz.passingScore,
      status: (quiz as any).status || 'DRAFT',
      attemptsLimit: (quiz as any).attemptsLimit || 1,
      showScoreImmediately: (quiz as any).showScoreImmediately ?? true,
      showCorrectAnswers: (quiz as any).showCorrectAnswers ?? true
    });
    setEditingQuizId(quiz.id);
    setShowQuizForm(true);
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm('Delete this quiz and all its questions?')) return;
    try {
      await api.delete(`/api/lms/quizzes/${quizId}`);
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      showFeedback('Quiz deleted.');
    } catch (err: any) {
      showFeedback('Failed to delete quiz.', true);
    }
  };

  const handleAddQuestion = async (quizId: number, e: React.FormEvent) => {
    e.preventDefault();
    const form = questionForms[quizId];
    if (!form) return;
    setAddingQuestion(quizId);
    
    const questionType = form.type || 'MCQ_SINGLE';
    let options = form.options || ['', '', '', ''];
    let correctOptionIndex = form.correctOptionIndex ?? 0;
    let correctOptionIndices = form.correctOptionIndices || [];
    let correctAnswerText = form.correctAnswerText || '';

    if (questionType === 'TRUE_FALSE') {
      options = ['True', 'False'];
    } else if (questionType === 'TEXT_ANSWER') {
      options = [];
    }

    try {
      const res = await api.post(`/api/lms/quizzes/${quizId}/questions`, {
        questionText: form.questionText,
        options: options.filter(o => o.trim() !== ''),
        correctOptionIndex,
        correctOptionIndices,
        correctAnswerText,
        type: questionType,
        imageUrl: form.imageUrl || '',
        explanation: form.explanation || ''
      });
      setQuizzes(prev => prev.map(q =>
        q.id === quizId ? { ...q, questions: [...q.questions, res.data] } : q
      ));
      
      // Reset form
      setQuestionForms(prev => ({
        ...prev,
        [quizId]: {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          correctOptionIndices: [],
          correctAnswerText: '',
          type: 'MCQ_SINGLE',
          imageUrl: '',
          explanation: ''
        }
      }));
      showFeedback('Question added!');
    } catch (err: any) {
      showFeedback('Failed to add question.', true);
    } finally {
      setAddingQuestion(null);
    }
  };

  const handleDeleteQuestion = async (quizId: number, questionId: number) => {
    try {
      await api.delete(`/api/lms/questions/${questionId}`);
      setQuizzes(prev => prev.map(q =>
        q.id === quizId ? { ...q, questions: q.questions.filter(qu => qu.id !== questionId) } : q
      ));
      showFeedback('Question deleted.');
    } catch (err: any) {
      showFeedback('Failed to delete question.', true);
    }
  };

  // ---- Assignments ----
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAssignment(true);
    try {
      const res = await api.post(`/api/lms/courses/${courseId}/assignments`, {
        ...assignmentForm,
        deadline: new Date(assignmentForm.deadline).toISOString()
      });
      setAssignments(prev => [...prev, res.data]);
      setAssignmentForm({ title: '', description: '', fileUrl: '', deadline: '' });
      setShowAssignmentForm(false);
      showFeedback('Assignment created!');
    } catch (err: any) {
      showFeedback('Failed to create assignment.', true);
    } finally {
      setAddingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Delete this assignment and all submissions?')) return;
    try {
      await api.delete(`/api/lms/assignments/${assignmentId}`);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      showFeedback('Assignment deleted.');
    } catch (err: any) {
      showFeedback('Failed to delete assignment.', true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'lessons', label: 'Lessons', icon: Video },
    { id: 'quizzes', label: 'Quizzes', icon: Award },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <button
          onClick={() => navigate('/instructor/dashboard')}
          className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-primary font-bold uppercase tracking-wider">Course Manager</p>
          <h1 className="text-xl font-extrabold">{course?.title}</h1>
        </div>
        <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border ${
          course?.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
          'bg-amber-500/10 text-amber-600 border-amber-500/30'
        }`}>
          {course?.status}
        </span>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={15} /> {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-2xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ====== LESSONS TAB ====== */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-base">{lessons.length} Lessons</h2>
            <button
              onClick={() => {
                setEditingLessonId(null);
                setLessonForm({ title: '', videoUrl: '', content: '', estimatedMinutes: 10, sortOrder: lessons.length + 1 });
                setShowLessonForm(!showLessonForm);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all"
            >
              <Plus size={15} /> Add Lesson
            </button>
          </div>

          <AnimatePresence>
            {showLessonForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddLesson}
                className="bg-card border border-border rounded-2xl p-5 space-y-4 overflow-hidden"
              >
                <h3 className="font-bold text-sm">{editingLessonId ? 'Edit Lesson Details' : 'New Lesson Details'}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input required type="text" placeholder="Lesson Title *" value={lessonForm.title}
                    onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))}
                    className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                  <input type="text" placeholder="Video URL (YouTube / mp4)" value={lessonForm.videoUrl}
                    onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))}
                    className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                  <input type="number" placeholder="Duration (minutes)" min={1} value={lessonForm.estimatedMinutes}
                    onChange={e => setLessonForm(p => ({ ...p, estimatedMinutes: Number(e.target.value) }))}
                    className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                  <input type="number" placeholder="Sort Order" min={1} value={lessonForm.sortOrder}
                    onChange={e => setLessonForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                    className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>
                <textarea placeholder="Lesson content / notes..." value={lessonForm.content}
                  onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary h-24 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowLessonForm(false); setEditingLessonId(null); }}
                    className="px-4 py-2 text-sm font-bold border border-border rounded-xl hover:bg-secondary transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingLesson}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-60">
                    {addingLesson ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingLessonId ? 'Update Lesson' : 'Save Lesson'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {lessons.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl text-muted-foreground">
              <BookOpen size={32} className="mx-auto mb-3" /> No lessons yet. Add your first lesson!
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson, idx) => (
                <motion.div key={lesson.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                  className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-lg">#{lesson.sortOrder}</span>
                    <div>
                      <p className="font-bold text-sm">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">{lesson.estimatedMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleReorderLesson(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-secondary rounded-lg transition-all"
                      title="Move Up"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button 
                      onClick={() => handleReorderLesson(idx, 'down')}
                      disabled={idx === lessons.length - 1}
                      className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-secondary rounded-lg transition-all"
                      title="Move Down"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button 
                      onClick={() => handleEditLesson(lesson)}
                      className="px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====== QUIZZES TAB ====== */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-base">{quizzes.length} Quizzes</h2>
            <button onClick={() => {
              setEditingQuizId(null);
              setQuizForm({ title: '', timeLimitMinutes: 30, negativeMarking: false, passingScore: 60, status: 'DRAFT', attemptsLimit: 1, showScoreImmediately: true, showCorrectAnswers: true });
              setShowQuizForm(!showQuizForm);
            }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90">
              <Plus size={15} /> Create Quiz
            </button>
          </div>

          <AnimatePresence>
            {showQuizForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateQuiz}
                className="bg-card border border-border rounded-2xl p-5 space-y-4 overflow-hidden"
              >
                <h3 className="font-bold text-sm">{editingQuizId ? 'Edit Quiz Settings' : 'New Quiz Settings'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Quiz Title *</label>
                    <input required type="text" placeholder="Title" value={quizForm.title}
                      onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))}
                      className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Time Limit (mins)</label>
                    <input type="number" placeholder="Time Limit" min={1} value={quizForm.timeLimitMinutes}
                      onChange={e => setQuizForm(p => ({ ...p, timeLimitMinutes: Number(e.target.value) }))}
                      className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Passing Score (%)</label>
                    <input type="number" placeholder="Passing Score" min={0} max={100} value={quizForm.passingScore}
                      onChange={e => setQuizForm(p => ({ ...p, passingScore: Number(e.target.value) }))}
                      className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Attempts Limit</label>
                    <input type="number" placeholder="Attempts Limit" min={1} value={quizForm.attemptsLimit}
                      onChange={e => setQuizForm(p => ({ ...p, attemptsLimit: Number(e.target.value) }))}
                      className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase">Publish Status</label>
                    <select value={quizForm.status}
                      onChange={e => setQuizForm(p => ({ ...p, status: e.target.value }))}
                      className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs outline-none focus:border-primary"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold pt-6">
                    <input type="checkbox" checked={quizForm.negativeMarking}
                      onChange={e => setQuizForm(p => ({ ...p, negativeMarking: e.target.checked }))}
                      className="w-4 h-4 rounded" />
                    Negative Marking
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold pt-6">
                    <input type="checkbox" checked={quizForm.showScoreImmediately}
                      onChange={e => setQuizForm(p => ({ ...p, showScoreImmediately: e.target.checked }))}
                      className="w-4 h-4 rounded" />
                    Show Score Instantly
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold pt-6">
                    <input type="checkbox" checked={quizForm.showCorrectAnswers}
                      onChange={e => setQuizForm(p => ({ ...p, showCorrectAnswers: e.target.checked }))}
                      className="w-4 h-4 rounded" />
                    Show Correct Solutions
                  </label>
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowQuizForm(false); setEditingQuizId(null); }}
                    className="px-4 py-2 text-sm font-bold border border-border rounded-xl hover:bg-secondary">Cancel</button>
                  <button type="submit" disabled={addingQuiz}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-60">
                    {addingQuiz ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingQuizId ? 'Update Quiz' : 'Create Quiz'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {quizzes.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl text-muted-foreground">
              <Award size={32} className="mx-auto mb-3" /> No quizzes yet. Create one to test your students!
            </div>
          ) : quizzes.map(quiz => (
            <div key={quiz.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-secondary/20"
                onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}>
                <div className="flex items-center gap-3">
                  <Award size={16} className="text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{quiz.title}</p>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border ${
                        (quiz as any).status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-secondary text-muted-foreground border-border'
                      }`}>
                        {(quiz as any).status || 'DRAFT'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{quiz.timeLimitMinutes} min · Pass: {quiz.passingScore}% · {quiz.questions.length} questions
                      {quiz.negativeMarking && <span className="ml-2 text-amber-500 font-semibold">Negative Marking ON</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditQuizSettings(quiz); }}
                    className="px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-all">
                    Edit Settings
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz.id); }}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                  {expandedQuiz === quiz.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              <AnimatePresence>
                {expandedQuiz === quiz.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      {/* Questions List */}
                      {quiz.questions.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No questions yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {quiz.questions.map((q, idx) => (
                            <div key={q.id} className="flex items-start justify-between p-3 bg-secondary/20 rounded-xl border border-border">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border">Q{idx + 1}</span>
                                  <span className="text-[9px] font-bold uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                    {q.type || 'MCQ_SINGLE'}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-foreground pt-1">{q.questionText}</p>
                                {q.imageUrl && (
                                  <img src={q.imageUrl} alt="Attached" className="max-h-24 rounded border border-border object-contain bg-black mt-1" />
                                )}
                                
                                {q.type === 'TEXT_ANSWER' ? (
                                  <p className="text-[11px] text-muted-foreground">
                                    Correct Answer: <span className="font-extrabold text-emerald-600">{(q as any).correctAnswerText}</span>
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {q.options.map((opt, oi) => {
                                      const isCorrect = q.type === 'MCQ_MULTIPLE'
                                        ? (q as any).correctOptionIndices?.includes(oi)
                                        : oi === q.correctOptionIndex;
                                      return (
                                        <span key={oi} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                          isCorrect
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30'
                                            : 'bg-card text-muted-foreground border-border'
                                        }`}>{opt}</span>
                                      );
                                    })}
                                  </div>
                                )}
                                {q.explanation && (
                                  <p className="text-[10px] text-muted-foreground/80 italic mt-1.5">💡 {q.explanation}</p>
                                )}
                              </div>
                              <button onClick={() => handleDeleteQuestion(quiz.id, q.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg ml-2 shrink-0">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Question Form */}
                      <div className="bg-secondary/10 border border-border rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Question</p>
                          <select
                            value={questionForms[quiz.id]?.type || 'MCQ_SINGLE'}
                            onChange={e => {
                              const selectedType = e.target.value;
                              setQuestionForms(p => ({
                                ...p,
                                [quiz.id]: {
                                  ...p[quiz.id],
                                  type: selectedType,
                                  options: selectedType === 'TRUE_FALSE' ? ['True', 'False'] : ['', '', '', ''],
                                  correctOptionIndex: 0,
                                  correctOptionIndices: [],
                                  correctAnswerText: ''
                                }
                              }));
                            }}
                            className="bg-card border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-primary font-semibold"
                          >
                            <option value="MCQ_SINGLE">Single Choice MCQ</option>
                            <option value="MCQ_MULTIPLE">Multiple Choice MCQ</option>
                            <option value="TRUE_FALSE">True / False</option>
                            <option value="TEXT_ANSWER">Short Text Answer</option>
                          </select>
                        </div>
                        
                        <textarea
                          placeholder="Question text *"
                          value={questionForms[quiz.id]?.questionText || ''}
                          onChange={e => setQuestionForms(p => ({
                            ...p, [quiz.id]: {
                              ...p[quiz.id],
                              questionText: e.target.value,
                              options: p[quiz.id]?.options || ['', '', '', ''],
                              correctOptionIndex: p[quiz.id]?.correctOptionIndex ?? 0,
                              correctOptionIndices: p[quiz.id]?.correctOptionIndices || [],
                              correctAnswerText: p[quiz.id]?.correctAnswerText || '',
                              type: p[quiz.id]?.type || 'MCQ_SINGLE',
                              imageUrl: p[quiz.id]?.imageUrl || '',
                              explanation: p[quiz.id]?.explanation || ''
                            }
                          }))}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:border-primary h-16 resize-none"
                        />

                        {/* Image Attachment */}
                        <input
                          type="text"
                          placeholder="Optional image attachment URL (http://...)"
                          value={questionForms[quiz.id]?.imageUrl || ''}
                          onChange={e => setQuestionForms(p => ({
                            ...p, [quiz.id]: { ...p[quiz.id], imageUrl: e.target.value }
                          }))}
                          className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:border-primary"
                        />

                        {/* MCQ_SINGLE */}
                        {(questionForms[quiz.id]?.type === 'MCQ_SINGLE' || !questionForms[quiz.id]?.type) && (
                          <div className="grid grid-cols-2 gap-2">
                            {[0, 1, 2, 3].map(oi => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="radio"
                                  name={`correct-${quiz.id}`}
                                  checked={(questionForms[quiz.id]?.correctOptionIndex ?? 0) === oi}
                                  onChange={() => setQuestionForms(p => ({
                                    ...p, [quiz.id]: { ...p[quiz.id], correctOptionIndex: oi }
                                  }))}
                                  className="accent-primary"
                                />
                                <input type="text" placeholder={`Option ${oi + 1}`}
                                  value={questionForms[quiz.id]?.options?.[oi] || ''}
                                  onChange={e => {
                                    const opts = [...(questionForms[quiz.id]?.options || ['', '', '', ''])];
                                    opts[oi] = e.target.value;
                                    setQuestionForms(p => ({ ...p, [quiz.id]: { ...p[quiz.id], options: opts } }));
                                  }}
                                  className="flex-1 px-2 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:border-primary"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* MCQ_MULTIPLE */}
                        {questionForms[quiz.id]?.type === 'MCQ_MULTIPLE' && (
                          <div className="grid grid-cols-2 gap-2">
                            {[0, 1, 2, 3].map(oi => (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="checkbox"
                                  checked={(questionForms[quiz.id]?.correctOptionIndices || []).includes(oi)}
                                  onChange={(e) => {
                                    const currentIndices = questionForms[quiz.id]?.correctOptionIndices || [];
                                    const updatedIndices = e.target.checked
                                      ? [...currentIndices, oi]
                                      : currentIndices.filter(x => x !== oi);
                                    setQuestionForms(p => ({
                                      ...p, [quiz.id]: { ...p[quiz.id], correctOptionIndices: updatedIndices }
                                    }));
                                  }}
                                  className="accent-primary w-4 h-4 rounded"
                                />
                                <input type="text" placeholder={`Option ${oi + 1}`}
                                  value={questionForms[quiz.id]?.options?.[oi] || ''}
                                  onChange={e => {
                                    const opts = [...(questionForms[quiz.id]?.options || ['', '', '', ''])];
                                    opts[oi] = e.target.value;
                                    setQuestionForms(p => ({ ...p, [quiz.id]: { ...p[quiz.id], options: opts } }));
                                  }}
                                  className="flex-1 px-2 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:border-primary"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* TRUE_FALSE */}
                        {questionForms[quiz.id]?.type === 'TRUE_FALSE' && (
                          <div className="flex gap-6 items-center bg-card p-3 rounded-lg border border-border">
                            <span className="text-xs font-semibold text-muted-foreground">Select Correct:</span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                              <input type="radio" name={`tf-correct-${quiz.id}`}
                                checked={(questionForms[quiz.id]?.correctOptionIndex ?? 0) === 0}
                                onChange={() => setQuestionForms(p => ({ ...p, [quiz.id]: { ...p[quiz.id], correctOptionIndex: 0 } }))}
                                className="accent-primary" />
                              True
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                              <input type="radio" name={`tf-correct-${quiz.id}`}
                                checked={(questionForms[quiz.id]?.correctOptionIndex ?? 0) === 1}
                                onChange={() => setQuestionForms(p => ({ ...p, [quiz.id]: { ...p[quiz.id], correctOptionIndex: 1 } }))}
                                className="accent-primary" />
                              False
                            </label>
                          </div>
                        )}

                        {/* TEXT_ANSWER */}
                        {questionForms[quiz.id]?.type === 'TEXT_ANSWER' && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-muted-foreground font-bold uppercase">Correct Text Answer *</label>
                            <input
                              type="text"
                              placeholder="Type correct short answer..."
                              value={questionForms[quiz.id]?.correctAnswerText || ''}
                              onChange={e => setQuestionForms(p => ({
                                ...p, [quiz.id]: { ...p[quiz.id], correctAnswerText: e.target.value }
                              }))}
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:border-primary"
                            />
                          </div>
                        )}

                        <input type="text" placeholder="Explanation / Rubric (optional)"
                          value={questionForms[quiz.id]?.explanation || ''}
                          onChange={e => setQuestionForms(p => ({
                            ...p, [quiz.id]: { ...p[quiz.id], explanation: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:border-primary"
                        />
                        <button
                          onClick={(e) => handleAddQuestion(quiz.id, e as unknown as React.FormEvent)}
                          disabled={addingQuestion === quiz.id || !questionForms[quiz.id]?.questionText}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-60"
                        >
                          {addingQuestion === quiz.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Add Question
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* ====== ASSIGNMENTS TAB ====== */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-base">{assignments.length} Assignments</h2>
            <button onClick={() => setShowAssignmentForm(!showAssignmentForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90">
              <Plus size={15} /> Create Assignment
            </button>
          </div>

          <AnimatePresence>
            {showAssignmentForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateAssignment}
                className="bg-card border border-border rounded-2xl p-5 space-y-4 overflow-hidden"
              >
                <h3 className="font-bold text-sm">New Assignment</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input required type="text" placeholder="Assignment Title *" value={assignmentForm.title}
                    onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))}
                    className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                  <input required type="datetime-local" placeholder="Deadline *" value={assignmentForm.deadline}
                    onChange={e => setAssignmentForm(p => ({ ...p, deadline: e.target.value }))}
                    className="px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary"
                  />
                </div>
                <textarea required placeholder="Assignment description / instructions *" value={assignmentForm.description}
                  onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary h-24 resize-none"
                />
                <input type="text" placeholder="Reference file URL (optional)" value={assignmentForm.fileUrl}
                  onChange={e => setAssignmentForm(p => ({ ...p, fileUrl: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:border-primary"
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAssignmentForm(false)}
                    className="px-4 py-2 text-sm font-bold border border-border rounded-xl hover:bg-secondary">Cancel</button>
                  <button type="submit" disabled={addingAssignment}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-60">
                    {addingAssignment ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Create
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {assignments.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl text-muted-foreground">
              <ClipboardList size={32} className="mx-auto mb-3" /> No assignments yet.
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a, idx) => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>
                    <p className={`text-[11px] font-semibold mt-1 ${
                      new Date() > new Date(a.deadline) ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {new Date() > new Date(a.deadline) ? 'DEADLINE PASSED' : `Due: ${new Date(a.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteAssignment(a.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
