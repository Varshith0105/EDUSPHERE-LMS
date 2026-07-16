import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Play, CheckCircle, Circle, ArrowLeft, Download, BookOpen, 
  FileText, Award, MessageSquare, ChevronRight, Loader2, Save,
  Bookmark, ExternalLink, BookmarkCheck, Sparkles, Send, Bot, User
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Lesson {
  id: number;
  title: string;
  content: string;
  videoUrl: string;
  pdfUrl?: string;
  imageUrl?: string;
  codeExamples?: string;
  externalLinks: string[];
  estimatedMinutes: number;
  completed: boolean;
  bookmarked: boolean;
  notes: string;
  lastWatchedSeconds: number;
}

interface Course {
  id: number;
  title: string;
  instructorName: string;
}

export const VideoPlayer: React.FC = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'resources' | 'forum' | 'assistant'>('content');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: "Hello! I am your EduSphere AI Study companion. I have full context of this lesson's syllabus. How can I help you learn today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [certificateUuid, setCertificateUuid] = useState<string | null>(null);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchClassroomDetails();
  }, [courseId]);

  const fetchClassroomDetails = async () => {
    try {
      setLoading(true);
      // Fetch course
      const courseRes = await api.get(`/api/courses/${courseId}`);
      setCourse(courseRes.data);

      // Fetch lessons with progress
      const lessonsRes = await api.get(`/api/lms/courses/${courseId}/lessons-with-progress`);
      setLessons(lessonsRes.data);
      if (lessonsRes.data.length > 0) {
        setNotesText(lessonsRes.data[0].notes || '');
      }

      // Check if certificate exists (course 100% completed)
      try {
        const certRes = await api.get(`/api/lms/courses/${courseId}/certificate`);
        setCertificateUuid(certRes.data.certificateUuid);
      } catch (e) {
        // No certificate generated yet
      }

      // Fetch forums
      const forumRes = await api.get(`/api/lms/courses/${courseId}/forum`);
      setForumPosts(forumRes.data);

    } catch (err) {
      console.error('Error fetching details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonChange = (idx: number) => {
    setCurrentLessonIdx(idx);
    setNotesText(lessons[idx].notes || '');
  };

  const toggleLessonCompleted = async () => {
    const lesson = lessons[currentLessonIdx];
    setCompleting(true);
    try {
      await api.put(`/api/lms/lessons/${lesson.id}/progress`, {
        completed: !lesson.completed,
        bookmarked: lesson.bookmarked,
        notes: notesText,
        lastWatchedSeconds: 0
      });
      
      // Update local state
      const updated = [...lessons];
      updated[currentLessonIdx].completed = !lesson.completed;
      setLessons(updated);
      
      // Recalculate progress, fetch certificate if 100%
      const completedCount = updated.filter(l => l.completed).length;
      if (completedCount === updated.length) {
        fetchClassroomDetails(); // Will generate and pull certificate
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveNotes = async () => {
    const lesson = lessons[currentLessonIdx];
    setSavingNotes(true);
    try {
      await api.put(`/api/lms/lessons/${lesson.id}/progress`, {
        completed: lesson.completed,
        bookmarked: lesson.bookmarked,
        notes: notesText,
        lastWatchedSeconds: 0
      });
      const updated = [...lessons];
      updated[currentLessonIdx].notes = notesText;
      setLessons(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleBookmark = async () => {
    const lesson = lessons[currentLessonIdx];
    try {
      await api.put(`/api/lms/lessons/${lesson.id}/progress`, {
        completed: lesson.completed,
        bookmarked: !lesson.bookmarked,
        notes: notesText,
        lastWatchedSeconds: 0
      });
      const updated = [...lessons];
      updated[currentLessonIdx].bookmarked = !lesson.bookmarked;
      setLessons(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) return;
    try {
      const res = await api.post(`/api/lms/courses/${courseId}/forum`, {
        title: newPostTitle,
        content: newPostContent
      });
      setForumPosts([res.data, ...forumPosts]);
      setNewPostTitle('');
      setNewPostContent('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const nextMessages = [...chatMessages, { sender: 'user' as const, text: query }];
    setChatMessages(nextMessages);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      const lower = query.toLowerCase();
      if (lower.includes("summarize") || lower.includes("summary")) {
        reply = `Here is a custom summary of "${currentLesson?.title || 'this lesson'}":\n\nThis lesson introduces core parameters and builds foundational competencies. It covers the following key focus areas:\n1. Key abstractions and setups.\n2. Implementation patterns in the codebase.\n3. Testing execution routines to verify operations.\n\nRecommended next step: review the Code Example tab.`;
      } else if (lower.includes("explain") || lower.includes("difficult")) {
        reply = `Certainly! Let's break down the complex parts of "${currentLesson?.title || 'this topic'}":\n\n1. **Core Concept:** Understanding how state context synchronizes with data updates.\n2. **Gotchas:** Be careful to prevent unnecessary re-renders when passing objects. Always memoize callback handlers.\n3. **Practical Tip:** Use hooks like useMemo or useCallback when dealing with large arrays.`;
      } else if (lower.includes("quiz") || lower.includes("exam")) {
        reply = `Here is a practice quiz checkpoint for "${currentLesson?.title || 'this lesson'}":\n\n**Question:** Which react hook is ideal for handling side effects when data updates?\n- *A) useState*\n- *B) useEffect* (Correct! Explain: useEffect triggers actions in response to state transitions/render updates.)\n- *C) useRef*\n\nWould you like me to construct another custom problem?`;
      } else {
        reply = `I've analyzed your question relative to "${currentLesson?.title || 'this topic'}". To ensure complete mastery of this module, focus on:\n\n- The context: ${currentLesson?.content?.substring(0, 120) || 'Lesson materials'}...\n- Practical exercises matching these requirements.\n\nLet me know if you want me to write code snippets or explain the syllabus in detail!`;
      }

      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const currentLesson = lessons[currentLessonIdx];
  const progressPercentage = lessons.length > 0
    ? (lessons.filter(l => l.completed).length / lessons.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Classroom Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Classroom</span>
            <h1 className="text-xl font-extrabold tracking-tight mt-0.5">{course?.title}</h1>
          </div>
        </div>

        {/* Progress Bar & Certificate */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-semibold">Course Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${progressPercentage}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          {/* Certificate Download */}
          {certificateUuid ? (
            <button
              onClick={() => navigate(`/student/certificate/${courseId}`)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
            >
              <Award size={16} /> Certificate
            </button>
          ) : (
            <button
              disabled
              title="Complete all lessons to generate your certificate."
              className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-xl text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
            >
              <Award size={16} /> Locked
            </button>
          )}
          
          <button
            onClick={() => navigate(`/student/quiz/${courseId}`)}
            className="px-4 py-2.5 bg-primary hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10"
          >
            Take Exam Quiz
          </button>
          <button
            onClick={() => navigate(`/student/assignments/${courseId}`)}
            className="px-4 py-2.5 bg-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/10"
          >
            Assignments
          </button>
        </div>
      </div>

      {/* Classroom Pane Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Pane (Player + Tabs) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video element */}
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-lg border border-border relative">
            {currentLesson ? (
              <video 
                key={currentLesson.id}
                src={currentLesson.videoUrl} 
                controls 
                className="w-full h-full object-contain"
                poster={currentLesson.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800'}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No video loaded.
              </div>
            )}
          </div>

          {/* Lesson Action Controls */}
          <div className="flex items-center justify-between bg-card border border-border p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLessonCompleted}
                disabled={completing}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors
                  ${currentLesson?.completed
                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                    : 'bg-primary text-white hover:opacity-95'}`}
              >
                {currentLesson?.completed ? (
                  <><CheckCircle size={14} /> Completed</>
                ) : (
                  <><Circle size={14} /> Mark Complete</>
                )}
              </button>

              <button 
                onClick={handleToggleBookmark}
                className="p-2 text-muted-foreground hover:text-primary rounded-xl hover:bg-secondary transition-colors"
              >
                {currentLesson?.bookmarked ? <BookmarkCheck size={18} className="text-primary" /> : <Bookmark size={18} />}
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground font-semibold">
              Estimated duration: {currentLesson?.estimatedMinutes} mins
            </p>
          </div>

          {/* Secondary details tabs */}
          <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
            <div className="flex border-b border-border bg-secondary/30">
              {(['content', 'notes', 'resources', 'forum', 'assistant'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1
                    ${activeTab === tab 
                      ? 'border-b-2 border-primary text-primary bg-card' 
                      : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab === 'assistant' && <Sparkles size={12} className="text-primary animate-pulse" />}
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">{currentLesson?.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{currentLesson?.content}</p>
                  
                  {currentLesson?.codeExamples && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Code Example</h4>
                      <pre className="bg-secondary/60 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-border">
                        {currentLesson.codeExamples}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">Personal Notes</h3>
                    <button 
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:opacity-90 transition-all"
                    >
                      {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                    </button>
                  </div>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Jot down notes for this specific lesson. These notes will persist in your profile..."
                    className="w-full h-40 bg-secondary/30 border border-border rounded-xl p-4 text-sm outline-none focus:border-primary resize-none"
                  />
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm">Downloadable Attachments</h3>
                  <div className="grid gap-3">
                    {currentLesson?.pdfUrl && (
                      <a 
                        href={currentLesson.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 rounded-xl border border-border hover:border-primary bg-secondary/10 flex items-center justify-between text-sm transition-all"
                      >
                        <span className="flex items-center gap-2 font-medium"><FileText size={16} className="text-primary" /> Lesson Syllabus PDF</span>
                        <Download size={16} className="text-muted-foreground" />
                      </a>
                    )}
                    {currentLesson?.externalLinks && currentLesson.externalLinks.map((link, idx) => (
                      <a 
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 rounded-xl border border-border hover:border-primary bg-secondary/10 flex items-center justify-between text-sm transition-all"
                      >
                        <span className="flex items-center gap-2 font-medium"><ExternalLink size={16} className="text-primary" /> Reference Link #{idx+1}</span>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'forum' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-sm">Course Discussions</h3>
                  
                  {/* Create post form */}
                  <form onSubmit={handlePostForum} className="space-y-3 bg-secondary/20 p-4 border border-border rounded-2xl">
                    <input 
                      type="text" 
                      placeholder="Question Title (e.g. useQuery generic types)"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                    />
                    <textarea 
                      placeholder="Add details about your question..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary h-20 resize-none"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:opacity-90"
                    >
                      <MessageSquare size={12} /> Post Question
                    </button>
                  </form>

                  {/* List posts */}
                  <div className="space-y-4">
                    {forumPosts.map((post) => (
                      <div key={post.id} className="p-4 border border-border rounded-2xl space-y-2 bg-secondary/10">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-foreground">{post.title}</h4>
                          {post.pinned && <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">Pinned</span>}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{post.content}</p>
                        <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground/60 font-semibold border-t border-border/50">
                          <img src={post.userProfilePic} alt="" className="w-4 h-4 rounded-full" />
                          <span>By {post.username}</span>
                          <span>•</span>
                          <span>{post.replies?.length || 0} Replies</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'assistant' && (
                <div className="space-y-4 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-bold text-sm flex items-center gap-1.5 text-primary">
                      <Sparkles size={16} /> EduSphere AI Assistant
                    </h3>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                      Online Context
                    </span>
                  </div>

                  {/* Chat messages stream */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs scrollbar-thin">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'assistant' && (
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Bot size={13} />
                          </div>
                        )}
                        <div className={`p-3 rounded-2xl max-w-[80%] whitespace-pre-line leading-relaxed border
                          ${msg.sender === 'user'
                            ? 'bg-primary text-white border-primary/25 rounded-tr-none'
                            : 'bg-secondary/40 text-foreground border-border/60 rounded-tl-none'}`}
                        >
                          {msg.text}
                        </div>
                        {msg.sender === 'user' && (
                          <div className="w-6 h-6 rounded-lg bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border">
                            <User size={13} />
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-center gap-2 text-muted-foreground text-[10px] pl-8">
                        <Bot size={11} className="animate-spin text-primary" /> Copilot is drafting a response...
                      </div>
                    )}
                  </div>

                  {/* Quick prompt chips */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                    {[
                      { label: "Summarize this lesson", text: "Please provide a detailed summary of this lesson." },
                      { label: "Explain difficult terms", text: "Can you explain the most challenging parts of this topic?" },
                      { label: "Give me a practice quiz", text: "Create a customized practice quiz question for this lesson." }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(chip.text)}
                        className="px-2.5 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-[10px] font-bold text-muted-foreground border border-border transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Ask the AI Assistant about this lesson..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendChat();
                      }}
                      className="flex-1 bg-secondary/35 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary placeholder-muted-foreground"
                    />
                    <button
                      onClick={() => handleSendChat()}
                      className="p-2.5 bg-primary text-white rounded-xl shadow-md shadow-primary/10 hover:opacity-95 transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane (Lessons List) */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" /> Syllabus Course Content
          </h3>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {lessons.map((lesson, idx) => {
              const isSelected = idx === currentLessonIdx;
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleLessonChange(idx)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 group transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border bg-card text-foreground hover:bg-secondary/40'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <p className="text-xs font-bold truncate pr-2">{lesson.title}</p>
                  </div>

                  <div className="shrink-0">
                    {lesson.completed ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground/45 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
