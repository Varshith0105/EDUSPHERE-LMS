import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trophy, Medal, Flame, Star, Loader2, BookOpen, Clock, Award, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface LeaderboardUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  xpPoints: number;
  streakCount: number;
}

interface CourseLeaderboardEntry {
  studentName: string;
  score: number;
  percentage: number;
  rank: number;
  overallRank: number;
  attempts: number;
  timeTakenSeconds: number;
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseLeaderboard, setCourseLeaderboard] = useState<CourseLeaderboardEntry[]>([]);
  const [viewMode, setViewMode] = useState<'global' | 'course'>('global');
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (viewMode === 'course' && selectedCourseId) {
      fetchCourseLeaderboard(selectedCourseId);
    }
  }, [viewMode, selectedCourseId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [leaderRes, enrollRes] = await Promise.all([
        api.get('/api/lms/leaderboard'),
        api.get('/api/lms/enrollments')
      ]);
      setLeaders(leaderRes.data || []);
      const courses = enrollRes.data || [];
      setEnrolledCourses(courses);
      if (courses.length > 0) {
        setSelectedCourseId(courses[0].course.id);
      }
    } catch (err) {
      console.error('Error fetching leaderboard initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseLeaderboard = async (courseId: number) => {
    try {
      setCourseLoading(true);
      const res = await api.get(`/api/lms/leaderboard/course/${courseId}`);
      setCourseLeaderboard(res.data || []);
    } catch (err) {
      console.error('Error fetching course leaderboard', err);
    } finally {
      setCourseLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} className="text-amber-400" />;
    if (rank === 2) return <Medal size={20} className="text-slate-400" />;
    if (rank === 3) return <Medal size={20} className="text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-amber-400/10 border-amber-400/35 shadow-amber-400/5';
    if (rank === 2) return 'bg-slate-400/10 border-slate-400/35';
    if (rank === 3) return 'bg-amber-700/10 border-amber-700/35';
    return 'bg-card border-border';
  };

  const formatDuration = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return min > 0 ? `${min}m ${s}s` : `${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const myRank = leaders.findIndex((l) => l.username === user?.username) + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">🏆 Hall of Fame</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Track learning scores, quiz rankings, and platform streak progress. Select a tab below to switch views.
        </p>
      </div>

      {/* Tabs / Toggle */}
      <div className="flex bg-secondary/55 p-1 rounded-2xl max-w-md mx-auto text-xs font-bold shadow-sm">
        <button
          onClick={() => setViewMode('global')}
          className={`flex-1 py-3 rounded-xl transition-all ${
            viewMode === 'global' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🌐 Global XP Leaderboard
        </button>
        <button
          onClick={() => setViewMode('course')}
          className={`flex-1 py-3 rounded-xl transition-all ${
            viewMode === 'course' ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📘 Course Performance
        </button>
      </div>

      {/* Course Select Dropdown (visible in Course mode) */}
      {viewMode === 'course' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Select Course</h3>
            <p className="text-[11px] text-muted-foreground">Select one of your enrolled courses to view student rankings.</p>
          </div>
          {enrolledCourses.length === 0 ? (
            <span className="text-xs text-muted-foreground font-semibold">Not enrolled in any courses</span>
          ) : (
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary max-w-xs"
            >
              {enrolledCourses.map((e) => (
                <option key={e.course.id} value={e.course.id}>
                  {e.course.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* View Mode: Global Leaderboard */}
      {viewMode === 'global' && (
        <>
          {/* My Rank Card */}
          {myRank > 0 && (
            <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <Star size={18} className="text-primary animate-pulse" />
                <p className="text-sm font-bold">Your Global Rank: <span className="text-primary font-extrabold">#{myRank}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Your XP</p>
                <p className="font-extrabold text-primary">{user?.xpPoints} XP</p>
              </div>
            </div>
          )}

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto pt-4">
            {[leaders[1], leaders[0], leaders[2]].map((leader, pIdx) => {
              if (!leader) return <div key={pIdx} />;
              const ranks = [2, 1, 3];
              const rank = ranks[pIdx];
              return (
                <motion.div
                  key={leader.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pIdx * 0.1 }}
                  className={`flex flex-col items-center gap-2 bg-card border rounded-3xl p-5 ${getRankBg(rank)} relative`}
                >
                  <div className="relative">
                    <img
                      src={leader.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.username}`}
                      alt={leader.username}
                      className="w-14 h-14 rounded-full border-2 border-background shadow-lg object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow">
                      {getRankIcon(rank)}
                    </div>
                  </div>
                  <p className="font-bold text-xs text-center truncate w-full mt-1">{leader.firstName}</p>
                  <p className="text-xs font-extrabold text-primary">{leader.xpPoints} XP</p>
                </motion.div>
              );
            })}
          </div>

          {/* Full Rankings Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-secondary/20">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">All Rankings</h3>
            </div>
            {leaders.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">No students logged.</div>
            ) : (
              <div className="divide-y divide-border">
                {leaders.map((leader, idx) => {
                  const rank = idx + 1;
                  const isMe = leader.username === user?.username;
                  return (
                    <motion.div
                      key={leader.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                      className={`flex items-center gap-4 px-6 py-4 hover:bg-secondary/15 transition-colors ${isMe ? 'bg-primary/5' : ''}`}
                    >
                      <div className="w-8 flex justify-center shrink-0">
                        {getRankIcon(rank)}
                      </div>
                      <img
                        src={leader.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.username}`}
                        alt={leader.username}
                        className="w-10 h-10 rounded-xl border border-border shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : ''}`}>
                          {leader.firstName} {leader.lastName}
                          {isMe && <span className="ml-2 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">You</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">@{leader.username}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-sm text-foreground">{leader.xpPoints} XP</p>
                        <p className="text-xs text-amber-500 flex items-center justify-end gap-1 mt-0.5 font-semibold">
                          <Flame size={11} /> {leader.streakCount} days
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* View Mode: Course-Specific Performance */}
      {viewMode === 'course' && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Course Performance Rankings</h3>
            <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">
              Grades Sorted
            </span>
          </div>

          {courseLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : courseLeaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No submissions or quiz scores graded in this course yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/10 font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-6 text-center w-16">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 text-center">Avg Score</th>
                    <th className="py-3 px-4 text-center">Avg Grade %</th>
                    <th className="py-3 px-4 text-center">Attempts</th>
                    <th className="py-3 px-4 text-center">Time Taken</th>
                    <th className="py-3 px-6 text-center">Platform Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-semibold">
                  {courseLeaderboard.map((entry, idx) => {
                    const isCurrentUser = user && user.firstName && entry.studentName.toLowerCase().includes(user.firstName.toLowerCase());
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-secondary/15 transition-colors ${
                          isCurrentUser ? 'bg-primary/5 text-primary' : ''
                        }`}
                      >
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">{getRankIcon(entry.rank)}</div>
                        </td>
                        <td className="py-4 px-4 font-bold">
                          {entry.studentName}
                          {isCurrentUser && (
                            <span className="ml-2 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-extrabold">
                          {entry.score} pts
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            entry.percentage >= 80 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            entry.percentage >= 60 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {entry.percentage}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-muted-foreground">
                          {entry.attempts} attempts
                        </td>
                        <td className="py-4 px-4 text-center text-muted-foreground flex items-center justify-center gap-1">
                          <Clock size={11} /> {formatDuration(entry.timeTakenSeconds)}
                        </td>
                        <td className="py-4 px-6 text-center text-muted-foreground">
                          #{entry.overallRank}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
