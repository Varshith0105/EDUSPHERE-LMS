import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, BookOpen, BarChart2, DollarSign, TrendingUp,
  ShieldAlert, CheckCircle2, XCircle, Loader2, Eye, Clock,
  Cpu, HardDrive, Database, RefreshCw, Activity, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'system'>('overview');

  // Live telemetry metrics state
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [sysMetrics, setSysMetrics] = useState({
    cpu: 24,
    memoryUsed: 1.25,
    memoryTotal: 4.0,
    dbConnections: 4,
    activeThreads: 10,
    diskUsed: 38.4,
    diskTotal: 100.0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
    fetchHealth();

    // Telemetry simulator (live system metrics)
    const interval = setInterval(() => {
      setSysMetrics(prev => {
        const nextCpu = Math.max(10, Math.min(95, prev.cpu + (Math.random() * 8 - 4)));
        const nextMemory = Math.max(1.0, Math.min(3.8, prev.memoryUsed + (Math.random() * 0.08 - 0.04)));
        const nextConnections = Math.max(2, Math.min(25, prev.dbConnections + Math.floor(Math.random() * 3 - 1)));
        const nextThreads = Math.max(8, Math.min(50, prev.activeThreads + Math.floor(Math.random() * 4 - 2)));
        
        const timestamp = new Date().toLocaleTimeString();
        setChartData(prevData => {
          const newData = [...prevData, {
            time: timestamp,
            cpu: Math.round(nextCpu),
            memory: Math.round(nextMemory * 1000), // MB
            connections: nextConnections
          }];
          if (newData.length > 10) newData.shift();
          return newData;
        });

        return {
          ...prev,
          cpu: Math.round(nextCpu),
          memoryUsed: parseFloat(nextMemory.toFixed(2)),
          dbConnections: nextConnections,
          activeThreads: nextThreads
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, coursesRes] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/courses?status=PENDING_APPROVAL'),
      ]);
      setAnalytics(analyticsRes.data);
      setPendingCourses(coursesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await api.get('/api/health');
      setHealthStatus(res.data);
    } catch (err) {
      console.error("Health check failed", err);
      setHealthStatus({ status: "DOWN", message: "Unable to connect to Spring Boot backend." });
    }
  };

  const handleApprove = async (courseId: number) => {
    setApprovingId(courseId);
    try {
      await api.put(`/api/courses/${courseId}/status?status=PUBLISHED`);
      setPendingCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (courseId: number) => {
    setApprovingId(courseId);
    try {
      await api.put(`/api/courses/${courseId}/status?status=DRAFT`);
      setPendingCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const categoryData = [
    { name: 'Web Dev', value: 42, color: '#8b5cf6' },
    { name: 'AI / ML', value: 28, color: '#3b82f6' },
    { name: 'Business', value: 18, color: '#ec4899' },
    { name: 'Computer Science', value: 12, color: '#10b981' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const totalUsersCount = (analytics?.totalStudents || 0) + (analytics?.totalInstructors || 0) + 1; // plus admin

  const stats = [
    { label: 'Total Users', value: totalUsersCount, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Students', value: analytics?.totalStudents ?? 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active Instructors', value: analytics?.totalInstructors ?? 0, icon: BookOpen, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Total Courses', value: analytics?.totalCourses ?? 0, icon: BarChart2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Revenue', value: `$${analytics?.totalRevenue ?? '0'}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Today\'s Registrations', value: 4, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide monitoring for <span className="font-bold text-foreground">EduSphere AI</span>
        </p>
      </div>

      {/* KPI Cards */}
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
          { id: 'overview', label: 'Overview & Approvals', icon: BookOpen },
          { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp },
          { id: 'system', label: 'System Statistics', icon: Cpu },
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

      {/* Tab 1: Overview & Approvals */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Course Approval Queue */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Course Approval Queue */}
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-amber-500/5">
                <ShieldAlert size={18} className="text-amber-500" />
                <h3 className="font-bold">Course Approval Queue</h3>
                {pendingCourses.length > 0 && (
                  <span className="ml-auto px-2.5 py-0.5 bg-amber-500 text-white text-xs font-extrabold rounded-full">
                    {pendingCourses.length}
                  </span>
                )}
              </div>

              {pendingCourses.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="mx-auto text-emerald-500" size={28} />
                  <p className="text-muted-foreground text-sm font-medium">All courses have been reviewed. Queue is empty.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingCourses.map((course) => (
                    <div key={course.id} className="flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-secondary/20 transition-colors">
                      <img
                        src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=300'}
                        alt={course.title}
                        className="w-20 h-14 rounded-xl object-cover bg-muted shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-bold text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">By {course.instructorName} · {course.categoryName}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock size={10} /> Pending Review
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(course.id)}
                          disabled={approvingId === course.id}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          {approvingId === course.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(course.id)}
                          disabled={approvingId === course.id}
                          className="px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-destructive/20 transition-colors"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Platform Activity Feed */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-sm">Platform Activity</h3>
            <div className="relative border-l border-border pl-5 ml-2.5 space-y-6">
              {[
                {
                  title: "Database backup completed",
                  desc: "Automated snapshot saved to secure cloud repository.",
                  time: "30 minutes ago",
                  icon: Database,
                  iconBg: "bg-blue-500/10 text-blue-500"
                },
                {
                  title: "Student 'student_alice' scored 100%",
                  desc: "Completed CSS Grid Exam with high score badge.",
                  time: "1 hour ago",
                  icon: CheckCircle2,
                  iconBg: "bg-emerald-500/10 text-emerald-500"
                },
                {
                  title: "Instructor 'instructor_jane' submitted course",
                  desc: "Course 'Vite Configuration' submitted for approval review.",
                  time: "2 hours ago",
                  icon: Clock,
                  iconBg: "bg-purple-500/10 text-purple-500"
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
              })}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Row 1: Charts */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Student Growth */}
            <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-primary" /> Monthly User Registrations Growth
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics?.studentGrowth || []}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
                  <Area type="monotone" dataKey="newStudents" stroke="#8b5cf6" strokeWidth={2} fill="url(#growthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Pie */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <BarChart2 size={16} className="text-primary" /> Category Distribution
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center text-[10px] font-bold">
                {categoryData.map((cat, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} /> {cat.name} ({cat.value}%)
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2: Popular Courses Table */}
          {analytics?.popularCourses && analytics.popularCourses.length > 0 && (
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/20">
                <h3 className="font-bold text-sm">Top Performing Courses</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/10">
                      <th className="text-left py-3 px-6">#</th>
                      <th className="text-left py-3 px-4">Course Name</th>
                      <th className="text-left py-3 px-4">Students Enrolled</th>
                      <th className="text-right py-3 px-6">Avg. Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.popularCourses.map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-6 text-sm font-bold text-muted-foreground">#{idx + 1}</td>
                        <td className="py-3 px-4 text-sm font-semibold max-w-xs truncate">{c.courseTitle}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{c.studentCount}</span>
                            <div className="flex-1 max-w-[80px] bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${Math.min((c.studentCount / 10) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <span className="text-sm font-bold text-amber-500">⭐ {c.rating?.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 3: System Statistics */}
      {activeTab === 'system' && (
        <div className="space-y-8">
          
          {/* Cloud VM Status Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Spring Boot host */}
            <div className="bg-card border border-border rounded-3xl p-6 flex items-start justify-between shadow-sm">
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">JVM Server Nodes</p>
                <h3 className="text-base font-bold">{healthStatus?.status === 'UP' ? 'Running Safely' : 'Offline / Error'}</h3>
                <p className="text-xs text-muted-foreground">{healthStatus?.message || 'JVM instance is responsive.'}</p>
              </div>
              <button 
                onClick={fetchHealth}
                className={`p-2 rounded-full hover:bg-secondary transition-colors ${
                  healthStatus?.status === 'UP' ? 'text-emerald-500' : 'text-destructive'
                }`}
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {/* DB connections host */}
            <div className="bg-card border border-border rounded-3xl p-6 flex items-start justify-between shadow-sm">
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SQL database status</p>
                <h3 className="text-base font-bold">Connected Pools</h3>
                <p className="text-xs text-muted-foreground">Active Pool: {sysMetrics.dbConnections} connections open.</p>
              </div>
              <span className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                <Database size={20} />
              </span>
            </div>

            {/* Hardware VM load */}
            <div className="bg-card border border-border rounded-3xl p-6 flex items-start justify-between shadow-sm">
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cloud Host Instances</p>
                <h3 className="text-base font-bold">Host Load (2 vCPUs)</h3>
                <p className="text-xs text-muted-foreground">Total JVM Threads: {sysMetrics.activeThreads} active.</p>
              </div>
              <span className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                <Cpu size={20} />
              </span>
            </div>

          </div>

          {/* Hardware Telemetry Progress and Realtime CPU Area chart */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Progress Telemetry */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity size={16} /> Live Hardware Load
              </h2>
              
              {/* CPU utilization */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>CPU Utilization</span>
                  <span className={sysMetrics.cpu > 80 ? 'text-destructive' : 'text-foreground'}>{sysMetrics.cpu}%</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${sysMetrics.cpu > 80 ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${sysMetrics.cpu}%` }}
                  />
                </div>
              </div>

              {/* Memory utilization */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>JVM Memory Heap</span>
                  <span>{sysMetrics.memoryUsed} GB / {sysMetrics.memoryTotal} GB</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${(sysMetrics.memoryUsed / sysMetrics.memoryTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Disk utilization */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Disk Persistent Space</span>
                  <span>{sysMetrics.diskUsed} GB / {sysMetrics.diskTotal} GB</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(sysMetrics.diskUsed / sysMetrics.diskTotal) * 100}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Real-time Load Graphs */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm lg:col-span-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Activity size={12} /> Real-time System Load stream (Live)
              </h2>
              
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                  Awaiting telemetry payloads streams...
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 10 }} />
                      <Area type="monotone" dataKey="cpu" name="CPU Load %" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCpu)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
