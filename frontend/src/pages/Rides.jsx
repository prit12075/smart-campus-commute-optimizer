import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Car, MapPin, Calendar, Users, Loader2, X,
  Clock, Star, Zap, Filter, RefreshCw, ChevronDown,
  Navigation, Repeat, Info,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/LoadingScreen';
import PageWrapper from '../components/common/PageWrapper';
import MapView from '../components/common/MapView';
import RideProgressTracker from '../components/common/RideProgressTracker';
import ReviewModal from '../components/common/ReviewModal';
import StarRating from '../components/common/StarRating';

const VEHICLE_ICONS = { bike: '🏍️', car: '🚗', auto: '🛺', bus: '🚌' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── Avatar helper ─────────────────────────────────────────────────────────── */
const Avatar = ({ user, size = 9 }) => {
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const cls = `w-${size} h-${size} rounded-full overflow-hidden bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0`;
  return (
    <div className={cls}>
      {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
};

/* ── Smart matches banner ──────────────────────────────────────────────────── */
function MatchBanner({ ride, currentUserId, onJoin }) {
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ride || ride.creator?._id !== currentUserId) return;
    api.get(`/rides/${ride._id}/matches`)
      .then(({ data }) => setMatches(data.matches || []))
      .catch(() => {});
  }, [ride, currentUserId]);

  if (!matches.length || ride.creator?._id !== currentUserId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 rounded-2xl bg-violet-50 border border-violet-100 overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-violet-700"
      >
        <Zap size={12} className="text-violet-500" />
        {matches.length} smart match{matches.length > 1 ? 'es' : ''} found
        <ChevronDown size={12} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {matches.slice(0, 3).map(({ ride: m, score, pickupDistanceKm }) => (
                <div key={m._id} className="flex items-center gap-2 bg-white rounded-xl p-2 border border-violet-100">
                  <Avatar user={m.creator} size={7} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink-800 truncate">{m.creator?.name}</p>
                    <p className="text-[10px] text-ink-400">{pickupDistanceKm} km away · {Math.round(score * 100)}% match</p>
                  </div>
                  <button
                    onClick={() => onJoin(m._id)}
                    className="text-[10px] font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Ride card ─────────────────────────────────────────────────────────────── */
function RideCard({ ride, currentUserId, onJoin, onCancel, onStatusChange, onReview, index }) {
  const isOwner = ride.creator?._id === currentUserId || ride.creator === currentUserId;
  const myPassenger = ride.passengers?.find((p) => p.user?._id === currentUserId || p.user === currentUserId);
  const acceptedCount = ride.passengers?.filter((p) => p.status === 'accepted').length || 0;
  const [showMap, setShowMap] = useState(false);

  const statusColor = {
    active: 'badge-green', full: 'badge-yellow',
    cancelled: 'badge-red', completed: 'badge-gray', in_progress: 'badge-brand',
  };

  const canReview = !isOwner && myPassenger?.status === 'accepted' && ride.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="card flex flex-col hover:shadow-glass-lg transition-all duration-300"
    >
      {/* Creator */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar user={ride.creator} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-ink-800 leading-none">{ride.creator?.name}</p>
              {ride.creator?.rating > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                  <Star size={9} fill="currentColor" strokeWidth={0} />
                  {ride.creator.rating.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-400 mt-0.5">
              {[ride.creator?.department?.split(' ')[0], ride.creator?.year ? `Y${ride.creator.year}` : null]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={ride.type === 'offer' ? 'badge-brand' : 'badge-yellow'}>
            {ride.type === 'offer' ? '🚗 Offering' : '🙋 Requesting'}
          </span>
          <span className={statusColor[ride.status] || 'badge-gray'}>{ride.status?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Route */}
      <div className="bg-ink-50/60 rounded-2xl p-3 mb-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-ink-700">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="truncate font-medium">{ride.pickup?.address}</span>
        </div>
        <div className="ml-[3px] w-px h-3 bg-ink-200" />
        <div className="flex items-center gap-2 text-sm text-ink-700">
          <MapPin size={8} className="text-red-500 flex-shrink-0" />
          <span className="truncate font-medium">{ride.destination?.address}</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400 mb-3">
        <span className="flex items-center gap-1">
          <Calendar size={11} />{format(new Date(ride.departureTime), 'MMM d, h:mm a')}
        </span>
        {ride.type === 'offer' && (
          <span className="flex items-center gap-1">
            <Users size={11} />{acceptedCount}/{ride.totalSeats} riders
          </span>
        )}
        {ride.vehicleType && <span>{VEHICLE_ICONS[ride.vehicleType]} {ride.vehicleType}</span>}
        {ride.vehicleNumber && <span className="badge-gray">{ride.vehicleNumber}</span>}
        {ride.farePerPerson > 0 && (
          <span className="badge-green">₹{ride.farePerPerson}/person</span>
        )}
        {ride.distanceKm > 0 && (
          <span className="flex items-center gap-0.5 text-ink-300">
            <Navigation size={9} />{ride.distanceKm} km
          </span>
        )}
        {ride.isRecurring && (
          <span className="flex items-center gap-0.5 text-violet-500 font-medium">
            <Repeat size={10} />Recurring
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-ink-300">
          <Clock size={10} />
          {formatDistanceToNow(new Date(ride.departureTime), { addSuffix: true })}
        </span>
      </div>

      {/* Progress tracker */}
      <div className="mb-3">
        <RideProgressTracker status={ride.status} />
      </div>

      {ride.notes && (
        <p className="text-xs text-ink-400 italic mb-3 bg-ink-50 rounded-xl px-3 py-2 border border-ink-100">
          "{ride.notes}"
        </p>
      )}

      {/* Mini map toggle */}
      {ride.pickup?.lat && ride.destination?.lat && (
        <button
          onClick={() => setShowMap((s) => !s)}
          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium mb-3 transition-colors"
        >
          <MapPin size={11} /> {showMap ? 'Hide map' : 'Show route map'}
        </button>
      )}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 180, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 overflow-hidden rounded-2xl"
          >
            <MapView
              pickup={ride.pickup}
              destination={ride.destination}
              height={180}
              interactive={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart matches (owner only) */}
      <MatchBanner ride={ride} currentUserId={currentUserId} onJoin={onJoin} />

      {/* Action */}
      <div className="mt-auto pt-3 border-t border-ink-100">
        {isOwner ? (
          <div className="space-y-2">
            {/* Status lifecycle buttons */}
            <div className="flex gap-2">
              {ride.status === 'active' && (
                <button
                  onClick={() => onStatusChange(ride._id, 'in_progress')}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  🚗 Start Ride
                </button>
              )}
              {ride.status === 'in_progress' && (
                <button
                  onClick={() => onStatusChange(ride._id, 'completed')}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                >
                  ✅ Complete Ride
                </button>
              )}
              {['active', 'full', 'in_progress'].includes(ride.status) && (
                <button
                  onClick={() => onCancel(ride._id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            {/* Passenger management */}
            {ride.passengers?.filter((p) => p.status === 'pending').length > 0 && (
              <p className="text-center text-xs text-amber-600 font-medium bg-amber-50 rounded-xl py-1.5">
                {ride.passengers.filter((p) => p.status === 'pending').length} pending request(s) — manage in My Rides
              </p>
            )}
          </div>
        ) : myPassenger ? (
          <div className="space-y-2">
            <div className={`w-full text-center text-xs font-semibold py-2.5 rounded-xl ${
              myPassenger.status === 'accepted' ? 'bg-green-50 text-green-700' :
              myPassenger.status === 'rejected' ? 'bg-red-50 text-red-600' :
              'bg-amber-50 text-amber-700'
            }`}>
              {myPassenger.status === 'accepted' ? '✓ Accepted for this ride' :
               myPassenger.status === 'rejected' ? '✗ Request not accepted' :
               '⏳ Pending — waiting for driver'}
            </div>
            {canReview && (
              <button
                onClick={() => onReview(ride)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Star size={12} /> Rate this ride
              </button>
            )}
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={() => onJoin(ride._id)}
            disabled={ride.status !== 'active' || (ride.type === 'offer' && ride.availableSeats < 1)}
            className="btn-primary w-full text-sm"
          >
            {ride.type === 'offer' ? 'Request a seat' : 'Offer to ride together'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Create ride modal ─────────────────────────────────────────────────────── */
function CreateRideModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    type: 'offer',
    pickupAddress: '', pickupLat: 16.4420, pickupLng: 80.6220,
    destAddress: '', destLat: 16.4500, destLng: 80.6300,
    departureTime: '',
    totalSeats: 2,
    vehicleType: '', vehicleNumber: '',
    notes: '',
    isRecurring: false,
    recurringDays: [],
  });
  const [farePreview, setFarePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Live fare preview
  useEffect(() => {
    if (!form.pickupLat || !form.destLat) return;
    const { haversineDistance } = { haversineDistance: (a, b, c, d) => {
      const R = 6371;
      const dLat = (c - a) * Math.PI / 180;
      const dLng = (d - b) * Math.PI / 180;
      const x = Math.sin(dLat/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    }};
    const RATES = { bike: { base: 10, perKm: 5 }, auto: { base: 15, perKm: 8 }, car: { base: 20, perKm: 12 }, bus: { base: 10, perKm: 3 } };
    const dist = haversineDistance(form.pickupLat, form.pickupLng, form.destLat, form.destLng);
    const vt = form.vehicleType || 'auto';
    const rates = RATES[vt] || RATES.auto;
    const total = Math.round(rates.base + rates.perKm * dist);
    const seats = Math.max(1, parseInt(form.totalSeats) || 1);
    setFarePreview({ dist: dist.toFixed(1), total, perPerson: Math.round(total / seats) });
  }, [form.pickupLat, form.pickupLng, form.destLat, form.destLng, form.vehicleType, form.totalSeats]);

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
        isRecurring: form.isRecurring,
        recurringDays: form.recurringDays,
      });
      toast.success('Ride posted! 🎉');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    set('recurringDays', form.recurringDays.includes(day)
      ? form.recurringDays.filter((d) => d !== day)
      : [...form.recurringDays, day]);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-glass-lg max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Post a Ride</h2>
              <p className="text-xs text-ink-400 mt-0.5">SRM AP Campus • Smart fare calculator included</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors flex items-center justify-center">
              <X size={16} className="text-ink-500" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type toggle */}
              <div className="p-1 bg-ink-50 rounded-2xl grid grid-cols-2 gap-1">
                {[{ val: 'offer', label: '🚗 Offering a ride' }, { val: 'request', label: '🙋 Requesting a ride' }].map(({ val, label }) => (
                  <button key={val} type="button" onClick={() => set('type', val)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      form.type === val ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-400 hover:text-ink-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Locations */}
              <div>
                <label className="label">Pickup Location *</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" />
                  <input className="input pl-8 h-11" placeholder="e.g., SRM AP Gate 1, Amaravati"
                    value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Destination *</label>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                  <input className="input pl-8 h-11" placeholder="e.g., Vijayawada Bus Stand"
                    value={form.destAddress} onChange={(e) => set('destAddress', e.target.value)} required />
                </div>
              </div>

              {/* Map for location picking */}
              <div>
                <label className="label">
                  Pick on map <span className="text-ink-300 normal-case font-normal">(click → pickup, then destination)</span>
                </label>
                <MapView
                  pickup={form.pickupAddress ? { lat: form.pickupLat, lng: form.pickupLng, address: form.pickupAddress } : null}
                  destination={form.destAddress ? { lat: form.destLat, lng: form.destLng, address: form.destAddress } : null}
                  height={180}
                  onMapClick={(latlng) => {
                    if (!form.pickupAddress) {
                      set('pickupLat', latlng.lat); set('pickupLng', latlng.lng);
                    } else if (!form.destAddress) {
                      set('destLat', latlng.lat); set('destLng', latlng.lng);
                    }
                  }}
                />
              </div>

              {/* Time + Seats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Departure Time *</label>
                  <input type="datetime-local" className="input h-11"
                    value={form.departureTime} onChange={(e) => set('departureTime', e.target.value)}
                    required min={new Date().toISOString().slice(0, 16)} />
                </div>
                {form.type === 'offer' && (
                  <div>
                    <label className="label">Seats</label>
                    <select className="input h-11" value={form.totalSeats} onChange={(e) => set('totalSeats', e.target.value)}>
                      {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} seat{n>1?'s':''}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Vehicle */}
              {form.type === 'offer' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Vehicle Type</label>
                    <select className="input h-11" value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value)}>
                      <option value="">None / Not specified</option>
                      {['bike','car','auto','bus'].map((v) => (
                        <option key={v} value={v}>{VEHICLE_ICONS[v]} {v.charAt(0).toUpperCase()+v.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Vehicle Number</label>
                    <input className="input h-11 uppercase" placeholder="AP 09 AB 1234"
                      value={form.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())} />
                  </div>
                </div>
              )}

              {/* Fare preview */}
              {farePreview && form.type === 'offer' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 border border-green-100"
                >
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Info size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-green-800">{farePreview.dist} km route</p>
                    <p className="text-green-600">
                      Estimated ₹{farePreview.total} total · <span className="font-semibold">₹{farePreview.perPerson}/person</span>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Recurring */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer mb-2">
                  <input type="checkbox" className="w-4 h-4 accent-brand-600"
                    checked={form.isRecurring} onChange={(e) => set('isRecurring', e.target.checked)} />
                  <span className="text-sm font-semibold text-ink-700 flex items-center gap-1.5">
                    <Repeat size={14} className="text-violet-500" /> Recurring ride
                  </span>
                </label>
                <AnimatePresence>
                  {form.isRecurring && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS.map((day) => (
                          <button key={day} type="button" onClick={() => toggleDay(day)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                              form.recurringDays.includes(day)
                                ? 'bg-brand-600 text-white shadow-brand'
                                : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes <span className="text-ink-300 normal-case font-normal">(optional)</span></label>
                <textarea className="input resize-none text-sm" rows={2}
                  placeholder="Any details for co-riders…" value={form.notes}
                  onChange={(e) => set('notes', e.target.value)} maxLength={300} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 h-11">Cancel</button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  type="submit" disabled={loading} className="btn-primary flex-1 h-11">
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

/* ── My Rides: passenger management panel ──────────────────────────────────── */
function PassengerPanel({ ride, onRespond }) {
  const pending = ride.passengers?.filter((p) => p.status === 'pending') || [];
  if (!pending.length) return null;

  return (
    <div className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
      <p className="text-xs font-bold text-amber-800">Pending requests ({pending.length})</p>
      {pending.map((p) => (
        <div key={p.user?._id || p._id} className="flex items-center gap-2">
          <Avatar user={p.user} size={7} />
          <p className="text-xs text-ink-700 flex-1 truncate font-medium">{p.user?.name}</p>
          <button onClick={() => onRespond(ride._id, p.user?._id, 'accepted')}
            className="text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors">
            Accept
          </button>
          <button onClick={() => onRespond(ride._id, p.user?._id, 'rejected')}
            className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">
            Decline
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function Rides() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'mine'
  const [reviewTarget, setReviewTarget] = useState(null); // { ride, revieweeId, name }
  const [showMapView, setShowMapView] = useState(false);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint;
      if (tab === 'mine') {
        endpoint = '/rides/my';
      } else {
        const params = new URLSearchParams();
        if (typeFilter) params.set('type', typeFilter);
        params.set('status', 'active');
        endpoint = `/rides?${params.toString()}`;
      }
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
      toast.error(err.response?.data?.message || 'Failed to join');
    }
  };

  const handleCancel = async (rideId) => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await api.delete(`/rides/${rideId}`);
      toast.success('Ride cancelled');
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleStatusChange = async (rideId, status) => {
    try {
      await api.put(`/rides/${rideId}/status`, { status });
      toast.success(status === 'in_progress' ? '🚗 Ride started!' : '✅ Ride completed!');
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRespond = async (rideId, userId, status) => {
    try {
      await api.put(`/rides/${rideId}/passengers/${userId}`, { status });
      toast.success(status === 'accepted' ? 'Passenger accepted!' : 'Request declined');
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleReview = (ride) => {
    setReviewTarget({
      ride,
      revieweeId: ride.creator?._id,
      name: ride.creator?.name,
    });
  };

  // All active rides for map
  const mapRides = rides.filter((r) => r.pickup?.lat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50 pb-20">
      <div className="relative overflow-hidden pt-24">
        {/* BG blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-40 -top-40 size-96 rounded-full bg-gradient-to-br from-violet-200/30 to-purple-200/30 blur-3xl" />
          <div className="absolute -left-40 top-40 size-96 rounded-full bg-gradient-to-br from-violet-100/30 to-indigo-100/30 blur-3xl" />
        </div>

        <PageWrapper className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Rides</h1>
              <p className="text-ink-400 text-sm mt-1">Find or post ride-sharing opportunities</p>
            </div>
            <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> Post Ride
            </motion.button>
          </div>

          {/* Filters + map toggle */}
          <div className="flex items-center gap-2.5 mb-5 flex-wrap">
            <div className="flex p-1 bg-ink-100/60 rounded-2xl gap-1">
              {[['all','All Rides'],['mine','My Rides']].map(([val, label]) => (
                <button key={val} onClick={() => setTab(val)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    tab === val ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'all' && (
              <div className="flex p-1 bg-ink-100/60 rounded-2xl gap-1">
                {[['','All'],['offer','Offers'],['request','Requests']].map(([val, label]) => (
                  <button key={val} onClick={() => setTypeFilter(val)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      typeFilter === val ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowMapView((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all border ${
                showMapView
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-brand-300'
              }`}
            >
              <MapPin size={14} /> {showMapView ? 'Hide Map' : 'Map View'}
            </button>

            <button onClick={fetchRides} className="btn-ghost p-2 ml-auto" title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {!loading && (
              <p className="text-xs text-ink-300 font-medium">{rides.length} ride{rides.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Map overview */}
          <AnimatePresence>
            {showMapView && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 320, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-5 rounded-3xl"
              >
                <MapView rides={mapRides} height={320} onRideClick={(r) => {
                  const el = document.getElementById(`ride-${r._id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          {loading ? (
            <PageLoader />
          ) : rides.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-ink-50 flex items-center justify-center mx-auto mb-4">
                <Car size={30} className="text-ink-300" />
              </div>
              <p className="text-ink-700 font-bold text-lg">No rides found</p>
              <p className="text-ink-400 text-sm mt-1">
                {tab === 'mine' ? 'You haven\'t posted any rides yet.' : 'Be the first to post a ride!'}
              </p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreate(true)} className="btn-primary mt-5">
                <Plus size={16} /> Post a Ride
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rides.map((ride, i) => (
                <div key={ride._id} id={`ride-${ride._id}`}>
                  <RideCard
                    ride={ride}
                    index={i}
                    currentUserId={user?._id}
                    onJoin={handleJoin}
                    onCancel={handleCancel}
                    onStatusChange={handleStatusChange}
                    onReview={handleReview}
                  />
                  {/* Passenger panel for owned rides */}
                  {(ride.creator?._id === user?._id || ride.creator === user?._id) && (
                    <PassengerPanel ride={ride} onRespond={handleRespond} />
                  )}
                </div>
              ))}
            </div>
          )}
        </PageWrapper>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateRideModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); fetchRides(); }}
          />
        )}
      </AnimatePresence>

      {reviewTarget && (
        <ReviewModal
          ride={reviewTarget.ride}
          revieweeId={reviewTarget.revieweeId}
          revieweeName={reviewTarget.name}
          onClose={() => setReviewTarget(null)}
          onDone={fetchRides}
        />
      )}
    </div>
  );
}
