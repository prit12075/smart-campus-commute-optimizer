import { Star, Clock, Users, MapPin, MessageCircle, ArrowDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"

export function RideCard({
  creator,
  pickup,
  destination,
  departureTime,
  availableSeats,
  totalSeats,
  price,
  distanceKm,
}) {
  const driverName = creator?.name || "Unknown Driver";
  const driverAvatar = creator?.avatar;
  const driverInitials = driverName.substring(0, 2).toUpperCase();
  const pilotRating = creator?.rating || 5.0;

  // Format addresses gracefully since DB stores {lat, lng, address?} or might just be strings in legacy DB.
  const pickupLabel = typeof pickup === 'object' ? (pickup.address || `${pickup.lat.toFixed(3)}, ${pickup.lng.toFixed(3)}`) : pickup || "Unknown";
  const dropoffLabel = typeof destination === 'object' ? (destination.address || `${destination.lat.toFixed(3)}, ${destination.lng.toFixed(3)}`) : destination || "Unknown";
  
  // Format departure string safely
  let timeLabel = "TBD";
  try {
    if (departureTime) timeLabel = format(new Date(departureTime), "h:mm a, MMM d");
  } catch(e) {}

  return (
    <div className="group rounded-2xl border border-white/30 bg-white/70 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-violet-200/50 hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
      {/* Driver Info */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 ring-2 ring-violet-500/20 transition-all group-hover:ring-violet-500/40">
            <AvatarImage src={driverAvatar} alt={driverName} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
              {driverInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-slate-900">{driverName}</h4>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-amber-700">{pilotRating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-slate-400">Verified Driver</span>
            </div>
          </div>
        </div>
        {(price || distanceKm !== undefined) && (
          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 px-3 py-1.5 text-right">
            {price && <span className="block text-sm font-bold text-violet-600">{price}</span>}
            {distanceKm !== undefined && <span className="block text-xs font-medium text-slate-500">{distanceKm.toFixed(1)} km away</span>}
          </div>
        )}
      </div>

      {/* Route */}
      <div className="mb-4 flex gap-3">
        {/* Visual Route Line */}
        <div className="flex flex-col items-center py-1">
          <div className="flex size-3 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 ring-4 ring-violet-500/10" />
          <div className="my-1 h-10 w-0.5 bg-gradient-to-b from-violet-400 via-slate-300 to-emerald-400" />
          <div className="flex size-3 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-4 ring-emerald-500/10" />
        </div>
        
        {/* Route Details */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          <div className="truncate">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pickup</p>
            <p className="truncate font-medium text-slate-900">{pickupLabel}</p>
          </div>
          <div className="truncate">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Dropoff</p>
            <p className="truncate font-medium text-slate-900">{dropoffLabel}</p>
          </div>
        </div>
      </div>

      {/* Ride Metrics */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-2">
          <Clock className="size-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{timeLabel}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-2">
          <Users className="size-4 text-slate-500" />
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSeats || 4 }).map((_, i) => (
              <div
                key={i}
                className={`size-2 rounded-full transition-colors ${
                  i < (availableSeats ?? 0)
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                    : "bg-slate-300"
                }`}
              />
            ))}
            <span className="ml-1.5 text-sm font-medium text-slate-700 whitespace-nowrap">
              {availableSeats} seats
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]">
        <MessageCircle className="size-4" />
        Request to Join
      </button>
    </div>
  )
}

export function RideFeed({ rides = [], title = "Nearby Offers", subtitle = "Optimized by proximity to you" }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50">
          <MapPin className="size-4" />
          Filter by location
          <ArrowDown className="size-3" />
        </button>
      </div>
      
      {rides.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50">
          <p className="text-slate-500">No rides found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rides.map((ride, index) => (
            <RideCard key={ride._id || index} {...ride} />
          ))}
        </div>
      )}
    </div>
  )
}
