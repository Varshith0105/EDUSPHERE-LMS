import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
        rememberMe
      });

      const { token, role, userId, email, profilePictureUrl, xpPoints, streakCount } = response.data;
      
      login(token, {
        userId,
        username,
        email,
        role,
        profilePictureUrl,
        xpPoints: xpPoints || 0,
        streakCount: streakCount || 0
      });

      // Redirect based on role
      if (role === 'ROLE_ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'ROLE_INSTRUCTOR') {
        navigate('/instructor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password. Try admin / password123 or student_john / password123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl overflow-hidden p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-lg">
              E
            </div>
            <span className="font-extrabold text-2xl tracking-tight gradient-text">EduSphere AI</span>
          </div>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground text-sm mt-2">Log in to continue learning on your platform</p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (e.g. student_john)"
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
              <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary bg-secondary border-border rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="remember" className="ml-2 text-xs font-medium text-muted-foreground select-none">
              Remember me on this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-primary hover:underline font-semibold">Sign Up Free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
