import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Users, Clock, ChevronRight, Plus, AlertCircle, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/LoadingScreen';
import PageWrapper from '../components/common/PageWrapper';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const StatusBadge = ({ status }) => {
  const map = {
    active: 'badge-green',
    full: 'badge-yellow',
    in_progress: 'badge-brand',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  };
  return <span className={map[status] || 'badge-gray'}>{status?.replace('_', ' ')}</span>;
};

const Avatar = ({ user, size = 8 }) => {
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/dashboard')
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const profileIncomplete = !user?.isProfileComplete;

  const stats = [
    { label: 'My Rides', value: data?.stats?.totalRides ?? 0, icon: Car, color: 'bg-brand-50 text-brand-600', bg: 'from-brand-500 to-violet-500' },
    { label: 'Active Rides', value: data?.stats?.activeRides ?? 0, icon: Clock, color: 'bg-green-50 text-green-600', bg: 'from-green-400 to-emerald-500' },
    { label: 'Nearby Offers', value: data?.nearbyOffers?.length ?? 0, icon: Users, color: 'bg-violet-50 text-violet-600', bg: 'from-violet-500 to-purple-600' },
  ];

  return (
    <PageWrapper className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
        <p className="text-sm font-medium text-brand-600 mb-1">{greeting()},</p>
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-ink-400 text-sm mt-1">
          {[user?.department, user?.year ? `Year ${user.year}` : null, user?.registrationNumber].filter(Boolean).join(' · ') || 'Complete your profile to get started'}
        </p>
      </motion.div>

      {/* Profile incomplete banner */}
      {profileIncomplete && (
        <motion.div variants={item} initial="hidden" animate="show">
          <Link
            to="/profile"
            className="flex items-center gap-3 bg-amber-50 border border-amber-200/70 rounded-2xl p-4 mb-6 hover:bg-amber-100 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={17} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
              <p className="text-xs text-amber-600 mt-0.5">Add your reg. number, department &amp; year to unlock all features</p>
            </div>
            <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} variants={item} className="card group hover:shadow-glass-lg transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color} overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <Icon size={20} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-ink-900 leading-none">{value}</p>
                <p className="text-xs text-ink-400 mt-1 font-medium">{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Active Rides */}
        <motion.div variants={item} initial="hidden" animate="show" className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-ink-800">My Active Rides</h2>
            <Link to="/rides" className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {!data?.myRides?.length ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center mx-auto mb-3">
                <Car size={26} className="text-ink-300" />
              </div>
              <p className="text-ink-500 font-medium text-sm">No active rides</p>
              <p className="text-ink-300 text-xs mt-0.5">Post a ride to get started</p>
              <Link to="/rides" className="btn-primary mt-4 text-sm inline-flex items-center gap-1.5">
                <Plus size={14} /> Post a ride
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.myRides.map((ride) => (
                <div key={ride._id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-ink-50/50 hover:bg-ink-50 transition-colors border border-ink-100/50">
                  <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-brand mt-0.5">
                    <Car size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={ride.type === 'offer' ? 'badge-brand' : 'badge-yellow'}>
                        {ride.type === 'offer' ? 'Offering' : 'Requesting'}
                      </span>
                      <StatusBadge status={ride.status} />
                    </div>
                    <p className="text-sm text-ink-700 font-medium truncate">{ride.pickup?.address} → {ride.destination?.address}</p>
                    <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} />
                      {format(new Date(ride.departureTime), 'EEE, MMM d · h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Available Offers */}
        <motion.div variants={item} initial="hidden" animate="show" className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-ink-800">Available Offers</h2>
            <Link to="/rides?type=offer" className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
              Browse <ChevronRight size={14} />
            </Link>
          </div>

          {!data?.nearbyOffers?.length ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center mx-auto mb-3">
                <Users size={26} className="text-ink-300" />
              </div>
              <p className="text-ink-500 font-medium text-sm">No offers right now</p>
              <p className="text-ink-300 text-xs mt-0.5">Check back soon or post a request</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.nearbyOffers.map((ride) => (
                <Link
                  to={`/rides?highlight=${ride._id}`}
                  key={ride._id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-ink-50/50 hover:bg-ink-50 transition-colors border border-ink-100/50 group"
                >
                  <Avatar user={ride.creator} size={9} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-ink-800 truncate">{ride.creator?.name}</p>
                      <span className="badge-green ml-2 flex-shrink-0">{ride.availableSeats} seats</span>
                    </div>
                    <p className="text-xs text-ink-500 flex items-center gap-1 truncate">
                      <MapPin size={9} className="flex-shrink-0" />{ride.pickup?.address}
                    </p>
                    <p className="text-[10px] text-ink-300 mt-0.5">
                      {formatDistanceToNow(new Date(ride.departureTime), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-ink-200 group-hover:text-ink-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div variants={item} initial="hidden" animate="show" className="mt-6 glass-card rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-brand-500" />
          <h3 className="text-sm font-bold text-ink-800">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { to: '/rides', label: 'Post a Ride', icon: Plus, color: 'bg-brand-50 text-brand-600 hover:bg-brand-100' },
            { to: '/rides?type=offer', label: 'Find Offers', icon: Car, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
            { to: '/profile', label: 'Edit Profile', icon: Users, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl font-medium text-sm transition-colors ${color}`}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>
      </motion.div>
    </PageWrapper>
  );
}
