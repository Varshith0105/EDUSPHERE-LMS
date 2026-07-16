import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Users, Search, Filter, UserCheck, UserX,
  Loader2, ChevronRight, Shield, BookOpen, GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UserRecord {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { name: string };
  xpPoints: number;
  streakCount: number;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Mock data based on seeded users
      const mockUsers: UserRecord[] = [
        { id: 1, username: 'admin', email: 'admin@edusphere.com', firstName: 'System', lastName: 'Administrator', role: { name: 'ROLE_ADMIN' }, xpPoints: 0, streakCount: 0 },
        { id: 2, username: 'instructor_jane', email: 'jane@edusphere.com', firstName: 'Jane', lastName: 'Doe', role: { name: 'ROLE_INSTRUCTOR' }, xpPoints: 150, streakCount: 4 },
        { id: 3, username: 'student_john', email: 'john@edusphere.com', firstName: 'John', lastName: 'Smith', role: { name: 'ROLE_STUDENT' }, xpPoints: 1250, streakCount: 5 },
        { id: 4, username: 'student_alice', email: 'alice@edusphere.com', firstName: 'Alice', lastName: 'Johnson', role: { name: 'ROLE_STUDENT' }, xpPoints: 450, streakCount: 2 },
      ];
      setUsers(mockUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName === 'ROLE_ADMIN') return <Shield size={14} className="text-destructive" />;
    if (roleName === 'ROLE_INSTRUCTOR') return <GraduationCap size={14} className="text-blue-500" />;
    return <BookOpen size={14} className="text-emerald-500" />;
  };

  const getRoleBadge = (roleName: string) => {
    const label = roleName.replace('ROLE_', '');
    if (roleName === 'ROLE_ADMIN') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (roleName === 'ROLE_INSTRUCTOR') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || u.role.name === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage all platform users.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All Roles</option>
            <option value="ROLE_STUDENT">Students</option>
            <option value="ROLE_INSTRUCTOR">Instructors</option>
            <option value="ROLE_ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {/* User Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Students', count: users.filter(u => u.role.name === 'ROLE_STUDENT').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Instructors', count: users.filter(u => u.role.name === 'ROLE_INSTRUCTOR').length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Admins', count: users.filter(u => u.role.name === 'ROLE_ADMIN').length, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((s, idx) => (
          <div key={idx} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/10">
                  <th className="text-left py-3 px-6">User</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">XP Points</th>
                  <th className="text-left py-3 px-4">Streak</th>
                  <th className="text-right py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u, idx) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                          alt={u.username}
                          className="w-9 h-9 rounded-xl border border-border bg-muted shrink-0"
                        />
                        <div>
                          <p className="text-sm font-bold">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted-foreground">@{u.username} · {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadge(u.role.name)}`}>
                        {getRoleIcon(u.role.name)} {u.role.name.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold text-primary">{u.xpPoints} XP</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-amber-500">🔥 {u.streakCount} days</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                        View <ChevronRight size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
