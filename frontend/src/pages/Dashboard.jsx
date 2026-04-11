import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car, Users, Clock, ChevronRight, Plus, AlertCircle,
  MapPin, Calendar, TrendingUp, Zap, Star, Repeat,
  Navigation, Bell,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/LoadingScreen';
import PageWrapper from '../components/common/PageWrapper';
import MapView from '../components/common/MapView';
import RideProgressTracker from '../components/common/RideProgressTracker';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const Avatar = ({ user, size = 9 }) => {
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } },
};
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const StatusBadge = ({ status }) => {
  const map = {
    active: 'badge-green', full: 'badge-yellow',
    in_progress: 'badge-brand', completed: 'badge-gray', cancelled: 'badge-red',
  };
  return <span className={map[status] || 'badge-gray'}>{status?.replace('_', ' ')}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/dashboard'),
      api.get('/rides/suggestions').catch(() => ({ data: { suggestions: [], peakHour: null } })),
    ]).then(([dashRes, suggestRes]) => {
      setData(dashRes.data.data);
      setSuggestions(suggestRes.data.suggestions || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const profileIncomplete = !user?.isProfileComplete;
  const stats = [
    { label: 'My Rides', value: data?.stats?.totalRides ?? 0, icon: Car, color: 'bg-brand-50 text-brand-600', gradient: 'from-brand-500 to-violet-500' },
    { label: 'Active', value: data?.stats?.activeRides ?? 0, icon: Clock, color: 'bg-green-50 text-green-600', gradient: 'from-green-400 to-emerald-500' },
    { label: 'Nearby Offers', value: data?.nearbyOffers?.length ?? 0, icon: Users, color: 'bg-violet-50 text-violet-600', gradient: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50 pb-20">
      <div className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-40 -top-40 size-96 rounded-full bg-gradient-to-br from-violet-200/30 to-purple-200/30 blur-3xl" />
          <div className="absolute -left-40 top-40 size-96 rounded-full bg-gradient-to-br from-violet-100/30 to-indigo-100/30 blur-3xl" />
        </div>

        <PageWrapper className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6">

          {/* Welcome */}
          <motion.div variants={item} initial="hidden" animate="show" className="mb-7">
            <p className="text-sm font-medium text-brand-600 mb-0.5">{greeting()},</p>
            <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">
              {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-ink-400 text-sm mt-1">
              {[user?.department?.split(' ')[0], user?.year ? `Year ${user.year}` : null, user?.registrationNumber]
                .filter(Boolean).join(' · ') || 'Complete your profile to get started'}
            </p>
          </motion.div>

          {/* Profile incomplete */}
          {profileIncomplete && (
            <motion.div variants={item} initial="hidden" animate="show">
              <Link to="/profile"
                className="flex items-center gap-3 bg-amber-50 border border-amber-200/70 rounded-2xl p-4 mb-6 hover:bg-amber-100 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={17} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
                  <p className="text-xs text-amber-600 mt-0.5">Add reg. number, department &amp; year to unlock matching</p>
                </div>
                <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          )}

          {/* Stat cards */}
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3 mb-7">
            {stats.map(({ label, value, icon: Icon, color, gradient }) => (
              <motion.div key={label} variants={item}
                className="card group hover:shadow-glass-lg transition-all duration-300 cursor-default">
                <div className="flex items-center gap-3">
                  <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color} overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-15 transition-opacity`} />
                    <Icon size={19} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-ink-900 leading-none">{value}</p>
                    <p className="text-[11px] text-ink-400 mt-1 font-medium">{label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Live campus map */}
          <motion.div variants={item} initial="hidden" animate="show" className="mb-6">
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-base font-bold text-ink-800 flex items-center gap-2">
                  <MapPin size={16} className="text-violet-500" /> Campus Map
                  <span className="text-xs font-normal text-ink-400 ml-1">
                    — {data?.nearbyOffers?.length || 0} live ride{data?.nearbyOffers?.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <Link to="/rides" className="text-xs text-brand-600 font-semibold hover:text-brand-800 transition-colors">
                  View all →
                </Link>
              </div>
              <MapView
                rides={data?.nearbyOffers || []}
                height={280}
                onRideClick={(ride) => window.location.href = `/rides?highlight=${ride._id}`}
              />
            </div>
          </motion.div>

          {/* Smart suggestions */}
          {suggestions.length > 0 && (
            <motion.div variants={item} initial="hidden" animate="show" className="mb-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Zap size={14} className="text-violet-600" />
                  </div>
                  <h2 className="text-base font-bold text-ink-800">Suggested for you</h2>
                  <span className="badge-violet ml-auto">AI</span>
                </div>
                <div className="space-y-2.5">
                  {suggestions.map((ride) => (
                    <Link
                      key={ride._id}
                      to={`/rides?highlight=${ride._id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-ink-50/60 hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all group"
                    >
                      <Avatar user={ride.creator} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-semibold text-ink-800 truncate">{ride.creator?.name}</p>
                          {ride.creator?.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                              <Star size={8} fill="currentColor" strokeWidth={0} />{ride.creator.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 truncate flex items-center gap-1">
                          <Navigation size={9} className="flex-shrink-0" />
                          {ride.pickup?.address} → {ride.destination?.address}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-ink-300">{formatDistanceToNow(new Date(ride.departureTime), { addSuffix: true })}</span>
                          {ride.farePerPerson > 0 && <span className="badge-green text-[10px]">₹{ride.farePerPerson}/person</span>}
                          {ride.isRecurring && <span className="text-[10px] text-violet-500 font-medium flex items-center gap-0.5"><Repeat size={8} />Recurring</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ride.availableSeats && <span className="badge-green text-[10px]">{ride.availableSeats} seats</span>}
                        <ChevronRight size={13} className="text-ink-200 group-hover:text-ink-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Two-column: my rides + available */}
          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            {/* My active rides */}
            <motion.div variants={item} initial="hidden" animate="show" className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-ink-800">My Active Rides</h2>
                <Link to="/rides?tab=mine" className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              {!data?.myRides?.length ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-ink-50 flex items-center justify-center mx-auto mb-3">
                    <Car size={22} className="text-ink-300" />
                  </div>
                  <p className="text-ink-500 font-medium text-sm">No active rides</p>
                  <Link to="/rides" className="btn-primary mt-3 text-sm inline-flex items-center gap-1.5">
                    <Plus size={13} /> Post a ride
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.myRides.map((ride) => (
                    <div key={ride._id} className="p-3.5 rounded-2xl bg-ink-50/50 hover:bg-ink-50 transition-colors border border-ink-100/50">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className={ride.type === 'offer' ? 'badge-brand' : 'badge-yellow'}>
                          {ride.type === 'offer' ? '🚗 Offering' : '🙋 Requesting'}
                        </span>
                        <StatusBadge status={ride.status} />
                        {ride.isRecurring && <span className="badge-violet text-[10px] flex items-center gap-0.5"><Repeat size={9} />Recurring</span>}
                      </div>
                      <p className="text-sm text-ink-700 font-medium truncate mb-1">
                        {ride.pickup?.address} → {ride.destination?.address}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-ink-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {format(new Date(ride.departureTime), 'EEE, MMM d · h:mm a')}
                        </p>
                        {ride.farePerPerson > 0 && <span className="badge-green text-[10px]">₹{ride.farePerPerson}/person</span>}
                      </div>
                      <div className="mt-2">
                        <RideProgressTracker status={ride.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Available offers */}
            <motion.div variants={item} initial="hidden" animate="show" className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-ink-800">Available Offers</h2>
                <Link to="/rides?type=offer" className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
                  Browse <ChevronRight size={14} />
                </Link>
              </div>
              {!data?.nearbyOffers?.length ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-ink-50 flex items-center justify-center mx-auto mb-3">
                    <Users size={22} className="text-ink-300" />
                  </div>
                  <p className="text-ink-500 font-medium text-sm">No offers right now</p>
                  <p className="text-ink-300 text-xs mt-0.5">Check back soon or post a request</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.nearbyOffers.slice(0, 4).map((ride) => (
                    <Link key={ride._id} to={`/rides?highlight=${ride._id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-ink-50/50 hover:bg-ink-50 border border-ink-100/50 transition-all group">
                      <Avatar user={ride.creator} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-semibold text-ink-800 truncate">{ride.creator?.name}</p>
                          {ride.creator?.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                              <Star size={8} fill="currentColor" strokeWidth={0} />{ride.creator.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 truncate flex items-center gap-1">
                          <MapPin size={9} className="flex-shrink-0" />{ride.pickup?.address}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-ink-300">{formatDistanceToNow(new Date(ride.departureTime), { addSuffix: true })}</span>
                          {ride.farePerPerson > 0 && <span className="badge-green text-[10px]">₹{ride.farePerPerson}/person</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="badge-green text-[10px]">{ride.availableSeats} seats</span>
                        <ChevronRight size={13} className="text-ink-200 group-hover:text-ink-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick actions */}
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-brand-500" />
              <h3 className="text-sm font-bold text-ink-800">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/rides', label: 'Post a Ride', icon: Plus, color: 'bg-brand-50 text-brand-600 hover:bg-brand-100' },
                { to: '/rides?type=offer', label: 'Find Offers', icon: Car, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
                { to: '/rides?type=request', label: 'Find Requests', icon: Users, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
                { to: '/profile', label: 'Edit Profile', icon: Star, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              ].map(({ to, label, icon: Icon, color }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors ${color}`}>
                  <Icon size={15} /> {label}
                </Link>
              ))}
            </div>
          </motion.div>

        </PageWrapper>
      </div>
    </div>
  );
}
