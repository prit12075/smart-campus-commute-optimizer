import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Car, Activity, Send, Loader2, Search, Shield,
  CheckCircle, XCircle, TrendingUp, BarChart2, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
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

/* ── Mini bar chart ─────────────────────────────────────────────────────────── */
function MiniBar({ data = [], labelKey, valueKey, color = 'bg-brand-400', maxItems = 7 }) {
  const slice = data.slice(-maxItems);
  const max = Math.max(...slice.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {slice.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-sm ${color} transition-all`}
            style={{ height: `${Math.max(4, ((d[valueKey] || 0) / max) * 52)}px` }}
          />
          <p className="text-[9px] text-ink-300 leading-none truncate w-full text-center">
            {typeof d[labelKey] === 'string' && d[labelKey].length > 5 ? d[labelKey].slice(5) : d[labelKey]}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Hour heatmap strip ─────────────────────────────────────────────────────── */
function HourHeatmap({ data = [] }) {
  const hourMap = {};
  data.forEach(({ _id, count }) => { hourMap[_id] = count; });
  const max = Math.max(...Object.values(hourMap), 1);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 24 }, (_, h) => {
        const count = hourMap[h] || 0;
        const intensity = count / max;
        return (
          <div key={h} title={`${h}:00 — ${count} rides`}
            className="flex-1 h-6 rounded-sm transition-all cursor-default"
            style={{ background: `rgba(107, 94, 244, ${0.1 + intensity * 0.85})` }}
          />
        );
      })}
    </div>
  );
}

/* ── Donut chart (pure CSS) ──────────────────────────────────────────────────  */
function DonutStat({ items = [], colors }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  const COLORS = colors || ['#6b5ef4', '#9164f4', '#7c45ea', '#a78bfa', '#c4b5fd'];
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f0fb" strokeWidth="3.2" />
          {(() => {
            let offset = 0;
            return items.slice(0, 5).map((it, i) => {
              const pct = (it.count / total) * 100;
              const el = (
                <circle
                  key={i}
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="3.2"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += pct;
              return el;
            });
          })()}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs font-bold text-ink-800">{total}</p>
        </div>
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        {items.slice(0, 5).map((it, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-ink-600 truncate flex-1">{it._id || 'Unknown'}</span>
            <span className="font-semibold text-ink-800">{it.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users?limit=50'),
      api.get('/admin/analytics').catch(() => ({ data: { analytics: null } })),
    ])
      .then(([sRes, uRes, aRes]) => {
        setStats(sRes.data.stats);
        setUsers(uRes.data.users || []);
        setAnalytics(aRes.data.analytics);
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
    { label: 'Total Users',    value: stats?.totalUsers,       icon: Users,     colorClass: 'bg-brand-50 text-brand-600' },
    { label: 'Total Rides',    value: stats?.totalRides,       icon: Car,       colorClass: 'bg-violet-50 text-violet-600' },
    { label: 'Active Rides',   value: stats?.activeRides,      icon: Activity,  colorClass: 'bg-green-50 text-green-600' },
    { label: 'Rides This Week',value: stats?.ridesThisWeek,    icon: TrendingUp,colorClass: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50 pb-20">
      <div className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-40 -top-40 size-96 rounded-full bg-gradient-to-br from-violet-200/30 to-purple-200/30 blur-3xl" />
        </div>

        <PageWrapper className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6">

          {/* Header */}
          <motion.div variants={item} initial="hidden" animate="show" className="flex items-center gap-4 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Admin Panel</h1>
              <p className="text-ink-400 text-sm mt-0.5">Manage users, rides, and platform analytics</p>
            </div>
          </motion.div>

          {/* Stat cards */}
          <motion.div
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {statCards.map(({ label, value, icon: Icon, colorClass }) => (
              <motion.div key={label} variants={item} className="card group hover:shadow-glass-lg transition-shadow duration-300">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={19} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-ink-900 leading-none">{value ?? '—'}</p>
                    <p className="text-[11px] text-ink-400 mt-1 font-medium">{label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Analytics charts */}
          {analytics && (
            <motion.div variants={item} initial="hidden" animate="show" className="grid lg:grid-cols-3 gap-5 mb-6">

              {/* Rides per day */}
              <div className="card lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={15} className="text-brand-500" />
                  <h3 className="text-sm font-bold text-ink-800">Rides — Last 7 Days</h3>
                </div>
                {analytics.ridesByDay?.length > 0 ? (
                  <div className="space-y-3">
                    <MiniBar data={analytics.ridesByDay} labelKey="_id" valueKey="count" color="bg-brand-400" />
                    <div className="flex items-center justify-end gap-4 text-[10px] text-ink-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand-400 inline-block" /> Total rides</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-ink-400 text-center py-6">Not enough data yet</p>
                )}
              </div>

              {/* Vehicle distribution */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Car size={15} className="text-violet-500" />
                  <h3 className="text-sm font-bold text-ink-800">Vehicle Types</h3>
                </div>
                {analytics.vehicleStats?.length > 0
                  ? <DonutStat items={analytics.vehicleStats} />
                  : <p className="text-sm text-ink-400 text-center py-6">No data</p>
                }
              </div>

              {/* Peak hours heatmap */}
              <div className="card lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={15} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-ink-800">Peak Hours (30 days)</h3>
                </div>
                {analytics.ridesByHour?.length > 0 ? (
                  <>
                    <HourHeatmap data={analytics.ridesByHour} />
                    <div className="flex justify-between text-[9px] text-ink-300 mt-1">
                      <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-ink-400 text-center py-6">Not enough data yet</p>
                )}
              </div>

              {/* Ride status distribution */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={15} className="text-green-500" />
                  <h3 className="text-sm font-bold text-ink-800">Ride Status</h3>
                </div>
                {analytics.statusStats?.length > 0
                  ? <DonutStat items={analytics.statusStats}
                      colors={['#10b981','#f59e0b','#6b5ef4','#6b7280','#ef4444']} />
                  : <p className="text-sm text-ink-400 text-center py-6">No data</p>
                }
              </div>

              {/* Top departments */}
              {analytics.deptStats?.length > 0 && (
                <div className="card lg:col-span-3">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={15} className="text-brand-500" />
                    <h3 className="text-sm font-bold text-ink-800">Top Departments by Ride Activity</h3>
                  </div>
                  <div className="space-y-2">
                    {analytics.deptStats.map((d, i) => {
                      const pct = Math.round((d.count / (analytics.deptStats[0]?.count || 1)) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <p className="text-xs text-ink-600 w-48 truncate flex-shrink-0">{d._id}</p>
                          <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: i * 0.1 }}
                              className="h-full bg-gradient-brand rounded-full"
                            />
                          </div>
                          <p className="text-xs font-bold text-ink-700 w-6 text-right">{d.count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Users + Broadcast */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Users table */}
            <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 card overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-ink-800">
                  Users <span className="text-ink-300 font-normal text-sm">({users.length})</span>
                </h2>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                  <input className="input pl-8 w-44 h-9 text-sm" placeholder="Search users…"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
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
                            <button onClick={() => handleRoleToggle(u._id, u.role)}
                              className="text-xs text-brand-600 hover:text-brand-800 font-semibold">
                              {u.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                            <span className="text-ink-200">·</span>
                            <button onClick={() => handleToggleActive(u._id, u.isActive)}
                              className={`text-xs font-semibold ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
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
                    <input className="input h-10 text-sm" placeholder="Announcement title"
                      value={broadcast.title} onChange={(e) => setBroadcast((b) => ({ ...b, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Message</label>
                    <textarea className="input resize-none text-sm" rows={3} placeholder="Your message to all students…"
                      value={broadcast.message} onChange={(e) => setBroadcast((b) => ({ ...b, message: e.target.value }))} required />
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit" disabled={broadcasting} className="btn-primary w-full text-sm">
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
                        <span className={u.role === 'admin' ? 'badge-brand text-[10px]' : 'badge-gray text-[10px]'}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

        </PageWrapper>
      </div>
    </div>
  );
}
