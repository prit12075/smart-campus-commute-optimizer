import { useState, useEffect } from 'react';
import { Users, Car, Activity, Send, Loader2, Search, Shield, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
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
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users?limit=50'),
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data.stats);
        setUsers(usersRes.data.users || []);
      })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change this user to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: !isActive } : u));
      toast.success('User status updated');
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) return toast.error('Fill title and message');
    setBroadcasting(true);
    try {
      const { data } = await api.post('/admin/broadcast', broadcast);
      toast.success(data.message);
      setBroadcast({ title: '', message: '' });
    } catch (err) {
      toast.error('Failed to broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <Shield size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500">Manage users and platform settings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} color="bg-primary-50 text-primary-600" />
        <StatCard label="Total Rides" value={stats?.totalRides} icon={Car} color="bg-purple-50 text-purple-600" />
        <StatCard label="Active Rides" value={stats?.activeRides} icon={Activity} color="bg-green-50 text-green-600" />
        <StatCard label="Rides This Week" value={stats?.ridesThisWeek} icon={Car} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Users ({users.length})</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-8 w-48 h-9 text-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-surface-100">
                  <th className="text-left pb-2 px-1">Student</th>
                  <th className="text-left pb-2 px-1 hidden sm:table-cell">Reg No.</th>
                  <th className="text-left pb-2 px-1">Role</th>
                  <th className="text-left pb-2 px-1">Status</th>
                  <th className="pb-2 px-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-surface-50 transition-colors">
                    <td className="py-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                          {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 truncate max-w-28">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-28">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-1 hidden sm:table-cell">
                      <span className="text-xs text-slate-500">{u.registrationNumber || '—'}</span>
                    </td>
                    <td className="py-2.5 px-1">
                      <span className={u.role === 'admin' ? 'badge-primary' : 'badge-gray'}>{u.role}</span>
                    </td>
                    <td className="py-2.5 px-1">
                      {u.isActive
                        ? <span className="badge-green flex items-center gap-0.5 w-fit"><CheckCircle size={10} />Active</span>
                        : <span className="badge-red flex items-center gap-0.5 w-fit"><XCircle size={10} />Inactive</span>}
                    </td>
                    <td className="py-2.5 px-1">
                      <div className="flex gap-1">
                        <button onClick={() => handleRoleToggle(u._id, u.role)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => handleToggleActive(u._id, u.isActive)} className={`text-xs font-medium ${u.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">No users found</div>
            )}
          </div>
        </div>

        {/* Broadcast Panel */}
        <div className="card h-fit">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Send size={16} className="text-primary-500" /> Broadcast
          </h2>
          <form onSubmit={handleBroadcast} className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="Announcement title" value={broadcast.title} onChange={(e) => setBroadcast((b) => ({ ...b, title: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input resize-none" rows={4} placeholder="Your message to all students..." value={broadcast.message} onChange={(e) => setBroadcast((b) => ({ ...b, message: e.target.value }))} required />
            </div>
            <button type="submit" disabled={broadcasting} className="btn-primary w-full">
              {broadcasting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Send to All</>}
            </button>
          </form>

          {/* Recent Users */}
          {stats?.recentUsers?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Signups</h3>
              <div className="space-y-2">
                {stats.recentUsers.map((u) => (
                  <div key={u._id} className="flex items-center gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {u.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 truncate">{u.name}</p>
                      <p className="text-slate-400">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
