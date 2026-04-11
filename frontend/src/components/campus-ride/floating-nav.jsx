import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Car, User, Bell, ChevronDown, LogOut } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rides", href: "/rides", icon: Car },
  { label: "Profile", href: "/profile", icon: User },
]

const Avatar = ({ src, name }) => (
  <div className="size-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 ring-2 ring-violet-500/20 flex items-center justify-center text-white text-xs font-semibold">
    {src ? <img src={src} alt={name || 'User'} className="w-full h-full object-cover" /> : (name?.slice(0, 2) || 'U')}
  </div>
)

export default function FloatingNav() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [hasNotifications] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <nav className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/70 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {/* Logo */}
        <Link to="/dashboard" className="mr-2 flex items-center gap-2 px-2">
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
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.label}
                to={item.href}
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
        <div ref={dropdownRef} className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 transition-all hover:bg-slate-100/80"
          >
            <Avatar src={user?.avatar} name={user?.name} />
            <ChevronDown className={`size-4 text-slate-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-12 mt-2 w-56 rounded-xl border border-white/20 bg-white/90 p-2 shadow-xl backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5">
                <Avatar src={user?.avatar} name={user?.name} />
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <Link 
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              >
                <User className="mr-2 size-4" />
                View Profile
              </Link>
              <div className="my-1 h-px bg-slate-200/80" />
              <button 
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="mr-2 size-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
