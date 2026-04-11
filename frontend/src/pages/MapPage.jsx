import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Search, X, MapPin, Crosshair, Clock, ChevronRight, Loader2, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PageWrapper from '../components/common/PageWrapper';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const originIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destIcon = new L.DivIcon({
  html: `<div style="width:22px;height:28px;position:relative">
    <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#7c3aed"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [22, 28],
  iconAnchor: [11, 28],
});

const userIcon = new L.DivIcon({
  html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.25)"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Move map to location
function FlyTo({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom || 15, { duration: 1.2 });
  }, [position, zoom, map]);
  return null;
}

// Nominatim geocode search
async function geocodeSearch(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=80.4,16.2,80.8,16.7&bounded=0`,
    { headers: { 'Accept-Language': 'en' } }
  );
  return res.json();
}

// Reverse geocode
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Search suggestions dropdown
function LocationInput({ label, icon: Icon, color, value, onSelect, placeholder }) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setQuery(value?.address || '');
  }, [value?.address]);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timer.current);
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await geocodeSearch(q);
        setResults(data);
        setOpen(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 400);
  };

  const handleSelect = (r) => {
    const loc = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name.split(',').slice(0, 3).join(', ') };
    setQuery(loc.address);
    setResults([]);
    setOpen(false);
    onSelect(loc);
  };

  const clear = () => { setQuery(''); onSelect(null); setResults([]); setOpen(false); };

  return (
    <div className="relative flex-1 min-w-0">
      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-slate-200 shadow-sm">
        <Icon size={16} style={{ color, flexShrink: 0 }} />
        <input
          className="flex-1 text-sm text-slate-800 outline-none placeholder-slate-400 bg-transparent min-w-0"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length && setOpen(true)}
        />
        {loading && <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />}
        {query && !loading && <button onClick={clear}><X size={14} className="text-slate-400 hover:text-slate-600" /></button>}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute z-[9999] top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
          >
            {results.map((r) => (
              <button
                key={r.place_id}
                onClick={() => handleSelect(r)}
                className="w-full flex items-start gap-2 px-3 py-2 hover:bg-violet-50 text-left transition-colors border-b border-slate-50 last:border-0"
              >
                <MapPin size={13} className="text-violet-400 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-700 leading-snug line-clamp-2">
                  {r.display_name}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const RECENT = [
  { label: 'SRM AP Campus Gate', lat: 16.4420, lng: 80.6220 },
  { label: 'Vijayawada Bus Stand', lat: 16.5193, lng: 80.6305 },
  { label: 'Guntur Railway Station', lat: 16.3007, lng: 80.4533 },
];

export default function MapPage() {
  const [userPos, setUserPos] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const watchRef = useRef(null);

  // Start live GPS tracking on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        setUserPos({ lat, lng });
        setAccuracy(acc);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocating(false);
        const address = await reverseGeocode(lat, lng).catch(() => 'My Location');
        const loc = { lat, lng, address };
        setUserPos({ lat, lng });
        setOrigin(loc);
        setFlyTarget([lat, lng]);
        toast.success('Location found!');
      },
      () => { setLocating(false); toast.error('Could not get location. Enable GPS.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Set origin from recent
  const pickRecent = (r) => {
    const loc = { lat: r.lat, lng: r.lng, address: r.label };
    setDest(loc);
    setFlyTarget([r.lat, r.lng]);
  };

  const routeLine = origin && dest ? [[origin.lat, origin.lng], [dest.lat, dest.lng]] : null;

  // Distance calculation
  const distKm = routeLine
    ? (L.latLng(origin.lat, origin.lng).distanceTo(L.latLng(dest.lat, dest.lng)) / 1000).toFixed(1)
    : null;

  const defaultCenter = userPos ? [userPos.lat, userPos.lng] : [16.4420, 80.6220];

  return (
    <PageWrapper>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-100">

        {/* Top search bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 space-y-2 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-800 shrink-0">Campus Map</h1>
            <div className="flex-1 flex items-center gap-2">
              {/* vertical line connector */}
              <div className="flex flex-col items-center gap-0.5 shrink-0 pl-2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white" />
                <div className="w-px h-4 bg-slate-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <LocationInput
                  label="Origin"
                  icon={Navigation}
                  color="#10b981"
                  value={origin}
                  onSelect={(loc) => { setOrigin(loc); if (loc) setFlyTarget([loc.lat, loc.lng]); }}
                  placeholder="From: your location"
                />
                <LocationInput
                  label="Destination"
                  icon={MapPin}
                  color="#7c3aed"
                  value={dest}
                  onSelect={(loc) => { setDest(loc); if (loc) setFlyTarget([loc.lat, loc.lng]); }}
                  placeholder="To: destination"
                />
              </div>
            </div>
          </div>

          {/* Distance chip */}
          {distKm && (
            <div className="flex items-center gap-2 ml-10">
              <span className="text-[11px] bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-3 py-0.5 font-semibold">
                ~{distKm} km route
              </span>
              <button
                onClick={() => { setOrigin(null); setDest(null); }}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative z-0">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {flyTarget && <FlyTo position={flyTarget} zoom={15} />}

            {/* Live user dot */}
            {userPos && (
              <>
                <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                  <Popup><strong>You are here</strong><br />GPS accuracy: ~{accuracy ? Math.round(accuracy) : '?'}m</Popup>
                </Marker>
                {accuracy && (
                  <Circle
                    center={[userPos.lat, userPos.lng]}
                    radius={accuracy}
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
                  />
                )}
              </>
            )}

            {/* Origin marker */}
            {origin && (
              <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
                <Popup><strong style={{ color: '#10b981' }}>Origin</strong><br />{origin.address}</Popup>
              </Marker>
            )}

            {/* Destination marker */}
            {dest && (
              <Marker position={[dest.lat, dest.lng]} icon={destIcon}>
                <Popup><strong style={{ color: '#7c3aed' }}>Destination</strong><br />{dest.address}</Popup>
              </Marker>
            )}

            {/* Route line */}
            {routeLine && (
              <Polyline
                positions={routeLine}
                pathOptions={{ color: '#7c3aed', weight: 5, opacity: 0.8, dashArray: '12 6' }}
              />
            )}
          </MapContainer>

          {/* Locate me FAB */}
          <button
            onClick={locateMe}
            disabled={locating}
            className="absolute bottom-24 right-4 z-[500] bg-white shadow-lg rounded-full p-3 border border-slate-200 hover:bg-violet-50 hover:border-violet-200 transition-all active:scale-95"
          >
            {locating
              ? <Loader2 size={20} className="text-violet-600 animate-spin" />
              : <LocateFixed size={20} className="text-violet-600" />}
          </button>

          {/* Zoom controls */}
          <div className="absolute bottom-40 right-4 z-[500] flex flex-col gap-0 bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => document.querySelector('.leaflet-control-zoom-in')?.click()}
              className="px-3 py-2 text-slate-700 hover:bg-slate-50 text-lg font-light leading-none border-b border-slate-100"
            >+</button>
            <button
              onClick={() => document.querySelector('.leaflet-control-zoom-out')?.click()}
              className="px-3 py-2 text-slate-700 hover:bg-slate-50 text-lg font-light leading-none"
            >−</button>
          </div>
          <div className="leaflet-control-zoom" style={{ display: 'none' }} />
        </div>

        {/* Recent / Quick destinations bottom sheet */}
        <div className="bg-white border-t border-slate-200 px-4 pt-3 pb-4 z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock size={10} /> Quick Destinations
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {RECENT.map((r) => (
              <button
                key={r.label}
                onClick={() => pickRecent(r)}
                className="shrink-0 flex items-center gap-1.5 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-xl px-3 py-2 text-xs text-slate-700 hover:text-violet-700 transition-all"
              >
                <MapPin size={11} className="text-violet-400" />
                {r.label}
              </button>
            ))}
            <button
              onClick={locateMe}
              className="shrink-0 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700 font-semibold transition-all"
            >
              <LocateFixed size={11} />
              Use My GPS
            </button>
          </div>
        </div>

      </div>
    </PageWrapper>
  );
}
