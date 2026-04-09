import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Car, Activity, Send, Loader2, Search, Shield, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { PageLoader } from '../components/common/LoadingScreen';
import PageWrapper from '../components/common/PageWrapper';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const UserAvatar = ({ user }) => {
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
};

function StatCard({ label, value, icon: Icon, colorClass, gradientClass, index }) {
  return (
    <motion.div
      variants={item}
      className="card group hover:shadow-glass-lg transition-shadow duration-300"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden ${colorClass}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />
          <Icon size={20} />
        </div>
        <div>
          <p className="text-3xl font-extrabold text-ink-900 leading-none">{value ?? '—'}</p>
          <p className="text-xs text-ink-400 mt-1 font-medium">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users?limit=50')])
      .then(([sRes, uRes]) => {
        setStats(sRes.data.stats);
        setUsers(uRes.data.users || []);
      })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change this user to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive: !isActive } : u)));
      toast.success('User status updated');
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) return toast.error('Fill title and message');
    setBroadcasting(true);
    try {
      const { data } = await api.post('/admin/broadcast', broadcast);
      toast.success(data.message || 'Broadcast sent!');
      setBroadcast({ title: '', message: '' });
    } catch {
      toast.error('Failed to broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.registrationNumber?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, colorClass: 'bg-brand-50 text-brand-600', gradientClass: 'from-brand-400 to-violet-400' },
    { label: 'Total Rides', value: stats?.totalRides, icon: Car, colorClass: 'bg-violet-50 text-violet-600', gradientClass: 'from-violet-400 to-purple-500' },
    { label: 'Active Rides', value: stats?.activeRides, icon: Activity, colorClass: 'bg-green-50 text-green-600', gradientClass: 'from-green-400 to-emerald-500' },
    { label: 'Rides This Week', value: stats?.ridesThisWeek, icon: TrendingUp, colorClass: 'bg-amber-50 text-amber-600', gradientClass: 'from-amber-400 to-orange-400' },
  ];

  return (
    <PageWrapper className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div variants={item} initial="hidden" animate="show" className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Admin Panel</h1>
          <p className="text-ink-400 text-sm mt-0.5">Manage users and platform settings</p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((s, i) => (
          <StatCard key={s.label} {...s} index={i} />
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Users table */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-ink-800">
              Users <span className="text-ink-300 font-normal text-sm">({users.length})</span>
            </h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                className="input pl-8 w-44 h-9 text-sm"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-xs text-ink-400 border-b border-ink-100">
                  <th className="text-left pb-2.5 px-2 font-semibold">Student</th>
                  <th className="text-left pb-2.5 px-2 font-semibold hidden sm:table-cell">Reg No.</th>
                  <th className="text-left pb-2.5 px-2 font-semibold">Role</th>
                  <th className="text-left pb-2.5 px-2 font-semibold">Status</th>
                  <th className="pb-2.5 px-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-b border-ink-50 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={u} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-800 truncate max-w-[120px]">{u.name}</p>
                          <p className="text-[11px] text-ink-400 truncate max-w-[120px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 hidden sm:table-cell">
                      <span className="text-xs text-ink-500 font-mono">{u.registrationNumber || '—'}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={u.role === 'admin' ? 'badge-brand' : 'badge-gray'}>{u.role}</span>
                    </td>
                    <td className="py-3 px-2">
                      {u.isActive
                        ? <span className="badge-green flex items-center gap-0.5 w-fit"><CheckCircle size={9} /> Active</span>
                        : <span className="badge-red flex items-center gap-0.5 w-fit"><XCircle size={9} /> Inactive</span>}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRoleToggle(u._id, u.role)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <span className="text-ink-200">·</span>
                        <button
                          onClick={() => handleToggleActive(u._id, u.isActive)}
                          className={`text-xs font-semibold ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-ink-400 text-sm">No users found</div>
            )}
          </div>
        </motion.div>

        {/* Right column */}
        <motion.div variants={item} initial="hidden" animate="show" className="space-y-5">
          {/* Broadcast */}
          <div className="card">
            <h2 className="text-base font-bold text-ink-800 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center">
                <Send size={13} className="text-brand-600" />
              </div>
              Broadcast
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div>
                <label className="label">Title</label>
                <input
                  className="input h-10 text-sm"
                  placeholder="Announcement title"
                  value={broadcast.title}
                  onChange={(e) => setBroadcast((b) => ({ ...b, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input resize-none text-sm"
                  rows={4}
                  placeholder="Your message to all students…"
                  value={broadcast.message}
                  onChange={(e) => setBroadcast((b) => ({ ...b, message: e.target.value }))}
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={broadcasting}
                className="btn-primary w-full text-sm"
              >
                {broadcasting ? <Loader2 size={14} className="animate-spin" /> : <><Send size={13} /> Send to All</>}
              </motion.button>
            </form>
          </div>

          {/* Recent signups */}
          {stats?.recentUsers?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-ink-800 mb-4">Recent Signups</h3>
              <div className="space-y-3">
                {stats.recentUsers.map((u) => (
                  <div key={u._id} className="flex items-center gap-2.5">
                    <UserAvatar user={u} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-ink-400">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
