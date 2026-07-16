import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft, Loader2, ClipboardList, Upload, CheckCircle2,
  Clock, AlertTriangle, ExternalLink, Award
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

export const AssignmentsPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/lms/courses/${courseId}/assignments`);
      setAssignments(res.data);
      if (res.data.length > 0) setSelectedAssignment(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionUrl) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post(`/api/lms/assignments/${selectedAssignment.id}/submit`, {
        submissionFileUrl: submissionUrl,
      });
      setSuccessMsg('Assignment submitted successfully! You earned +40 XP 🎉');
      setSubmissionUrl('');
      fetchAssignments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDeadline = (deadline: string) => new Date() > new Date(deadline);

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-muted-foreground';
    if (grade === 'A' || grade === '100') return 'text-emerald-500';
    if (grade === 'B') return 'text-blue-500';
    if (grade === 'C') return 'text-amber-500';
    return 'text-destructive';
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
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <button
          onClick={() => navigate(`/student/classroom/${courseId}`)}
          className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs text-primary font-bold uppercase tracking-wider">Course Assignments</p>
          <h1 className="text-xl font-extrabold">Submit Your Work</h1>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl space-y-3">
          <ClipboardList size={36} className="mx-auto text-muted-foreground" />
          <p className="font-semibold text-muted-foreground">No assignments for this course yet.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Assignment List */}
          <div className="space-y-3">
            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAssignment(a)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedAssignment?.id === a.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:bg-secondary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{a.title}</p>
                  {a.submission ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <ClipboardList size={16} className="text-muted-foreground shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock size={12} className={isPastDeadline(a.deadline) ? 'text-destructive' : 'text-muted-foreground'} />
                  <p className={`text-[11px] font-medium ${isPastDeadline(a.deadline) ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isPastDeadline(a.deadline) ? 'Deadline Passed' : `Due: ${new Date(a.deadline).toLocaleDateString()}`}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Assignment Detail */}
          {selectedAssignment && (
            <motion.div
              key={selectedAssignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Header */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold">{selectedAssignment.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedAssignment.description}</p>

                <div className="flex flex-wrap items-center gap-3">
                  {selectedAssignment.fileUrl && (
                    <a
                      href={selectedAssignment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary rounded-lg border border-border hover:border-primary transition-all"
                    >
                      <ExternalLink size={13} /> Download Brief
                    </a>
                  )}
                  <span className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                    isPastDeadline(selectedAssignment.deadline)
                      ? 'text-destructive border-destructive/30 bg-destructive/5'
                      : 'text-muted-foreground border-border bg-secondary'
                  }`}>
                    <Clock size={13} />
                    {isPastDeadline(selectedAssignment.deadline) ? 'Deadline Passed' : `Due: ${new Date(selectedAssignment.deadline).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Submission Status */}
              {selectedAssignment.submission ? (
                <div className="bg-card border border-emerald-500/30 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={18} />
                    <h3 className="font-bold">Assignment Submitted</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Submitted At</p>
                      <p className="font-medium mt-1">{new Date(selectedAssignment.submission.submittedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">File Link</p>
                      <a href={selectedAssignment.submission.submissionFileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium mt-1 block truncate">
                        View Submission
                      </a>
                    </div>
                  </div>

                  {selectedAssignment.submission.grade ? (
                    <div className="pt-4 border-t border-border space-y-3">
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-primary" />
                        <h4 className="font-bold">Instructor Feedback</h4>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Grade</p>
                          <p className={`text-2xl font-extrabold mt-1 ${getGradeColor(selectedAssignment.submission.grade)}`}>
                            {selectedAssignment.submission.grade}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Feedback</p>
                          <p className="font-medium mt-1 text-muted-foreground">{selectedAssignment.submission.feedback}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Graded by: {selectedAssignment.submission.gradedByName}</p>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-border flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                      <AlertTriangle size={14} />
                      <p>Awaiting instructor grade and feedback.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Submit Form */
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload size={18} className="text-primary" />
                    <h3 className="font-bold">Submit Your Work</h3>
                  </div>

                  {isPastDeadline(selectedAssignment.deadline) ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium">
                      The deadline for this assignment has passed. Submissions are closed.
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Submission File URL (Google Drive, GitHub, etc.)
                        </label>
                        <input
                          type="url"
                          required
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                          placeholder="https://github.com/your-username/project"
                          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                        />
                      </div>

                      {successMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl font-medium">
                          {successMsg}
                        </div>
                      )}
                      {errorMsg && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium">
                          {errorMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md shadow-primary/20"
                      >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        Submit Assignment
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
