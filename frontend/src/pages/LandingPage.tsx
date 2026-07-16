import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, Users, Award, Shield, ChevronRight, CheckCircle2, 
  HelpCircle, Star, Sparkles, LogIn, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartLearning = () => {
    if (user) {
      if (user.role === 'ROLE_ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'ROLE_INSTRUCTOR') navigate('/instructor/dashboard');
      else navigate('/student/dashboard');
    } else {
      navigate('/auth/login');
    }
  };

  const statistics = [
    { label: 'Active Students', value: '15,000+', icon: Users },
    { label: 'Expert Instructors', value: '250+', icon: Award },
    { label: 'Certified Courses', value: '1,200+', icon: BookOpen },
    { label: 'Success Rate', value: '98.5%', icon: Shield },
  ];

  const popularCourses = [
    {
      title: 'Introduction to React 19 & TypeScript',
      desc: 'Build scalable, type-safe web applications from scratch utilizing hooks and Shadcn primitives.',
      instructor: 'Jane Doe',
      price: '$49.99',
      rating: 4.8,
      img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400',
    },
    {
      title: 'Mastering Spring Boot 3 & Java 21',
      desc: 'Develop high-performance, secure backend REST APIs integrated with Spring Security and JPA.',
      instructor: 'Jane Doe',
      price: '$99.99',
      rating: 4.9,
      img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400',
    },
    {
      title: 'Generative AI & LLM Foundations',
      desc: 'An introductory course to Large Language Models, Prompt engineering, and RAG systems.',
      instructor: 'Jane Doe',
      price: 'Free',
      rating: 4.7,
      img: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=400',
    }
  ];

  const faqs = [
    { q: 'Is the certificate accredited?', a: 'Yes, every completed course automatically generates a verifiable certificate with a unique UUID hash and QR validation code.' },
    { q: 'Can I teach on EduSphere AI?', a: 'Yes, register as an Instructor to design modules, upload slides/videos, manage quizzes and grade student assignments.' },
    { q: 'What database supports this system?', a: 'The backend uses Spring Data JPA connecting to a high-availability MySQL/Azure SQL database cluster.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground overflow-x-hidden transition-colors duration-300">
      
      {/* Header Banner */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card/85 backdrop-blur-md border-b border-border z-50 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-lg shadow-lg">
            E
          </div>
          <span className="font-extrabold text-xl tracking-tight gradient-text">EduSphere AI</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button 
              onClick={handleStartLearning}
              className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
            >
              Dashboard <ArrowUpRight size={16} />
            </button>
          ) : (
            <>
              <Link to="/auth/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                <LogIn size={16} /> Sign In
              </Link>
              <Link to="/auth/register" className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/20">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles size={14} /> Next-Gen AI Powered Learning
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Empower Your Future with <span className="gradient-text">EduSphere AI</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
            A production-ready, Azure-integrated Online Learning Management System designed to build, learn, track, and certificate.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={handleStartLearning}
              className="px-6 py-3.5 bg-primary hover:opacity-95 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              Start Learning Free <ChevronRight size={18} />
            </button>
            <a 
              href="#courses"
              className="px-6 py-3.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-2xl transition-all border border-border"
            >
              Browse Catalog
            </a>
          </div>
        </motion.div>

        {/* Hero Banner Grid/Image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-accent/20 to-transparent blur-3xl rounded-full" />
          <img 
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800" 
            alt="Learning Dashboard Mockup" 
            className="rounded-3xl shadow-2xl border border-border relative z-10 w-full object-cover aspect-[4/3] bg-card"
          />
        </motion.div>
      </section>

      {/* Animated Statistics */}
      <section className="py-12 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {statistics.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Icon size={20} />
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold">{stat.value}</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Courses Section */}
      <section id="courses" className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Explore Popular Courses</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">Accelerate your programming skills with our structured curriculum.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {popularCourses.map((course, idx) => (
            <div key={idx} className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
              <div className="relative overflow-hidden aspect-video bg-muted">
                <img 
                  src={course.img} 
                  alt={course.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold backdrop-blur-sm">
                  {course.price}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold text-foreground">{course.rating}</span>
                  </div>
                  <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors">{course.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{course.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground">By {course.instructor}</span>
                  <button 
                    onClick={handleStartLearning}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    View details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-sm">No contract. Complete access to student community forums.</p>
          </div>
          <div className="max-w-sm mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl text-center space-y-6">
            <h3 className="font-bold text-xl uppercase tracking-wider text-primary">All-Access Membership</h3>
            <div className="space-y-1">
              <span className="text-4xl font-extrabold">$19</span>
              <span className="text-muted-foreground text-sm"> / month</span>
            </div>
            <p className="text-xs text-muted-foreground">Unlock certificates, download syllabus PDFs, quizzes evaluation and notes bookmarker.</p>
            <ul className="space-y-3 text-left py-4">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={16} className="text-emerald-500" /> Verifiable PDF Certificates
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={16} className="text-emerald-500" /> Full Coding Exercises access
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={16} className="text-emerald-500" /> Discussion Forum replies
              </li>
            </ul>
            <button 
              onClick={handleStartLearning}
              className="w-full py-3 bg-primary hover:opacity-95 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto space-y-12">
        <h2 className="text-3xl font-bold text-center tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 bg-card border border-border rounded-2xl flex gap-4">
              <HelpCircle size={24} className="text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-base">{faq.q}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6 text-center text-muted-foreground text-sm">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex justify-center items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">E</div>
            <span className="font-bold text-foreground">EduSphere AI</span>
          </div>
          <p>© {new Date().getFullYear()} EduSphere AI Online LMS. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-xs pt-2">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="#" className="hover:text-foreground">Support Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
