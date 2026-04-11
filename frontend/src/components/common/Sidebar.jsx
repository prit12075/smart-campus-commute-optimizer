import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Car, User, LogOut, AlertTriangle,
  Search, ChevronDown, ChevronUp, Bell, Map, Star,
  MessageSquare, Plus, Settings, TrendingUp, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

/* ── Brand lockup ─────────────────────────────────────────── */
const BrandLogo = () => (
  <div className="flex flex-col items-start gap-2.5">
    <div className="flex flex-col leading-[0.85] tracking-tighter font-black" style={{ fontSize: '2.6rem' }}>
      <div>
        <span className="text-white">Sm</span>
        <span style={{
          display: 'inline-block', background: 'white', color: '#7c3aed',
          borderRadius: '0.28em', padding: '0 0.12em', fontSize: '0.88em',
          lineHeight: 1.05, transform: 'rotate(-5deg)', verticalAlign: 'middle',
        }}>A</span>
        <span className="text-white">rt</span>
      </div>
      <div style={{ marginTop: '-4px' }}>
        <span className="text-white">Cam</span>
        <span style={{
          display: 'inline-block', background: '#a78bfa', color: 'white',
          borderRadius: '0.28em', padding: '0 0.12em', fontSize: '0.88em',
          lineHeight: 1.05, transform: 'rotate(4deg)', verticalAlign: 'middle',
        }}>P</span>
        <span className="text-white">us</span>
      </div>
    </div>
    <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-semibold">Ride · Share · Commute</p>
  </div>
);

