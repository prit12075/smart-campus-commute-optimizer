"use client"

import { useState } from "react"
import { MapPin, Navigation, Search, ArrowRight } from "lucide-react"

export function InteractiveMap() {
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Stylized Map Background */}
      <div className="absolute inset-0">
        {/* Map grid pattern */}
        <svg className="size-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Stylized roads */}
        <svg className="absolute inset-0 size-full" viewBox="0 0 400 400">
          <path d="M0 200 Q100 180 200 200 T400 200" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-300" />
          <path d="M200 0 Q180 100 200 200 T200 400" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-300" />
          <path d="M50 100 Q150 150 250 100 T400 150" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-300/70" />
          <path d="M0 300 Q100 280 200 300 T350 280" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-300/70" />
        </svg>
        
        {/* Location markers */}
        <div className="absolute left-1/4 top-1/3 flex flex-col items-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
            <MapPin className="size-5 text-white" />
          </div>
          <div className="mt-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-md backdrop-blur-sm">
            Main Library
          </div>
        </div>
        
        <div className="absolute right-1/3 top-1/2 flex flex-col items-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <Navigation className="size-5 text-white" />
          </div>
          <div className="mt-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow-md backdrop-blur-sm">
            Science Complex
          </div>
        </div>

        {/* Route line */}
        <svg className="absolute inset-0 size-full" viewBox="0 0 400 400">
          <path 
            d="M100 133 Q150 200 267 200" 
            stroke="url(#routeGradient)" 
            strokeWidth="3" 
            strokeDasharray="8 4"
            fill="none" 
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Location Card */}
      <div className="absolute bottom-6 left-6 right-6 md:left-6 md:right-auto md:w-96">
        <div className="rounded-2xl border border-white/30 bg-white/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Plan Your Ride</h3>
          
          <div className="space-y-3">
            {/* Pickup Input */}
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <MapPin className="size-4 text-white" />
                </div>
              </div>
              <input
                type="text"
                placeholder="Pickup Location"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-3.5 pl-14 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            {/* Vertical connector */}
            <div className="ml-7 flex h-4 items-center">
              <div className="h-full w-0.5 bg-gradient-to-b from-violet-400 to-emerald-400" />
            </div>

            {/* Dropoff Input */}
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Navigation className="size-4 text-white" />
                </div>
              </div>
              <input
                type="text"
                placeholder="Dropoff Location"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-3.5 pl-14 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          {/* Search Button */}
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98]">
            <Search className="size-4" />
            Find Rides
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-6 right-6 rounded-lg bg-white/60 px-3 py-1.5 text-xs text-slate-500 backdrop-blur-sm">
        Campus Map Preview
      </div>
    </div>
  )
}
