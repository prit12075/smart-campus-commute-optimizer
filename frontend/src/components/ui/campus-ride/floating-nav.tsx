"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutDashboard, Car, User, Bell, ChevronDown, LogOut, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Explore Rides", href: "/explore", icon: Car },
  { label: "Profile", href: "/profile", icon: User },
]

export function FloatingNav() {
  const [activeItem, setActiveItem] = useState("Dashboard")
  const [hasNotifications] = useState(true)

  return (
    <nav className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/70 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {/* Logo */}
        <Link href="/" className="mr-2 flex items-center gap-2 px-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Car className="size-5 text-white" />
          </div>
          <span className="hidden text-lg font-semibold tracking-tight text-slate-900 sm:block">
            CampusRide
          </span>
        </Link>

        {/* Divider */}
        <div className="mx-1 h-8 w-px bg-slate-200/80" />

        {/* Nav Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.label
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setActiveItem(item.label)}
                className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/25"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} />
                <span className="hidden md:block">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="mx-1 h-8 w-px bg-slate-200/80" />

        {/* Notifications */}
        <button className="relative flex size-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-slate-100/80 hover:text-slate-900">
          <Bell className="size-5" />
          {hasNotifications && (
            <span className="absolute right-2 top-2 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
            </span>
          )}
        </button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 transition-all hover:bg-slate-100/80">
              <Avatar className="size-8 ring-2 ring-violet-500/20">
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-xs text-white">JD</AvatarFallback>
              </Avatar>
              <ChevronDown className="size-4 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-white/20 bg-white/90 p-2 shadow-xl backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5">
              <Avatar className="size-10 ring-2 ring-violet-500/20">
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-900">John Doe</p>
                <p className="text-xs text-slate-500">john@university.edu</p>
              </div>
            </div>
            <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2.5 text-slate-700 hover:bg-violet-50 hover:text-violet-700">
              <User className="mr-2 size-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2.5 text-slate-700 hover:bg-violet-50 hover:text-violet-700">
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-slate-200/80" />
            <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700">
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
