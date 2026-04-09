import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Users, Clock, ChevronRight, Plus, AlertCircle, MapPin, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StatusBadge = ({ status }) => {
  const map = {
    active: 'badge-green',
    full: 'badge-yellow',
    in_progress: 'badge-primary',
    completed: 'badge-gray',
    cancelled: 'badge-red',
  };
  return <span className={map[status] || 'badge-gray'}>{status?.replace('_', ' ')}</span>;
};

const TypeBadge = ({ type }) => (
  <span className={type === 'offer' ? 'badge-primary' : 'badge-yellow'}>
    {type === 'offer' ? 'Offering' : 'Requesting'}
  </span>
);

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

  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  const profileIncomplete = !user?.isProfileComplete;

  return (
    <div className="page-container animate-fade-in">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-primary-600">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {user?.department} · Year {user?.year} · {user?.registrationNumber || 'Profile incomplete'}
        </p>
      </div>

      {/* Profile incomplete banner */}
      {profileIncomplete && (
        <Link to="/profile" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 hover:bg-amber-100 transition-colors group">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
            <p className="text-xs text-amber-600 mt-0.5">Add your reg. number, department, and year to unlock all features</p>
          </div>
          <ChevronRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'My Rides', value: data?.stats?.totalRides ?? 0, icon: Car, color: 'bg-primary-50 text-primary-600' },
          { label: 'Active Rides', value: data?.stats?.activeRides ?? 0, icon: Clock, color: 'bg-green-50 text-green-600' },
          { label: 'Nearby Offers', value: data?.nearbyOffers?.length ?? 0, icon: Users, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Active Rides */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Active Rides</h2>
            <Link to="/rides" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {data?.myRides?.length === 0 ? (
            <div className="text-center py-8">
              <Car size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No active rides</p>
              <Link to="/rides" className="btn-primary mt-3 text-sm">
                <Plus size={14} /> Post a ride
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.myRides.map((ride) => (
                <div key={ride._id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Car size={15} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeBadge type={ride.type} />
                      <StatusBadge status={ride.status} />
                    </div>
                    <p className="text-sm text-slate-700 mt-1 font-medium truncate">{ride.pickup?.address} → {ride.destination?.address}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} />
                      {format(new Date(ride.departureTime), 'EEE, MMM d · h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Offers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Available Offers</h2>
            <Link to="/rides?type=offer" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Browse <ChevronRight size={14} />
            </Link>
          </div>

          {data?.nearbyOffers?.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No offers available right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.nearbyOffers.map((ride) => (
                <Link to={`/rides?highlight=${ride._id}`} key={ride._id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors group">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {ride.creator?.avatar
                      ? <img src={ride.creator.avatar} alt="" className="w-full h-full object-cover" />
                      : ride.creator?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 truncate">{ride.creator?.name}</p>
                      <span className="badge-green ml-2 flex-shrink-0">{ride.availableSeats} seats</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />{ride.pickup?.address}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDistanceToNow(new Date(ride.departureTime), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 mt-1 flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
