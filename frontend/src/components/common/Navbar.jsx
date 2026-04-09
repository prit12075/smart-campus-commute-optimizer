import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ChevronDown, LogOut, User, Car,
  LayoutDashboard, Shield, Menu, X, CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const Avatar = ({ user, size = 'sm' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white shadow-sm`}>
      {user?.avatar
        ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        : initials}
    </div>
  );
};

const NotifIcon = {
  ride_accepted: '🎉', ride_rejected: '😔', ride_request: '🙋',
  ride_cancelled: '❌', ride_match: '✨', system: '📢', default: '🔔',
};

export default function Navbar() {
  const { user, isAdmin, logout, notifications, unreadCount, markAllRead } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/rides', label: 'Rides', icon: Car },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotifOpen = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next && unreadCount > 0) markAllRead();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-ink-100 shadow-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-shadow">
              <Car size={15} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-ink-900 text-sm leading-none">Smart Campus</span>
              <p className="text-[10px] text-ink-400 leading-none mt-0.5">SRM University</p>
            </div>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50'
                }`}
              >
                <Icon size={15} />
                {label}
                {isActive(to) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl bg-brand-50 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleNotifOpen}
                className="relative p-2 rounded-xl text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
              >
                <Bell size={18} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-glass-lg border border-ink-100 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-ink-50 flex items-center justify-between">
                      <span className="font-semibold text-ink-800 text-sm">Notifications</span>
                      {notifications.length > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium">
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={28} className="mx-auto text-ink-200 mb-2" />
                          <p className="text-sm text-ink-400">All caught up!</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n._id} className={`px-4 py-3 border-b border-ink-50 hover:bg-ink-50 transition-colors ${!n.isRead ? 'bg-brand-50/40' : ''}`}>
                            <div className="flex gap-2.5">
                              <span className="text-base flex-shrink-0 mt-0.5">
                                {NotifIcon[n.type] || NotifIcon.default}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${!n.isRead ? 'text-ink-900' : 'text-ink-600'}`}>{n.title}</p>
                                <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-ink-300 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div ref={profileRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-ink-50 transition-colors"
              >
                <Avatar user={user} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-ink-700 max-w-20 truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown size={13} className={`text-ink-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-glass-lg border border-ink-100 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3.5 bg-gradient-to-br from-brand-50 to-violet-50 border-b border-ink-100">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={user} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">{user?.name}</p>
                          <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                          {user?.registrationNumber && (
                            <p className="text-xs font-medium text-brand-600 mt-0.5">{user.registrationNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="py-1.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
                      >
                        <User size={15} className="text-ink-400" /> My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden btn-icon">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-ink-100"
            >
              <div className="py-3 space-y-1">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(to) ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
