import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, X, BookOpen, GraduationCap, LayoutDashboard, Settings, 
  LogOut, Sun, Moon, Bell, Search, User, ShieldAlert, Award, 
  ChevronRight, BarChart2, MessageSquare, ClipboardList, Database,
  CheckCircle, AlertCircle, Info, Calendar, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

interface Notification {
  id: number;
  title: string;
  description: string;
  category: 'achievement' | 'quiz' | 'assignment' | 'course' | 'general';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  read: boolean;
}

const sidebarItems: SidebarItem[] = [
  // Student Items
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, roles: ['ROLE_STUDENT'] },
  { label: 'Browse Courses', path: '/student/courses', icon: BookOpen, roles: ['ROLE_STUDENT'] },
  { label: 'Leaderboard', path: '/student/leaderboard', icon: Award, roles: ['ROLE_STUDENT'] },
  { label: 'Discussion Forum', path: '/student/forum', icon: MessageSquare, roles: ['ROLE_STUDENT'] },
  { label: 'Settings', path: '/student/settings', icon: Settings, roles: ['ROLE_STUDENT'] },

  // Instructor Items
  { label: 'Dashboard', path: '/instructor/dashboard', icon: LayoutDashboard, roles: ['ROLE_INSTRUCTOR'] },
  { label: 'My Courses', path: '/instructor/courses', icon: BookOpen, roles: ['ROLE_INSTRUCTOR'] },
  { label: 'Add New Course', path: '/instructor/new-course', icon: GraduationCap, roles: ['ROLE_INSTRUCTOR'] },
  { label: 'Submissions', path: '/instructor/submissions', icon: ClipboardList, roles: ['ROLE_INSTRUCTOR'] },

  // Admin Items
  { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['ROLE_ADMIN'] },
  { label: 'Manage Users', path: '/admin/users', icon: User, roles: ['ROLE_ADMIN'] },
  { label: 'Course Approvals', path: '/admin/approvals', icon: ShieldAlert, roles: ['ROLE_ADMIN'] },
  { label: 'Azure Monitor', path: '/admin/monitor', icon: Database, roles: ['ROLE_ADMIN'] }
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<{ title: string; description: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load existing notifications from backend
  const fetchNotifications = React.useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.message,
          category: n.title.toLowerCase().includes('quiz') ? 'quiz' :
                    n.title.toLowerCase().includes('assignment') ? 'assignment' :
                    n.title.toLowerCase().includes('completed') ? 'achievement' : 'general',
          priority: n.title.toLowerCase().includes('completed') || n.title.toLowerCase().includes('graded') ? 'high' : 'low',
          timestamp: new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          read: n.isRead
        }));
        setNotifications(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }, [token]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Connect to SSE stream
  React.useEffect(() => {
    if (!token) return;
    const eventSource = new EventSource(`/api/notifications/subscribe?token=${encodeURIComponent(token)}`);

    eventSource.addEventListener('NOTIFICATION', (event) => {
      try {
        const data = JSON.parse(event.data);
        const newNotif: Notification = {
          id: data.id,
          title: data.title,
          description: data.message,
          category: data.title.toLowerCase().includes('quiz') ? 'quiz' :
                    data.title.toLowerCase().includes('assignment') ? 'assignment' :
                    data.title.toLowerCase().includes('completed') ? 'achievement' : 'general',
          priority: data.title.toLowerCase().includes('completed') || data.title.toLowerCase().includes('graded') ? 'high' : 'low',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          read: data.isRead
        };
        setNotifications(prev => [newNotif, ...prev]);
        setToast({ title: data.title, description: data.message });
      } catch (err) {
        console.error("Error parsing SSE notification:", err);
      }
    });

    eventSource.addEventListener('CONTENT_UPDATE', (event) => {
      try {
        const data = JSON.parse(event.data);
        const customEvent = new CustomEvent('edu-content-update', { detail: data });
        window.dispatchEvent(customEvent);
      } catch (err) {
        console.error("Error parsing SSE content update:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE stream error, reconnecting...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  // Dismiss toast after 5s
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    courses: { id: number; title: string }[];
    lessons: { id: number; title: string; courseId: number }[];
    assignments: { id: number; title: string; courseId: number }[];
    forums: { id: number; title: string }[];
    users: { id: number; username: string; role: string }[];
    certificates: { id: number; uuid: string; courseId: number }[];
  } | null>(null);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const q = query.toLowerCase();

    const matchedCourses = [
      { id: 1, title: 'Introduction to React & TypeScript' },
      { id: 2, title: 'Mastering Spring Boot 3 & Java 21' },
      { id: 3, title: 'Generative AI & LLM Foundations' }
    ].filter(c => c.title.toLowerCase().includes(q));

    const matchedLessons = [
      { id: 1, title: 'Course Introduction & Setup', courseId: 1 },
      { id: 2, title: 'Understanding Components and Props', courseId: 1 },
      { id: 3, title: 'Advanced Hooks & React Query', courseId: 1 },
      { id: 4, title: 'Spring Boot 3 Project Initialization', courseId: 2 }
    ].filter(l => l.title.toLowerCase().includes(q));

    const matchedAssignments = [
      { id: 1, title: 'Build a Responsive Card Deck using Shadcn UI', courseId: 1 }
    ].filter(a => a.title.toLowerCase().includes(q));

    const matchedForums = [
      { id: 1, title: 'TypeScript type error with React Query useQuery' },
      { id: 2, title: 'React 19 Cheat Sheet and Reference Guide' }
    ].filter(f => f.title.toLowerCase().includes(q));

    const matchedUsers = [
      { id: 1, username: 'admin', role: 'ROLE_ADMIN' },
      { id: 2, username: 'instructor_jane', role: 'ROLE_INSTRUCTOR' },
      { id: 3, username: 'student_john', role: 'ROLE_STUDENT' }
    ].filter(u => u.username.toLowerCase().includes(q));

    const matchedCertificates = [
      { id: 1, uuid: 'cert-uuid-1111-2222-3333', courseId: 1 }
    ].filter(c => c.uuid.toLowerCase().includes(q));

    setSearchResults({
      courses: matchedCourses,
      lessons: matchedLessons,
      assignments: matchedAssignments,
      forums: matchedForums,
      users: matchedUsers,
      certificates: matchedCertificates
    });
  };

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const roleItems = sidebarItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const toggleReadStatus = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'achievement':
        return <Award className="text-amber-500" size={16} />;
      case 'quiz':
        return <CheckCircle className="text-emerald-500" size={16} />;
      case 'assignment':
        return <ClipboardList className="text-blue-500" size={16} />;
      case 'course':
        return <BookOpen className="text-purple-500" size={16} />;
      default:
        return <Info className="text-slate-500" size={16} />;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (notificationFilter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Component */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transform 
        lg:transform-none lg:relative transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-lg">
              E
            </div>
            <span className="font-extrabold text-xl tracking-tight gradient-text">EduSphere AI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-12rem)]">
          {roleItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 font-semibold' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary transition-colors'} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
              </button>
            );
          })}
        </nav>

        {/* User metrics block (Student Gamification summary) */}
        {user.role === 'ROLE_STUDENT' && (
          <div className="mx-4 p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium">XP Level</p>
              <p className="text-sm font-bold text-primary">{user.xpPoints} XP</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium">🔥 Streak</p>
              <p className="text-sm font-bold text-amber-500">{user.streakCount} days</p>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navbar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/80 border border-border rounded-xl w-64 md:w-80">
                <Search size={16} className="text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search courses, lessons, topics..." 
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Search Results Dropdown Overlay */}
              {searchResults && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSearchResults(null)} />
                  <div className="absolute top-11 left-0 w-[450px] bg-card border border-border rounded-2xl shadow-xl z-50 p-4 max-h-[480px] overflow-y-auto space-y-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider">Search Results</p>
                    
                    {/* Courses */}
                    {searchResults.courses.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-primary uppercase">Courses</span>
                        {searchResults.courses.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              navigate(`/student/classroom/${c.id}`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-secondary/40 text-xs font-semibold block truncate transition-colors text-foreground"
                          >
                            📘 {c.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Lessons */}
                    {searchResults.lessons.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-purple-500 uppercase">Lessons</span>
                        {searchResults.lessons.map(l => (
                          <button
                            key={l.id}
                            onClick={() => {
                              navigate(`/student/classroom/${l.courseId}`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-secondary/40 text-xs font-semibold block truncate transition-colors text-foreground"
                          >
                            🎥 {l.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Assignments */}
                    {searchResults.assignments.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-amber-500 uppercase">Assignments</span>
                        {searchResults.assignments.map(a => (
                          <button
                            key={a.id}
                            onClick={() => {
                              navigate(`/student/assignments/${a.courseId}`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-secondary/40 text-xs font-semibold block truncate transition-colors text-foreground"
                          >
                            📝 {a.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Forums */}
                    {searchResults.forums.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-emerald-500 uppercase">Forums</span>
                        {searchResults.forums.map(f => (
                          <button
                            key={f.id}
                            onClick={() => {
                              navigate(`/student/forum`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-secondary/40 text-xs font-semibold block truncate transition-colors text-foreground"
                          >
                            💬 {f.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-pink-500 uppercase">Users</span>
                        {searchResults.users.map(u => (
                          <div
                            key={u.id}
                            className="p-2 rounded-lg text-xs font-semibold flex items-center justify-between"
                          >
                            <span>👤 {u.username}</span>
                            <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-bold">{u.role}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Certificates */}
                    {searchResults.certificates.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-indigo-500 uppercase">Certificates</span>
                        {searchResults.certificates.map(cert => (
                          <button
                            key={cert.id}
                            onClick={() => {
                              navigate(`/student/certificate/${cert.courseId}`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-secondary/40 text-xs font-semibold block truncate transition-colors text-foreground"
                          >
                            🎓 Cert: {cert.uuid}
                          </button>
                        ))}
                      </div>
                    )}

                    {Object.values(searchResults).every(arr => arr.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4">No results found matching "{searchQuery}"</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1 min-w-[18px] h-[18px] text-[10px] font-extrabold bg-destructive text-white rounded-full flex items-center justify-center border-2 border-card">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 md:w-96 bg-card border border-border rounded-2xl shadow-xl z-40 p-4 flex flex-col max-h-[480px] overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
                        <div>
                          <h4 className="font-bold text-sm">Notifications</h4>
                          <p className="text-[10px] text-muted-foreground">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[11px] font-bold text-primary hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Filters */}
                      <div className="flex gap-1 bg-secondary/50 p-0.5 rounded-lg text-xs mb-3 font-semibold">
                        <button
                          onClick={() => setNotificationFilter('all')}
                          className={`flex-1 py-1 rounded-md text-center transition-colors ${
                            notificationFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setNotificationFilter('unread')}
                          className={`flex-1 py-1 rounded-md text-center transition-colors ${
                            notificationFilter === 'unread' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Unread
                        </button>
                      </div>

                      {/* List */}
                      <div className="space-y-2 overflow-y-auto flex-1 pr-1 pb-1">
                        {filteredNotifications.length === 0 ? (
                          <div className="text-center py-8 text-xs text-muted-foreground">
                            No notifications to display.
                          </div>
                        ) : filteredNotifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => toggleReadStatus(notif.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:bg-secondary/40 relative flex gap-3 ${
                              notif.read ? 'bg-card/40 border-border/60 opacity-75' : 'bg-secondary/20 border-border hover:border-primary/30'
                            }`}
                          >
                            {/* Unread circle badge */}
                            {!notif.read && (
                              <span className="absolute top-3.5 right-3 w-1.5 h-1.5 bg-primary rounded-full" />
                            )}
                            
                            {/* Icon Wrapper */}
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border/40">
                              {getCategoryIcon(notif.category)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-2 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-foreground truncate">{notif.title}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${getPriorityStyle(notif.priority)}`}>
                                  {notif.priority}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-[11px] leading-relaxed">{notif.description}</p>
                              
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/60 font-semibold">
                                <Calendar size={10} />
                                <span>{notif.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 pl-2 border-l border-border">
              <img 
                src={user.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                alt="Profile" 
                className="w-9 h-9 rounded-xl object-cover border border-border bg-muted"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {user.role === 'ROLE_ADMIN' ? 'Admin' : user.role === 'ROLE_INSTRUCTOR' ? 'Instructor' : 'Student'}
                </p>
                <p className="text-sm font-bold text-foreground max-w-[120px] truncate">{user.username}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Real-time Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-card/90 border border-primary/30 shadow-2xl backdrop-blur-xl max-w-sm flex flex-col gap-1 border-l-4 border-l-primary"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground flex items-center gap-2">
                🔔 {toast.title}
              </span>
              <button 
                onClick={() => setToast(null)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-lg hover:bg-secondary"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {toast.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
