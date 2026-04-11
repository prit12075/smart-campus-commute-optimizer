"use client"

import { Star, Clock, Users, MapPin, MessageCircle, ArrowDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RideCardProps {
  driver: {
    name: string
    avatar: string
    rating: number
    initials: string
  }
  pickup: string
  dropoff: string
  departureTime: string
  availableSeats: number
  totalSeats: number
  price?: string
}

export function RideCard({
  driver,
  pickup,
  dropoff,
  departureTime,
  availableSeats,
  totalSeats,
  price,
}: RideCardProps) {
  return (
    <div className="group rounded-2xl border border-white/30 bg-white/70 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-violet-200/50 hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)]">
      {/* Driver Info */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 ring-2 ring-violet-500/20 transition-all group-hover:ring-violet-500/40">
            <AvatarImage src={driver.avatar} alt={driver.name} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
              {driver.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-slate-900">{driver.name}</h4>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-amber-700">{driver.rating}</span>
              </div>
              <span className="text-xs text-slate-400">Verified Driver</span>
            </div>
          </div>
        </div>
        {price && (
          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 px-3 py-1.5">
            <span className="text-sm font-bold text-violet-600">{price}</span>
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
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pickup</p>
            <p className="font-medium text-slate-900">{pickup}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Dropoff</p>
            <p className="font-medium text-slate-900">{dropoff}</p>
          </div>
        </div>
      </div>

      {/* Ride Metrics */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-2">
          <Clock className="size-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{departureTime}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-2">
          <Users className="size-4 text-slate-500" />
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSeats }).map((_, i) => (
              <div
                key={i}
                className={`size-2 rounded-full transition-colors ${
                  i < availableSeats
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                    : "bg-slate-300"
                }`}
              />
            ))}
            <span className="ml-1.5 text-sm font-medium text-slate-700">
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

export function RideFeed() {
  const rides: RideCardProps[] = [
    {
      driver: {
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
        rating: 4.9,
        initials: "SC",
      },
      pickup: "Engineering Building",
      dropoff: "Downtown Station",
      departureTime: "3:30 PM",
      availableSeats: 3,
      totalSeats: 4,
      price: "$5",
    },
    {
      driver: {
        name: "Marcus Johnson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        rating: 4.8,
        initials: "MJ",
      },
      pickup: "Main Library",
      dropoff: "Westside Apartments",
      departureTime: "4:00 PM",
      availableSeats: 2,
      totalSeats: 3,
      price: "$4",
    },
    {
      driver: {
        name: "Emily Rodriguez",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        rating: 4.7,
        initials: "ER",
      },
      pickup: "Student Center",
      dropoff: "North Campus",
      departureTime: "5:15 PM",
      availableSeats: 1,
      totalSeats: 4,
      price: "$3",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nearby Offers</h2>
          <p className="text-sm text-slate-500">Optimized by proximity to you</p>
        </div>
        <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50">
          <MapPin className="size-4" />
          Filter by location
          <ArrowDown className="size-3" />
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rides.map((ride, index) => (
          <RideCard key={index} {...ride} />
        ))}
      </div>
    </div>
  )
}
