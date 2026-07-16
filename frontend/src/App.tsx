import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './components/DashboardLayout';

// Pages — Auth
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Pages — Public
import { LandingPage } from './pages/LandingPage';

// Pages — Student
import { StudentDashboard } from './pages/student/StudentDashboard';
import { VideoPlayer } from './pages/student/VideoPlayer';
import { QuizPage } from './pages/student/QuizPage';
import { AssignmentsPage } from './pages/student/AssignmentsPage';
import { LeaderboardPage } from './pages/student/LeaderboardPage';
import { CertificatePage } from './pages/student/CertificatePage';

// Pages — Instructor
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { CourseBuilder } from './pages/instructor/CourseBuilder';
import { SubmissionsPage } from './pages/instructor/SubmissionsPage';
import { CourseManager } from './pages/instructor/CourseManager';

// Pages — Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminMonitor } from './pages/admin/AdminMonitor';


// ─── React Query Client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

// ─── Protected Route Guards ───────────────────────────────────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'ROLE_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'ROLE_INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user) {
    if (user.role === 'ROLE_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'ROLE_INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
};

// ─── App Routing ─────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ── Public Routes ── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Auth Routes ── */}
      <Route path="/auth/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
      <Route path="/auth/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />

      {/* ── Student Routes ── */}
      <Route
        path="/student/*"
        element={
          <RequireAuth allowedRoles={['ROLE_STUDENT', 'ROLE_INSTRUCTOR', 'ROLE_ADMIN']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="courses" element={<StudentDashboard />} />
                <Route path="classroom/:courseId" element={<VideoPlayer />} />
                <Route path="quiz/:courseId" element={<QuizPage />} />
                <Route path="assignments/:courseId" element={<AssignmentsPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="certificate/:courseId" element={<CertificatePage />} />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* ── Instructor Routes ── */}
      <Route
        path="/instructor/*"
        element={
          <RequireAuth allowedRoles={['ROLE_INSTRUCTOR', 'ROLE_ADMIN']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<InstructorDashboard />} />
                <Route path="courses" element={<InstructorDashboard />} />
                <Route path="new-course" element={<CourseBuilder />} />
                <Route path="manage/:courseId" element={<CourseManager />} />
                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="*" element={<Navigate to="/instructor/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* ── Admin Routes ── */}
      <Route
        path="/admin/*"
        element={
          <RequireAuth allowedRoles={['ROLE_ADMIN']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="approvals" element={<AdminDashboard />} />
                <Route path="monitor" element={<AdminMonitor />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </RequireAuth>
        }
      />

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
