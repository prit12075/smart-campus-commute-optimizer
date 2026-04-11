import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet + Vite bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const dropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const rideIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Auto-fit bounds when markers change
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

// Click-to-select location
function ClickHandler({ onClick }) {
  const map = useMap();
  useEffect(() => {
    if (!onClick) return;
    const handler = (e) => onClick(e.latlng);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onClick]);
  return null;
}

/**
 * MapView — reusable map component
 * @param {Object} props
 * @param {Object} props.pickup - { lat, lng, address }
 * @param {Object} props.destination - { lat, lng, address }
 * @param {Array}  props.rides - Array of ride objects with pickup coordinates
 * @param {Function} props.onMapClick - Callback when user clicks map (for location picking)
 * @param {Function} props.onRideClick - Callback when a ride marker is clicked
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.interactive - Allow zoom/drag (default true)
 * @param {number} props.height - Map height in px
 */
export default function MapView({
  pickup,
  destination,
  rides = [],
  onMapClick,
  onRideClick,
  className = '',
  interactive = true,
  height = 350,
}) {
  const mapRef = useRef(null);

  // SRM AP Campus center
  const defaultCenter = [16.4420, 80.6220];
  const center = pickup?.lat ? [pickup.lat, pickup.lng] : defaultCenter;

  // Calculate bounds
  const allPoints = [];
  if (pickup?.lat) allPoints.push([pickup.lat, pickup.lng]);
  if (destination?.lat) allPoints.push([destination.lat, destination.lng]);
  rides.forEach((r) => {
    if (r.pickup?.lat) allPoints.push([r.pickup.lat, r.pickup.lng]);
  });

  const routeLine = pickup?.lat && destination?.lat
    ? [[pickup.lat, pickup.lng], [destination.lat, destination.lng]]
    : null;

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onMapClick && <ClickHandler onClick={onMapClick} />}
        {allPoints.length > 1 && <FitBounds bounds={allPoints} />}

        {/* Pickup marker */}
        {pickup?.lat && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <strong className="text-green-700">📍 Pickup</strong>
              <br />{pickup.address || 'Pickup location'}
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination?.lat && (
          <Marker position={[destination.lat, destination.lng]} icon={dropIcon}>
            <Popup>
              <strong className="text-red-600">🏁 Drop</strong>
              <br />{destination.address || 'Destination'}
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#7c3aed', weight: 4, opacity: 0.7, dashArray: '10,6' }}
          />
        )}

        {/* Nearby rides */}
        {rides.map((ride) => (
          ride.pickup?.lat && (
            <Marker
              key={ride._id}
              position={[ride.pickup.lat, ride.pickup.lng]}
              icon={rideIcon}
              eventHandlers={{ click: () => onRideClick?.(ride) }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>{ride.creator?.name}</strong>
                  <br />{ride.pickup?.address} → {ride.destination?.address}
                  {ride.estimatedFare > 0 && <><br />₹{ride.farePerPerson}/person</>}
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
