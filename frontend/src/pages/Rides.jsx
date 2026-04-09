import { useState, useEffect } from 'react';
import { Plus, Car, MapPin, Calendar, Users, Loader2, X, ChevronRight, Zap, Filter } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const VEHICLE_ICONS = { bike: '🏍️', car: '🚗', auto: '🛺', bus: '🚌' };

function RideCard({ ride, currentUserId, onJoin, onCancel }) {
  const isOwner = ride.creator?._id === currentUserId || ride.creator === currentUserId;
  const myPassenger = ride.passengers?.find((p) => p.user?._id === currentUserId || p.user === currentUserId);
  const acceptedCount = ride.passengers?.filter((p) => p.status === 'accepted').length || 0;

  return (
    <div className="card hover:shadow-card-hover transition-shadow animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {ride.creator?.avatar
              ? <img src={ride.creator.avatar} alt="" className="w-full h-full object-cover" />
              : ride.creator?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{ride.creator?.name}</p>
            <p className="text-xs text-slate-400">{ride.creator?.department} · Y{ride.creator?.year} · {ride.creator?.registrationNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={ride.type === 'offer' ? 'badge-primary' : 'badge-yellow'}>
            {ride.type === 'offer' ? 'Offering' : 'Requesting'}
          </span>
          <span className={
            ride.status === 'active' ? 'badge-green' :
            ride.status === 'full' ? 'badge-yellow' :
            ride.status === 'cancelled' ? 'badge-red' : 'badge-gray'
          }>{ride.status}</span>
        </div>
      </div>

      {/* Route */}
      <div className="bg-surface-50 rounded-xl p-3 mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="truncate">{ride.pickup?.address}</span>
        </div>
        <div className="w-px h-3 bg-surface-300 ml-[3px]" />
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin size={8} className="text-red-500 flex-shrink-0" />
          <span className="truncate">{ride.destination?.address}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {format(new Date(ride.departureTime), 'MMM d, h:mm a')}
        </span>
        {ride.type === 'offer' && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            {acceptedCount}/{ride.totalSeats} passengers
          </span>
        )}
        {ride.vehicleType && (
          <span>{VEHICLE_ICONS[ride.vehicleType]} {ride.vehicleType}</span>
        )}
        {ride.vehicleNumber && (
          <span className="badge-gray">{ride.vehicleNumber}</span>
        )}
      </div>

      {ride.notes && (
        <p className="text-xs text-slate-500 italic mb-4 bg-surface-50 rounded-lg px-3 py-2">"{ride.notes}"</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-surface-100">
        {isOwner ? (
          <button
            onClick={() => onCancel(ride._id)}
            disabled={ride.status === 'cancelled'}
            className="btn-danger text-xs flex-1"
          >
            Cancel ride
          </button>
        ) : myPassenger ? (
          <div className={`flex-1 text-center text-sm font-medium py-2 rounded-xl ${
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
            className="btn-primary text-xs flex-1"
          >
            {ride.type === 'offer' ? 'Request seat' : 'Offer ride'}
          </button>
        )}
      </div>
    </div>
  );
}

function CreateRideModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    type: 'offer',
    pickupAddress: '',
    pickupLat: 16.4420, pickupLng: 80.6220, // SRM AP default
    destAddress: '',
    destLat: 16.4420, destLng: 80.6220,
    departureTime: '',
    totalSeats: 2,
    vehicleType: '',
    vehicleNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

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
        vehicleType: form.vehicleType || undefined,
        vehicleNumber: form.vehicleNumber || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Ride posted!');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-surface-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Post a Ride</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-50 rounded-xl">
            {['offer', 'request'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  form.type === t ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t === 'offer' ? '🚗 Offering a ride' : '🙋 Requesting a ride'}
              </button>
            ))}
          </div>

          {/* Locations */}
          <div>
            <label className="label">Pickup Location *</label>
            <input className="input" placeholder="e.g., SRM AP Gate 1, Amaravati" value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} required />
          </div>
          <div>
            <label className="label">Destination *</label>
            <input className="input" placeholder="e.g., Vijayawada Bus Stand" value={form.destAddress} onChange={(e) => set('destAddress', e.target.value)} required />
          </div>

          {/* Time + Seats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Departure Time *</label>
              <input type="datetime-local" className="input" value={form.departureTime} onChange={(e) => set('departureTime', e.target.value)} required min={new Date().toISOString().slice(0, 16)} />
            </div>
            {form.type === 'offer' && (
              <div>
                <label className="label">Seats Available</label>
                <select className="input" value={form.totalSeats} onChange={(e) => set('totalSeats', e.target.value)}>
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            )}
          </div>

          {form.type === 'offer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Vehicle Type</label>
                <select className="input" value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value)}>
                  <option value="">Select</option>
                  {['bike','car','auto','bus'].map((v) => <option key={v} value={v}>{VEHICLE_ICONS[v]} {v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Vehicle Number</label>
                <input className="input uppercase" placeholder="AP 09 AB 1234" value={form.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())} />
              </div>
            </div>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input resize-none" rows={2} placeholder="Any additional info..." value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={300} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Post Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Rides() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'mine'

  const fetchRides = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'mine' ? '/rides/my' : `/rides${typeFilter ? `?type=${typeFilter}` : ''}`;
      const { data } = await api.get(endpoint);
      setRides(data.rides || []);
    } catch (_) {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRides(); }, [tab, typeFilter]); // eslint-disable-line

  const handleJoin = async (rideId) => {
    try {
      await api.post(`/rides/${rideId}/join`);
      toast.success('Join request sent!');
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join ride');
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

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rides</h1>
          <p className="text-sm text-slate-500 mt-0.5">Find or post ride-sharing opportunities</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Post Ride
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex rounded-xl border border-surface-200 overflow-hidden bg-white">
          {[['all', 'All Rides'], ['mine', 'My Rides']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === val ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-surface-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'all' && (
          <div className="flex rounded-xl border border-surface-200 overflow-hidden bg-white">
            {[['', 'All'], ['offer', 'Offers'], ['request', 'Requests']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${typeFilter === val ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-surface-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : rides.length === 0 ? (
        <div className="text-center py-16 card">
          <Car size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No rides found</p>
          <p className="text-sm text-slate-400 mt-1">Be the first to post a ride!</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
            <Plus size={16} /> Post a Ride
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rides.map((ride) => (
            <RideCard
              key={ride._id}
              ride={ride}
              currentUserId={user?._id}
              onJoin={handleJoin}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRideModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchRides(); }}
        />
      )}
    </div>
  );
}
