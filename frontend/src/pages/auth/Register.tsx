import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { User, Mail, Lock, Loader2, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/register', {
        username,
        email,
        password,
        firstName,
        lastName,
        role: role.toLowerCase()
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
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
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-lg">
              E
            </div>
            <span className="font-extrabold text-2xl tracking-tight gradient-text">EduSphere AI</span>
          </div>
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-muted-foreground text-sm mt-2">Sign up to access course dashboards and start learning</p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            Registration successful! Redirecting to login page...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role Selection Blocks */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                role === 'STUDENT'
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen size={20} className="mt-0.5" />
              <div>
                <p className="font-bold text-sm">Student</p>
                <p className="text-[11px] opacity-80 mt-0.5">Learn, take quizzes, earn certificates</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('INSTRUCTOR')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                role === 'INSTRUCTOR'
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap size={20} className="mt-0.5" />
              <div>
                <p className="font-bold text-sm">Instructor</p>
                <p className="text-[11px] opacity-80 mt-0.5">Build courses, write forums, track progress</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe1"
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 gradient-bg hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 group transition-all shadow-lg shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Register Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline font-semibold">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
