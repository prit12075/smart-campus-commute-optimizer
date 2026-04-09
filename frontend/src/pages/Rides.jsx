import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Car, MapPin, Calendar, Users, Loader2, X, ChevronRight, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/LoadingScreen';
import PageWrapper from '../components/common/PageWrapper';

const VEHICLE_ICONS = { bike: '🏍️', car: '🚗', auto: '🛺', bus: '🚌' };

const Avatar = ({ user }) => {
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
};

function RideCard({ ride, currentUserId, onJoin, onCancel, index }) {
  const isOwner = ride.creator?._id === currentUserId || ride.creator === currentUserId;
  const myPassenger = ride.passengers?.find((p) => p.user?._id === currentUserId || p.user === currentUserId);
  const acceptedCount = ride.passengers?.filter((p) => p.status === 'accepted').length || 0;

  const statusColor = {
    active: 'badge-green',
    full: 'badge-yellow',
    cancelled: 'badge-red',
    completed: 'badge-gray',
    in_progress: 'badge-brand',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="card hover:shadow-glass-lg transition-all duration-300 flex flex-col"
    >
      {/* Creator row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Avatar user={ride.creator} />
          <div>
            <p className="text-sm font-semibold text-ink-800 leading-none">{ride.creator?.name}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">
              {[ride.creator?.department?.split(' ')[0], ride.creator?.year ? `Y${ride.creator.year}` : null, ride.creator?.registrationNumber].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={ride.type === 'offer' ? 'badge-brand' : 'badge-yellow'}>
            {ride.type === 'offer' ? 'Offering' : 'Requesting'}
          </span>
          <span className={statusColor[ride.status] || 'badge-gray'}>{ride.status?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Route */}
      <div className="bg-ink-50/70 rounded-2xl p-3.5 mb-3.5 space-y-2">
        <div className="flex items-center gap-2.5 text-sm text-ink-700">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="truncate">{ride.pickup?.address}</span>
        </div>
        <div className="flex items-center gap-2.5 ml-[3px]">
          <div className="w-px h-3 bg-ink-200" />
        </div>
        <div className="flex items-center gap-2.5 text-sm text-ink-700">
          <MapPin size={8} className="text-red-500 flex-shrink-0 ml-[-1px]" />
          <span className="truncate">{ride.destination?.address}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-ink-400 mb-4 flex-wrap">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {format(new Date(ride.departureTime), 'MMM d, h:mm a')}
        </span>
        {ride.type === 'offer' && (
          <span className="flex items-center gap-1">
            <Users size={11} />
            {acceptedCount}/{ride.totalSeats}
          </span>
        )}
        {ride.vehicleType && (
          <span>{VEHICLE_ICONS[ride.vehicleType]} {ride.vehicleType}</span>
        )}
        {ride.vehicleNumber && (
          <span className="badge-gray">{ride.vehicleNumber}</span>
        )}
        <span className="ml-auto text-ink-300 flex items-center gap-1">
          <Clock size={10} />
          {formatDistanceToNow(new Date(ride.departureTime), { addSuffix: true })}
        </span>
      </div>

      {ride.notes && (
        <p className="text-xs text-ink-400 italic mb-4 bg-ink-50 rounded-xl px-3 py-2 border border-ink-100">
          "{ride.notes}"
        </p>
      )}

      {/* Action */}
      <div className="mt-auto pt-3.5 border-t border-ink-100">
        {isOwner ? (
          <button
            onClick={() => onCancel(ride._id)}
            disabled={ride.status === 'cancelled'}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel ride
          </button>
        ) : myPassenger ? (
          <div className={`w-full text-center text-sm font-semibold py-2.5 rounded-xl ${
            myPassenger.status === 'accepted' ? 'bg-green-50 text-green-700' :
            myPassenger.status === 'rejected' ? 'bg-red-50 text-red-600' :
            'bg-amber-50 text-amber-700'
          }`}>
            {myPassenger.status === 'accepted' ? '✓ Accepted' :
             myPassenger.status === 'rejected' ? '✗ Not accepted' :
             '⏳ Request pending'}
          </div>
        ) : (
          <button
            onClick={() => onJoin(ride._id)}
            disabled={ride.status !== 'active' || (ride.type === 'offer' && ride.availableSeats < 1)}
            className="btn-primary w-full text-sm"
          >
            {ride.type === 'offer' ? 'Request seat' : 'Offer to ride together'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CreateRideModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    type: 'offer',
    pickupAddress: '',
    pickupLat: 16.4420, pickupLng: 80.6220,
    destAddress: '',
    destLat: 16.4420, destLng: 80.6220,
    departureTime: '',
    totalSeats: 2,
    vehicleType: '',
    vehicleNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pickupAddress || !form.destAddress || !form.departureTime) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      await api.post('/rides', {
        type: form.type,
        pickup: { address: form.pickupAddress, lat: parseFloat(form.pickupLat), lng: parseFloat(form.pickupLng) },
        destination: { address: form.destAddress, lat: parseFloat(form.destLat), lng: parseFloat(form.destLng) },
        departureTime: new Date(form.departureTime).toISOString(),
        totalSeats: parseInt(form.totalSeats),
        ...(form.vehicleType ? { vehicleType: form.vehicleType } : {}),
        ...(form.vehicleNumber ? { vehicleNumber: form.vehicleNumber } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      });
      toast.success('Ride posted! 🎉');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-glass-lg max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Post a Ride</h2>
              <p className="text-xs text-ink-400 mt-0.5">Find commute matches with SRM students</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors flex items-center justify-center">
              <X size={16} className="text-ink-500" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type toggle */}
              <div className="p-1 bg-ink-50 rounded-2xl grid grid-cols-2 gap-1">
                {[
                  { val: 'offer', label: '🚗 Offering a ride' },
                  { val: 'request', label: '🙋 Requesting a ride' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('type', val)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      form.type === val ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-400 hover:text-ink-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Pickup */}
              <div>
                <label className="label">Pickup Location *</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" />
                  <input
                    className="input pl-8 h-11"
                    placeholder="e.g., SRM AP Gate 1, Amaravati"
                    value={form.pickupAddress}
                    onChange={(e) => set('pickupAddress', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="label">Destination *</label>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                  <input
                    className="input pl-8 h-11"
                    placeholder="e.g., Vijayawada Bus Stand"
                    value={form.destAddress}
                    onChange={(e) => set('destAddress', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Time + Seats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Departure Time *</label>
                  <input
                    type="datetime-local"
                    className="input h-11"
                    value={form.departureTime}
                    onChange={(e) => set('departureTime', e.target.value)}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                {form.type === 'offer' && (
                  <div>
                    <label className="label">Seats Available</label>
                    <select className="input h-11" value={form.totalSeats} onChange={(e) => set('totalSeats', e.target.value)}>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Vehicle (offer only) */}
              {form.type === 'offer' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Vehicle Type</label>
                    <select className="input h-11" value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value)}>
                      <option value="">None / Not specified</option>
                      {['bike', 'car', 'auto', 'bus'].map((v) => (
                        <option key={v} value={v}>{VEHICLE_ICONS[v]} {v.charAt(0).toUpperCase() + v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Vehicle Number</label>
                    <input
                      className="input h-11 uppercase"
                      placeholder="AP 09 AB 1234"
                      value={form.vehicleNumber}
                      onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="label">Notes <span className="text-ink-300">(optional)</span></label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Any additional info for co-riders..."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  maxLength={300}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 h-11">Cancel</button>
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 h-11"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Post Ride'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Rides() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [tab, setTab] = useState('all');

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'mine' ? '/rides/my' : `/rides${typeFilter ? `?type=${typeFilter}` : ''}`;
      const { data } = await api.get(endpoint);
      setRides(data.rides || []);
    } catch {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const handleJoin = async (rideId) => {
    try {
      await api.post(`/rides/${rideId}/join`);
      toast.success('Join request sent! 🙋');
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join ride');
    }
  };

  const handleCancel = async (rideId) => {
    if (!window.confirm('Cancel this ride? This action cannot be undone.')) return;
    try {
      await api.delete(`/rides/${rideId}`);
      toast.success('Ride cancelled');
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <PageWrapper className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Rides</h1>
          <p className="text-ink-400 text-sm mt-1">Find or post ride-sharing opportunities</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <Plus size={16} /> Post Ride
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 mb-6 flex-wrap">
        {/* Tab toggle */}
        <div className="flex p-1 bg-ink-100/70 rounded-2xl gap-1">
          {[['all', 'All Rides'], ['mine', 'My Rides']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                tab === val ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'all' && (
          <div className="flex p-1 bg-ink-100/70 rounded-2xl gap-1">
            {[['', 'All'], ['offer', 'Offers'], ['request', 'Requests']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  typeFilter === val ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {!loading && (
          <p className="ml-auto text-xs text-ink-300 font-medium">{rides.length} ride{rides.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : rides.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-16"
        >
          <div className="w-16 h-16 rounded-3xl bg-ink-50 flex items-center justify-center mx-auto mb-4">
            <Car size={30} className="text-ink-300" />
          </div>
          <p className="text-ink-600 font-bold text-lg">No rides found</p>
          <p className="text-ink-400 text-sm mt-1">Be the first to post a ride!</p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="btn-primary mt-5"
          >
            <Plus size={16} /> Post a Ride
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rides.map((ride, i) => (
            <RideCard
              key={ride._id}
              ride={ride}
              index={i}
              currentUserId={user?._id}
              onJoin={handleJoin}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateRideModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); fetchRides(); }}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
