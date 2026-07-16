import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft, Loader2, ClipboardList, CheckCircle2,
  Clock, AlertCircle, Star, User, BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Submission {
  id: number;
  submissionFileUrl: string;
  submittedAt: string;
  grade: string | null;
  feedback: string | null;
  gradedByName: string;
}

interface Assignment {
  id: number;
  courseId: number;
  title: string;
  description: string;
  fileUrl: string | null;
  deadline: string;
  submission: Submission | null;
}

interface Course {
  id: number;
  title: string;
  instructorId: number;
}

export const SubmissionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeInputs, setGradeInputs] = useState<Record<number, { grade: string; feedback: string }>>({});
  const [submittingGrade, setSubmittingGrade] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/courses');
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourse(res.data[0]);
        await fetchAssignments(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (courseId: number) => {
    try {
      // Use student endpoint - instructor can see all assignments
      const res = await api.get(`/api/lms/courses/${courseId}/assignments`);
      setAssignments(res.data);
      setSelectedAssignment(null);
      setSubmissions([]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubmissions = async (assignmentId: number) => {
    try {
      const res = await api.get(`/api/lms/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await fetchSubmissions(assignment.id);
  };

  const handleGrade = async (submissionId: number) => {
    const input = gradeInputs[submissionId];
    if (!input?.grade) return;
    setSubmittingGrade(submissionId);
    try {
      await api.post(`/api/lms/submissions/${submissionId}/grade`, {
        grade: input.grade,
        feedback: input.feedback || ''
      });
      setSuccessMsg(`Submission #${submissionId} graded successfully!`);
      if (selectedAssignment) await fetchSubmissions(selectedAssignment.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingGrade(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

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
        <div>
          <p className="text-xs text-primary font-bold uppercase tracking-wider">Instructor Panel</p>
          <h1 className="text-xl font-extrabold">Assignment Submissions & Grading</h1>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Course Selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} /> Courses
          </h2>
          {courses.map(course => (
            <button
              key={course.id}
              onClick={async () => {
                setSelectedCourse(course);
                await fetchAssignments(course.id);
              }}
              className={`w-full text-left p-3 rounded-xl border text-sm font-semibold transition-all ${
                selectedCourse?.id === course.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:bg-secondary/30 text-foreground'
              }`}
            >
              {course.title}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList size={14} /> Assignments
          </h2>
          {assignments.length === 0 ? (
            <div className="p-4 bg-card border border-dashed border-border rounded-2xl text-center text-sm text-muted-foreground">
              No assignments in this course.
            </div>
          ) : assignments.map(a => (
            <button
              key={a.id}
              onClick={() => handleSelectAssignment(a)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedAssignment?.id === a.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:bg-secondary/30'
              }`}
            >
              <p className="text-sm font-bold">{a.title}</p>
              <p className={`text-[11px] mt-1 font-medium ${
                new Date() > new Date(a.deadline) ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {new Date() > new Date(a.deadline) ? 'Deadline Passed' : `Due: ${new Date(a.deadline).toLocaleDateString()}`}
              </p>
            </button>
          ))}
        </div>

        {/* Submissions Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} /> Student Submissions
          </h2>
          {!selectedAssignment ? (
            <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center text-muted-foreground text-sm">
              <AlertCircle className="mx-auto mb-3" size={28} />
              Select an assignment to view submissions.
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center text-muted-foreground text-sm">
              <ClipboardList className="mx-auto mb-3" size={28} />
              No submissions yet for this assignment.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub, idx) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Submission #{sub.id}</p>
                      <a
                        href={sub.submissionFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                      >
                        View Submitted File →
                      </a>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock size={11} /> {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    {sub.grade && (
                      <span className={`text-2xl font-extrabold ${
                        sub.grade === 'A' || sub.grade === '100' ? 'text-emerald-500' :
                        sub.grade === 'B' ? 'text-blue-500' :
                        sub.grade === 'C' ? 'text-amber-500' : 'text-destructive'
                      }`}>
                        {sub.grade}
                      </span>
                    )}
                  </div>

                  {sub.feedback && (
                    <div className="bg-secondary/20 border border-border rounded-xl p-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1">Feedback:</p>
                      <p className="text-sm">{sub.feedback}</p>
                    </div>
                  )}

                  {/* Grading Form */}
                  <div className="border-t border-border pt-4 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Star size={11} /> Grade This Submission
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={gradeInputs[sub.id]?.grade || sub.grade || ''}
                        onChange={(e) => setGradeInputs(prev => ({
                          ...prev,
                          [sub.id]: { ...prev[sub.id], grade: e.target.value }
                        }))}
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Select Grade</option>
                        <option value="A">A (Excellent)</option>
                        <option value="B">B (Good)</option>
                        <option value="C">C (Average)</option>
                        <option value="D">D (Below Average)</option>
                        <option value="F">F (Fail)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Optional feedback..."
                        value={gradeInputs[sub.id]?.feedback || sub.feedback || ''}
                        onChange={(e) => setGradeInputs(prev => ({
                          ...prev,
                          [sub.id]: { ...prev[sub.id], feedback: e.target.value }
                        }))}
                        className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => handleGrade(sub.id)}
                        disabled={submittingGrade === sub.id || !gradeInputs[sub.id]?.grade}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 shrink-0"
                      >
                        {submittingGrade === sub.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <CheckCircle2 size={12} />}
                        Submit Grade
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