/* ── Nav item ─────────────────────────────────────────────── */
const NavItem = ({ icon: Icon, label, href, badge, sub = [] }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <NavLink
        to={sub.length ? '#' : href}
        onClick={sub.length ? (e) => { e.preventDefault(); setOpen((o) => !o); } : undefined}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group cursor-pointer ${
            isActive && !sub.length
              ? 'bg-white/15 text-white shadow-inner'
              : 'text-white/60 hover:text-white hover:bg-white/8'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all ${
              isActive && !sub.length ? 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]' : 'bg-white/5 group-hover:bg-white/10'
            }`}>
              <Icon size={16} strokeWidth={isActive && !sub.length ? 2.5 : 2} />
            </div>
            <span className="flex-1 text-sm">{label}</span>
            {badge && <span className="text-[10px] bg-violet-500 text-white px-1.5 py-0.5 rounded-full font-bold">{badge}</span>}
            {sub.length > 0 && (
              <span className="text-white/30">{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
            )}
          </>
        )}
      </NavLink>

      {/* Sub-items */}
      <AnimatePresence>
        {open && sub.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-4 mt-0.5 border-l border-white/10 pl-3 space-y-0.5"
          >
            {sub.map(({ label: sl, href: sh, highlight }) => (
              <NavLink
                key={sh}
                to={sh}
                className={({ isActive }) =>
                  `block py-1.5 px-2 text-xs rounded-lg transition-colors ${
                    isActive || highlight ? 'text-white font-semibold bg-white/8' : 'text-white/45 hover:text-white/80'
                  }`
                }
              >
                {sl}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Chat item ────────────────────────────────────────────── */
const ChatItem = ({ name, msg, time, online, unread }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <NavLink to="/messages" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/8 transition-colors group text-left">
      <div className="relative shrink-0">
        <div className="size-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
          {initials}
        </div>
        {online && <span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-400 border border-[#1a0b2e]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/80 truncate">{name}</p>
          <span className="text-[9px] text-white/30 shrink-0">{time}</span>
        </div>
        <p className="text-[10px] text-white/40 truncate">{msg}</p>
      </div>
      {unread > 0 && (
        <span className="shrink-0 size-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>
      )}
    </NavLink>
  );
};

const MOCK_CHATS = [
  { name: 'Arjun Kumar', msg: 'At gate by 8am, come!', time: '9m', online: true, unread: 2 },
  { name: 'Priya S', msg: 'Can we share the ride?', time: '1h', online: true, unread: 0 },
  { name: 'Rahul M', msg: 'Thanks for the ride!', time: '3h', online: false, unread: 0 },
];

/* ── Main Sidebar ─────────────────────────────────────────── */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');

  const handleSOS = async () => {
    if (!window.confirm('⚠️ Send emergency alert to campus security?')) return;
    try {
      const pos = await new Promise((resolve) =>
        navigator.geolocation
          ? navigator.geolocation.getCurrentPosition(
              (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
              () => resolve({ lat: 16.4420, lng: 80.6220 }),
              { timeout: 5000 }
            )
          : resolve({ lat: 16.4420, lng: 80.6220 })
      );
      await api.post('/rides/sos', pos);
      toast.success('🚨 SOS alert sent!');
    } catch {
      toast.error('Failed to send SOS');
    }
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-72 z-50 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0b2e 0%, #2d1252 50%, #0f0820 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/20 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-32 left-0 w-48 h-48 bg-purple-800/20 rounded-full blur-[60px] pointer-events-none" />

        {/* Brand */}
        <div className="relative px-6 pt-8 pb-5">
          <BrandLogo />
        </div>

        {/* Search */}
        <div className="relative px-4 mb-4">
          <Search size={13} className="absolute left-7 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rides, people..."
            className="w-full bg-white/6 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-none">

          {/* MAIN section */}
          <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-bold px-3 pb-1 pt-2">Main</p>

          <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" sub={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'My Rides', href: '/rides?tab=mine' },
            { label: 'Analytics', href: '/dashboard#analytics', highlight: false },
          ]} />

          <NavItem icon={Car} label="Rides" href="/rides" badge="Live" sub={[
            { label: 'Find Offers', href: '/rides?type=offer' },
            { label: 'Find Requests', href: '/rides?type=request' },
            { label: 'Post a Ride', href: '/rides?action=post' },
          ]} />

          <NavItem icon={Map} label="Campus Map" href="/map" />

          <NavItem icon={TrendingUp} label="AI Suggestions" href="/dashboard" />

          <NavItem icon={Bell} label="Notifications" href="/dashboard" badge="3" />

          {/* ACCOUNT section */}
          <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-bold px-3 pb-1 pt-4">Account</p>

          <NavItem icon={User} label="Profile" href="/profile" />
          <NavItem icon={Star} label="My Reviews" href="/profile#reviews" />
          <NavItem icon={Shield} label="Trust & Safety" href="/profile#safety" />
          <NavItem icon={Settings} label="Settings" href="/profile#settings" />

          {/* SOS */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSOS}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/18 transition-all"
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
              <AlertTriangle size={15} />
              <span className="absolute -top-0.5 -right-0.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
            </div>
            <span className="text-sm font-semibold">SOS Emergency</span>
          </motion.button>

          {/* MESSAGES section */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 pb-2">
              <NavLink to="/messages" className="text-[9px] text-white/25 hover:text-white/60 uppercase tracking-[0.2em] font-bold transition-colors">Messages</NavLink>
              <NavLink to="/messages" className="text-white/30 hover:text-white/70 transition-colors">
                <Plus size={12} />
              </NavLink>
            </div>
            <div className="space-y-0.5">
              {MOCK_CHATS
                .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
                .map((chat) => <ChatItem key={chat.name} {...chat} />)}
            </div>
          </div>

        </div>

        {/* Bottom profile */}
        <div className="relative p-4 border-t border-white/8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer group">
            <div className="size-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-white text-xs shadow-lg overflow-hidden shrink-0 ring-2 ring-white/10">
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" className="size-full object-cover" />
                : user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-none">{user?.name || 'Student'}</p>
              <p className="text-[10px] text-violet-300/70 truncate mt-0.5">{user?.registrationNumber || user?.email}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="shrink-0 size-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition-colors"
              title="Sign out"
            >
              <LogOut size={13} />
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────── */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="md:hidden fixed bottom-4 left-4 right-4 z-50"
      >
        <div className="flex items-center justify-around px-2 py-2 bg-[#1a0b2e]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl">
          {[
            { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
            { href: '/rides', icon: Car, label: 'Rides' },
            { href: '/map', icon: Map, label: 'Map' },
            { href: '/messages', icon: MessageSquare, label: 'Chat' },
            { href: '/profile', icon: User, label: 'Me' },
          ].map(({ href, icon: Icon, label }) => (
            <NavLink key={href} to={href} className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all ${isActive ? 'text-white' : 'text-violet-300/60'}`
            }>
              {({ isActive }) => (
                <>
                  <div className={`size-9 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]' : ''}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className="text-[9px] font-semibold tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <NavLink to="/profile" className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-violet-300/60">
            <div className="size-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden ring-2 ring-white/10">
              {user?.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <span className="text-[9px] font-semibold tracking-wide">Profile</span>
          </NavLink>
        </div>
      </motion.nav>
    </>
  );
}
