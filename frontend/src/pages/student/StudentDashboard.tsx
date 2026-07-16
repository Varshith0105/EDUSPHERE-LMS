import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  BookOpen, Trophy, Flame, Play, Clock, Search, Filter, 
  ChevronRight, Star, GraduationCap, AlertCircle, Award,
  Calendar, CheckCircle, ClipboardList, TrendingUp, Sparkles, BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface Course {
  id: number;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  price: number;
  isFree: boolean;
  durationHours: number;
  instructorName: string;
  categoryName: string;
  status: string;
}

interface Enrollment {
  id: number;
  course: Course;
  progressPercentage: number;
  completed: boolean;
}

export const StudentDashboard: React.FC = () => {
  const { user, updateUserXpAndStreak } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  
  // Dashboard Tabs: 'overview' | 'analytics' | 'catalog'
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'catalog'>('overview');
  
  // Recently viewed courses logic
  const [recentlyViewed, setRecentlyViewed] = useState<Course[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('edu-content-update', handleUpdate);
    return () => {
      window.removeEventListener('edu-content-update', handleUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch user profile metrics to update local XP/Streaks
      const profileRes = await api.get('/api/auth/profile');
      if (profileRes.data) {
        updateUserXpAndStreak(profileRes.data.xpPoints || 0, profileRes.data.streakCount || 0);
      }

      // Fetch student analytics details
      try {
        const statsRes = await api.get('/api/analytics/student');
        setStudentStats(statsRes.data);
      } catch (err) {
        console.error('Error fetching student analytics', err);
      }

      // Fetch enrolled courses from real API
      const enrollRes = await api.get('/api/lms/enrollments');
      const loadedEnrollments: Enrollment[] = enrollRes.data || [];
      setEnrollments(loadedEnrollments);

      // Fetch published courses catalog
      const coursesRes = await api.get('/api/courses?status=PUBLISHED' + 
        (selectedCategory ? `&categoryId=${selectedCategory}` : '') + 
        (searchQuery ? `&search=${searchQuery}` : '')
      );
      const loadedCourses: Course[] = coursesRes.data || [];
      setAllCourses(loadedCourses);

      // Fetch categories
      const catRes = await api.get('/api/courses/categories');
      setCategories(catRes.data || []);

      // Load/Seed recently viewed courses from catalog
      if (loadedCourses.length > 0) {
        const stored = localStorage.getItem(`recently_viewed_${user?.userId}`);
        if (stored) {
          try {
            const ids: number[] = JSON.parse(stored);
            const filtered = loadedCourses.filter(c => ids.includes(c.id));
            setRecentlyViewed(filtered.length > 0 ? filtered.slice(0, 2) : loadedCourses.slice(0, 2));
          } catch (e) {
            setRecentlyViewed(loadedCourses.slice(0, 2));
          }
        } else {
          setRecentlyViewed(loadedCourses.slice(0, 2));
        }
      }

    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      // Save to recently viewed when enrolling / viewing
      saveRecentlyViewed(courseId);

      await api.post(`/api/lms/enroll?courseId=${courseId}`);
      // Refresh
      fetchDashboardData();
      navigate(`/student/classroom/${courseId}`);
    } catch (err) {
      // If already enrolled or error, just navigate to classroom
      navigate(`/student/classroom/${courseId}`);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleGoToClassroom = (courseId: number) => {
    saveRecentlyViewed(courseId);
    navigate(`/student/classroom/${courseId}`);
  };

  const saveRecentlyViewed = (courseId: number) => {
    if (!user) return;
    const key = `recently_viewed_${user.userId}`;
    const stored = localStorage.getItem(key);
    let ids: number[] = [];
    if (stored) {
      try {
        ids = JSON.parse(stored);
      } catch (e) {
        ids = [];
      }
    }
    // Remove if exists and place at head
    ids = ids.filter(id => id !== courseId);
    ids.unshift(courseId);
    // Limit to 4 elements
    ids = ids.slice(0, 4);
    localStorage.setItem(key, JSON.stringify(ids));
  };

  const activeEnrollments = enrollments.filter(e => !e.completed);
  const completedEnrollments = enrollments.filter(e => e.completed);

  // Mock analytics data structures
  const weeklyStudyHours = [
    { name: 'Mon', hours: 0.8 },
    { name: 'Tue', hours: 1.5 },
    { name: 'Wed', hours: 2.1 },
    { name: 'Thu', hours: 0.5 },
    { name: 'Fri', hours: 1.8 },
    { name: 'Sat', hours: 2.8 },
    { name: 'Sun', hours: 1.2 },
  ];

  const monthlyXpGained = [
    { name: 'Jan', xp: 200 },
    { name: 'Feb', xp: 450 },
    { name: 'Mar', xp: 300 },
    { name: 'Apr', xp: 850 },
    { name: 'May', xp: studentStats?.totalXp ?? user?.xpPoints ?? 1200 },
  ];

  const quizPerformance = studentStats?.recentGrades && studentStats.recentGrades.length > 0
    ? studentStats.recentGrades.map((g: any) => ({
        quiz: g.title.substring(0, 12),
        score: g.maxMarks ? Math.round((g.marksObtained / g.maxMarks) * 100) : 100
      }))
    : [
        { quiz: 'HTML basics', score: 90 },
        { quiz: 'JS Loops', score: 70 },
        { quiz: 'CSS Grid', score: 100 },
        { quiz: 'React Hooks', score: 85 },
      ];

  const skillProgress = [
    { subject: 'Frontend', A: studentStats?.averageQuizScore ? Math.round(studentStats.averageQuizScore) : 90, fullMark: 100 },
    { subject: 'Backend', A: 70, fullMark: 100 },
    { subject: 'UI/UX', A: 85, fullMark: 100 },
    { subject: 'Database', A: 60, fullMark: 100 },
    { subject: 'DevOps', A: 50, fullMark: 100 },
  ];

  const compCount = studentStats?.completedCoursesCount ?? completedEnrollments.length;
  const actCount = (studentStats?.enrolledCoursesCount ?? enrollments.length) - compCount;

  // Completion data for chart
  const completionPieData = [
    { name: 'Completed Courses', value: compCount || 1, color: '#10b981' },
    { name: 'In Progress Courses', value: Math.max(0, actCount) || 1, color: '#8b5cf6' },
  ];

  // Helper to generate calendar heatmap elements (84 cells = 12 weeks * 7 days)
  const generateHeatmapCells = () => {
    const cells = [];
    const intensities = [0, 1, 0, 2, 0, 1, 3, 0, 4, 1, 0, 2, 3, 0, 1, 0, 2, 0, 1, 2, 0, 0, 1, 3, 4, 0, 1, 0, 0, 2, 1, 0, 3, 0, 1, 2, 0, 1, 4, 2, 0, 1, 0, 3, 0, 1, 2, 0, 0, 1, 2, 3, 4, 1, 0, 1, 0, 2, 0, 3, 1, 0, 2, 0, 4, 1, 0, 2, 0, 3, 0, 1, 2, 0, 1, 3, 0, 4, 2, 1, 0, 1, 2, 3];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 84; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (83 - i));
      cells.push({
        dayName: daysOfWeek[date.getDay()],
        dateStr: date.toLocaleDateString(),
        level: intensities[i % intensities.length]
      });
    }
    return cells;
  };

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="gradient-text">{user?.username}</span>!
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            You have maintained a learning streak of <span className="font-extrabold text-amber-500 flex items-center gap-0.5">🔥 {studentStats?.streakCount ?? user?.streakCount} Days</span>.
          </p>
        </div>
        
        {/* Gamification Stats Header */}
        <div className="flex items-center gap-4 bg-secondary/40 border border-border p-4 rounded-2xl shrink-0 relative z-10">
          <div className="flex items-center gap-2 pr-4 border-r border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Level XP</p>
              <p className="text-base font-extrabold text-foreground">{studentStats?.totalXp ?? user?.xpPoints} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Flame className="text-amber-500 animate-pulse" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Streak</p>
              <p className="text-base font-extrabold text-foreground">{user?.streakCount} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        {[
          { id: 'overview', label: 'My Overview', icon: BookOpen },
          { id: 'analytics', label: 'Detailed Analytics', icon: BarChart2 },
          { id: 'catalog', label: 'Browse Courses', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all -mb-px
                ${activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-card border border-border rounded-3xl overflow-hidden p-6 space-y-4 animate-pulse">
              <div className="bg-secondary rounded-2xl w-full aspect-video" />
              <div className="space-y-2">
                <div className="bg-secondary h-4 rounded w-3/4" />
                <div className="bg-secondary h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Overview */}
      {!loading && activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Learning Progress Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Enrolled Courses', value: studentStats?.enrolledCoursesCount ?? enrollments.length, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Completed', value: studentStats?.completedCoursesCount ?? completedEnrollments.length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Pending Deadlines', value: studentStats?.upcomingDeadlines?.length ?? 0, icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Avg Quiz Score', value: `${studentStats?.averageQuizScore ?? 0}%`, icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'Certificates', value: studentStats?.completedCoursesCount ?? completedEnrollments.length, icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              { label: 'Overall Rank', value: `#${studentStats?.overallRank ?? 1}`, icon: Clock, color: 'text-pink-500', bg: 'bg-pink-500/10' },
              { label: 'Streak count', value: `${studentStats?.streakCount ?? user?.streakCount} Days`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm hover-lift">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg} shrink-0 mb-3`}>
                    <Icon size={16} className={card.color} />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold tracking-tight">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-snug">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Learning Row */}
          {activeEnrollments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Continue Learning</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {activeEnrollments.slice(0, 2).map((enrollment) => (
                  <div 
                    key={enrollment.id}
                    className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-md hover-lift transition-all flex gap-5 items-center group cursor-pointer"
                    onClick={() => handleGoToClassroom(enrollment.course.id)}
                  >
                    <img 
                      src={enrollment.course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200'} 
                      alt={enrollment.course.title}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-muted"
                    />
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">
                          {enrollment.course.categoryName}
                        </span>
                        <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors mt-1.5">{enrollment.course.title}</h3>
                        <p className="text-[11px] text-muted-foreground">By {enrollment.course.instructorName}</p>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">Course Progress</span>
                          <span className="font-bold text-primary">{Math.round(enrollment.progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${enrollment.progressPercentage}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities, Recently Viewed, and Recommended Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Timeline Activities */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5 lg:col-span-2">
              <h3 className="font-bold text-base flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Recent Learning Activity
              </h3>
              <div className="relative border-l border-border pl-5 ml-2.5 space-y-6">
                {studentStats?.recentGrades && studentStats.recentGrades.length > 0 ? (
                  studentStats.recentGrades.map((grade: any, idx: number) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full border border-card flex items-center justify-center bg-emerald-500/10 text-emerald-500 animate-pulse">
                        <CheckCircle size={10} />
                      </span>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">Assignment Graded: {grade.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          Grade: <span className="font-extrabold text-primary">{grade.grade}</span> (Score: {grade.marksObtained}/{grade.maxMarks})
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 font-semibold block">Just now</span>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    {
                      title: "Completed lesson 'Introduction to React'",
                      desc: "Earned +50 XP in Modern Frontend Architectures.",
                      time: "3 hours ago",
                      icon: Play,
                      iconBg: "bg-blue-500/10 text-blue-500"
                    },
                    {
                      title: "Submitted Assignment: State Hooks",
                      desc: "Awaiting instructor feedback and review comments.",
                      time: "Yesterday",
                      icon: ClipboardList,
                      iconBg: "bg-amber-500/10 text-amber-500"
                    },
                    {
                      title: "Earned Completion Certificate",
                      desc: "Finished HTML & CSS fundamentals with 100% grade.",
                      time: "3 days ago",
                      icon: Award,
                      iconBg: "bg-emerald-500/10 text-emerald-500"
                    }
                  ].map((act, idx) => {
                    const ActIcon = act.icon;
                    return (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <span className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full border border-card flex items-center justify-center ${act.iconBg}`}>
                          <ActIcon size={10} />
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground">{act.title}</p>
                          <p className="text-[11px] text-muted-foreground">{act.desc}</p>
                          <span className="text-[10px] text-muted-foreground/60 font-semibold block">{act.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recently Viewed & Recommended */}
            <div className="space-y-6">
              
              {/* Recently Viewed */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Clock size={16} className="text-primary" /> Recently Viewed
                </h3>
                {recentlyViewed.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No recently viewed courses yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentlyViewed.map(course => (
                      <div 
                        key={course.id} 
                        onClick={() => handleEnroll(course.id)}
                        className="flex gap-3 items-center p-2 rounded-xl hover:bg-secondary/40 cursor-pointer border border-transparent hover:border-border transition-all"
                      >
                        <img 
                          src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200'}
                          alt={course.title}
                          className="w-12 h-10 rounded-lg object-cover bg-muted shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{course.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">By {course.instructorName}</p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Courses Placeholder */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles size={16} className="text-primary" /> Recommended for You
                </h3>
                
                <div className="space-y-3">
                  {[
                    { topic: "System Design Essentials", tags: "Architecture · Intermediate", rating: 4.9 },
                    { topic: "Vite & Build Configurations", tags: "DevOps · Advanced", rating: 4.8 }
                  ].map((rec, idx) => (
                    <div key={idx} className="p-3 bg-secondary/35 border border-border/60 rounded-xl relative hover-lift cursor-pointer">
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase absolute top-2 right-2">Recommend</span>
                      <p className="text-xs font-bold text-foreground pr-10">{rec.topic}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{rec.tags}</p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-500 font-bold">
                        <Star size={10} fill="currentColor" /> {rec.rating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Tab: Analytics */}
      {!loading && activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Charts Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Your Detailed Analytics</h2>
              <p className="text-xs text-muted-foreground">Detailed metrics indicating your learning patterns and quiz progress.</p>
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1"><TrendingUp size={14} /> Tracking Since Registration</span>
          </div>

          {/* Heatmap Section */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Learning Study Heatmap</h3>
                <p className="text-[11px] text-muted-foreground">Visualizes dates you logs studies, assignments, and lesson activities.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded bg-secondary/50 border border-border" />
                <span className="w-2.5 h-2.5 rounded bg-purple-500/25 border border-border" />
                <span className="w-2.5 h-2.5 rounded bg-purple-500/50 border border-border" />
                <span className="w-2.5 h-2.5 rounded bg-purple-500/75 border border-border" />
                <span className="w-2.5 h-2.5 rounded bg-purple-500 border border-border" />
                <span>More</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[700px] max-w-full justify-between">
                {generateHeatmapCells().map((cell, idx) => (
                  <div
                    key={idx}
                    title={`${cell.dateStr}: ${cell.level === 0 ? 'No activity' : cell.level + ' task completions'}`}
                    className={`w-3.5 h-3.5 rounded border border-border/20 cursor-pointer 
                      ${cell.level === 0 ? 'heatmap-cell-0' :
                        cell.level === 1 ? 'heatmap-cell-1' :
                        cell.level === 2 ? 'heatmap-cell-2' :
                        cell.level === 3 ? 'heatmap-cell-3' : 'heatmap-cell-4'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/60 font-bold px-2 pt-2">
                <span>12 Weeks Ago</span>
                <span>6 Weeks Ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Row 1: Weekly hours & Monthly XP */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Weekly study time */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-primary" /> Weekly Study Time (Hours)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyStudyHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} />
                  <Bar dataKey="hours" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly XP Accumulation */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Trophy size={16} className="text-primary" /> Cumulative Level XP Gained
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyXpGained}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 11 }} />
                  <Area type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={2} fill="url(#xpGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Row 2: Completion, Quiz scores & Skill Progress */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Completion metrics */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <h3 className="font-bold text-sm">Course Completion Status</h3>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="value"
                      paddingAngle={4}
                    >
                      {completionPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Completed ({completedEnrollments.length})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary" /> Active ({activeEnrollments.length})</span>
              </div>
            </div>

            {/* Quiz Performance */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm">Quiz Scores (%)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={quizPerformance}>
                  <defs>
                    <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="quiz" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 10 }} />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#quizGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Skill distribution Radar */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm">Skill Progress Radar</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillProgress}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 7 }} />
                    <Radar name={user?.username || "Student"} dataKey="A" stroke="hsl(262, 83%, 58%)" fill="hsl(262, 83%, 58%)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab: Course Catalog (Browse) */}
      {!loading && (activeTab === 'catalog' || activeTab === 'overview') && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-border/40 pt-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Browse Course Catalog</h2>
              <p className="text-xs text-muted-foreground">Expand your knowledge with these recommended courses.</p>
            </div>

            {/* Filters and search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary w-48 transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-muted-foreground" />
                <select 
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                  className="bg-card border border-border rounded-xl px-2 py-1.5 text-xs outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {allCourses.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border border-dashed rounded-3xl space-y-3">
              <AlertCircle className="mx-auto text-muted-foreground" size={32} />
              <p className="text-sm text-muted-foreground font-semibold">No courses found matching criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {allCourses.map((course) => {
                const isEnrolled = enrollments.some(e => e.course.id === course.id);
                return (
                  <div 
                    key={course.id}
                    className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-lg hover-lift transition-all duration-300 flex flex-col justify-between h-full group"
                  >
                    <div className="relative overflow-hidden aspect-video bg-muted border-b border-border/40">
                      <img 
                        src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300'} 
                        alt={course.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold backdrop-blur-sm">
                        {course.isFree ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                          {course.categoryName}
                        </span>
                        <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors mt-2">{course.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{course.subtitle}</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
                          <span className="flex items-center gap-1"><Clock size={12} /> {course.durationHours} hrs</span>
                          <span className="flex items-center gap-1"><GraduationCap size={12} /> {course.instructorName}</span>
                        </div>

                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all
                            ${isEnrolled 
                              ? 'bg-secondary text-foreground hover:bg-secondary/80'
                              : 'bg-primary text-white hover:opacity-95 shadow-md shadow-primary/10'}`}
                        >
                          {isEnrolled ? (
                            <>Go to Classroom <ChevronRight size={14} /></>
                          ) : (
                            <>Enroll Course <ChevronRight size={14} /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
