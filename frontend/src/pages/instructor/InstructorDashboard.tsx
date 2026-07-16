import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, Users, TrendingUp, DollarSign, PlusCircle,
  Eye, Edit3, CheckCircle2, Clock, AlertCircle, Loader2,
  BarChart2, Star, ShieldAlert, Award, ArrowUpRight, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'courses'>('overview');
  const [instructorStats, setInstructorStats] = useState<any>(null);

  const fetchInstructorData = React.useCallback(async () => {
    try {
      setLoading(true);
      // Fetch instructor analytics
      try {
        const statsRes = await api.get('/api/analytics/instructor');
        setInstructorStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load instructor analytics:', err);
      }

      const res = await api.get(`/api/courses?status=`);
      const allCourses = res.data;
      // Filter by current instructor
      const myCourses = allCourses.filter((c: any) => c.instructorId === user?.userId);
      setCourses(myCourses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInstructorData();
  }, [fetchInstructorData]);

  // Real-time SSE updates listener
  useEffect(() => {
    const handleUpdate = () => {
      fetchInstructorData();
    };
    window.addEventListener('edu-content-update', handleUpdate);
    return () => {
      window.removeEventListener('edu-content-update', handleUpdate);
    };
  }, [fetchInstructorData]);

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'PUBLISHED').length;
  const draftCourses = courses.filter((c) => c.status === 'DRAFT').length;
  const reviewCourses = courses.filter((c) => c.status === 'PENDING_APPROVAL').length;

  // Mock / Dynamic analytics data structures
  const enrollmentData = [
    { name: 'Mon', students: 2 },
    { name: 'Tue', students: 5 },
    { name: 'Wed', students: 4 },
    { name: 'Thu', students: 8 },
    { name: 'Fri', students: instructorStats?.totalStudents ?? 12 },
    { name: 'Sat', students: 6 },
    { name: 'Sun', students: 3 },
  ];

  const revenueData = instructorStats?.monthlyRevenue && Object.keys(instructorStats.monthlyRevenue).length > 0
    ? Object.entries(instructorStats.monthlyRevenue).map(([key, val]) => ({ name: key, revenue: val }))
    : [
        { name: 'Jan', revenue: 1200 },
        { name: 'Feb', revenue: 1800 },
        { name: 'Mar', revenue: 2400 },
        { name: 'Apr', revenue: 2100 },
        { name: 'May', revenue: instructorStats?.totalEarnings ?? 3200 },
      ];

  const gradeDistribution = [
    { name: 'Grade A', count: 12, color: '#10b981' },
    { name: 'Grade B', count: 8, color: '#3b82f6' },
    { name: 'Grade C', count: 4, color: '#8b5cf6' },
    { name: 'Grade D', count: 1, color: '#f59e0b' },
    { name: 'Grade F', count: 0, color: '#ef4444' },
  ];

  const quizPerformance = [
    { name: 'HTML Quiz', avgScore: 84 },
    { name: 'CSS Flex', avgScore: 78 },
    { name: 'JS Arrays', avgScore: 88 },
    { name: 'React State', avgScore: 72 },
  ];

  const stats = [
    { label: 'Total Courses', value: instructorStats?.totalCourses ?? totalCourses, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Published', value: publishedCourses, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Draft / Review', value: draftCourses + reviewCourses, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Avg Rating', value: `${instructorStats?.averageRating ?? 4.8} ★`, icon: Star, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Students', value: instructorStats?.totalStudents ?? 0, icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Total Earnings', value: instructorStats?.totalEarnings ? `$${instructorStats.totalEarnings.toLocaleString()}` : '$0.00', icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome, <span className="font-bold text-foreground">{user?.username}</span>. Manage your courses and student analytics.
          </p>
        </div>
        <button
          onClick={() => navigate('/instructor/new-course')}
          className="flex items-center gap-2 px-5 py-2.5 gradient-bg text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-all shrink-0"
        >
          <PlusCircle size={18} /> Create New Course
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm hover-lift"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg} shrink-0 mb-3`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-snug">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        {[
          { id: 'overview', label: 'Overview & Activities', icon: BookOpen },
          { id: 'analytics', label: 'Performance Analytics', icon: BarChart2 },
          { id: 'courses', label: 'My Courses', icon: ClipboardList },
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

      {/* Tab 1: Overview & Activities */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Quick Actions & Tips */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm">Instructor Panel Shortcuts</h3>
            <div className="grid gap-3 text-xs">
              <button 
                onClick={() => navigate('/instructor/submissions')}
                className="w-full p-4 rounded-xl border border-border bg-secondary/35 text-left font-semibold flex items-center justify-between hover:border-primary transition-all"
              >
                <span>Grade Assignment Submissions</span>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate('/instructor/courses')}
                className="w-full p-4 rounded-xl border border-border bg-secondary/35 text-left font-semibold flex items-center justify-between hover:border-primary transition-all"
              >
                <span>Manage Course Content & Chapters</span>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs space-y-2">
              <p className="font-bold text-primary flex items-center gap-1"><Award size={14} /> Tip of the Week</p>
              <p className="text-muted-foreground leading-relaxed">
                Add Interactive Quizzes to lessons! Instructors who insert test checkpoints report 40% higher student retention rates.
              </p>
            </div>
          </div>

          {/* Recent Student Activities */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5 lg:col-span-2">
            <h3 className="font-bold text-base">Recent Activities</h3>
            <div className="relative border-l border-border pl-5 ml-2.5 space-y-6">
              {instructorStats?.recentSubmissions && instructorStats.recentSubmissions.length > 0 ? (
                instructorStats.recentSubmissions.map((sub: any, idx: number) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full border border-card flex items-center justify-center bg-purple-500/10 text-purple-500 animate-pulse">
                      <ClipboardList size={10} />
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground">
                        {sub.studentName} submitted assignment for {sub.courseTitle}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        Assignment: <span className="font-semibold text-primary">{sub.assignmentTitle}</span> (Needs grading)
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 font-semibold block">Just now</span>
                    </div>
                  </div>
                ))
              ) : (
                [
                  {
                    title: "John Smith enrolled in React Hooks Basics",
                    desc: "Student enrolled via coupon code, adding to class metrics.",
                    time: "30 minutes ago",
                    icon: Users,
                    iconBg: "bg-blue-500/10 text-blue-500"
                  },
                  {
                    title: "Alice Johnson submitted Assignment: 'Context API Setup'",
                    desc: "Awaiting your score grade and feedback review.",
                    time: "2 hours ago",
                    icon: ClipboardList,
                    iconBg: "bg-purple-500/10 text-purple-500"
                  },
                  {
                    title: "Jane Doe left a ⭐ 5.0 Star Rating review",
                    desc: "'Very clear explanations, best React course on the platform.'",
                    time: "Yesterday",
                    icon: Star,
                    iconBg: "bg-amber-500/10 text-amber-500"
                  }
                ].map((act, idx) => {
                  const ActIcon = act.icon;
                  return (
                    <div key={idx} className="relative">
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

        </div>
      )}

      {/* Tab 2: Analytics & Charts */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Row 1: Weekly enrollments and revenue */}
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Weekly Enrollments */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-primary" /> Weekly New Student Registrations
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={enrollmentData}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
                  <Area type="monotone" dataKey="students" stroke="hsl(262, 83%, 58%)" strokeWidth={2} fill="url(#enrollGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-emerald-500" /> Monthly Revenue ($)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="hsl(262, 83%, 58%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Grade distribution & Quiz average scores */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Grade breakdown */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <h3 className="font-bold text-sm">Student Grade Distribution</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="count"
                      paddingAngle={3}
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center text-[10px] font-bold">
                {gradeDistribution.map((gd, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: gd.color }} /> {gd.name} ({gd.count})
                  </span>
                ))}
              </div>
            </div>

            {/* Quiz averages */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
              <h3 className="font-bold text-sm">Average Quiz Score Performance (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
                  <Bar dataKey="avgScore" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

        </div>
      )}

      {/* Tab 3: My Courses Table */}
      {(activeTab === 'courses' || activeTab === 'overview') && (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/20">
            <h3 className="font-bold flex items-center gap-2">
              <BookOpen size={18} className="text-primary" /> Created Instructor Courses
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="mx-auto text-muted-foreground" size={32} />
              <p className="text-muted-foreground text-sm font-medium">No courses created yet.</p>
              <button
                onClick={() => navigate('/instructor/new-course')}
                className="text-primary text-sm hover:underline font-bold"
              >
                Create your first course →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/10">
                    <th className="text-left py-3 px-6">Course</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-right py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-12 h-10 rounded-xl object-cover bg-muted shrink-0"
                          />
                          <p className="text-sm font-bold max-w-[200px] truncate">{course.title}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-muted-foreground">{course.categoryName || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          course.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                          course.status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                          'bg-secondary text-muted-foreground border-border'
                        }`}>
                          {course.status === 'PUBLISHED' && <CheckCircle2 size={11} />}
                          {course.status === 'PENDING_APPROVAL' && <Clock size={11} />}
                          {course.status === 'DRAFT' && <Edit3 size={11} />}
                          {course.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold">{course.isFree ? 'Free' : `$${course.price}`}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => navigate(`/instructor/manage/${course.id}`)}
                            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <BarChart2 size={13} /> Manage
                          </button>
                          <button
                            onClick={() => navigate(`/student/classroom/${course.id}`)}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <Eye size={13} /> Preview
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
