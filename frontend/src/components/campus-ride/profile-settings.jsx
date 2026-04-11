import { Camera, Mail, Phone, Shield, Eye, EyeOff, MapPin, Car } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"
import api from "@/utils/api"
import toast from "react-hot-toast"

export function ProfileSettings() {
  const { user, setUser } = useAuth()
  const [showPhone, setShowPhone] = useState(user?.showPhoneNumber || false)
  const [loading, setLoading] = useState(false)

  // Sync state if user loads later
  useEffect(() => {
    if (user && user.showPhoneNumber !== undefined) {
      setShowPhone(user.showPhoneNumber)
    }
  }, [user])

  const toggleShowPhone = async (val) => {
    setShowPhone(val)
    setLoading(true)
    try {
      const res = await api.put("/users/profile", { showPhoneNumber: val })
      if (res.data?.success) {
        toast.success("Privacy settings updated")
        setUser(res.data.user)
      }
    } catch (err) {
      toast.error("Failed to update settings")
      setShowPhone(!val)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="p-8 text-center">Loading Profile...</div>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Header Card */}
      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="group relative">
            <Avatar className="size-24 ring-4 ring-violet-500/20">
              <AvatarImage 
                src={user.avatar} 
                alt="Profile" 
              />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-2xl text-white">
                {user.name?.substring(0, 2).toUpperCase() || "JD"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-6 text-white" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500">{user.department}, Batch of {user.year}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                <Shield className="size-3" />
                Verified Student
              </span>
              {user.rating && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <Car className="size-3" />
                  {user.rating.toFixed(1)} Rating
                </span>
              )}
            </div>
          </div>

          <button className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Contact Information</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
              <Mail className="size-5 text-violet-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-slate-500">Email Address</p>
              <p className="truncate font-medium text-slate-900">{user.email}</p>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                <Phone className="size-5 text-violet-600" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm text-slate-500">Phone Number</p>
                <p className="truncate font-medium text-slate-900">{user.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
              <MapPin className="size-5 text-violet-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-slate-500">Default Location</p>
              <p className="truncate font-medium text-slate-900">{user.homeLocation?.address || "No default location set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="size-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900">Privacy Settings</h3>
        </div>
        
        <div className="space-y-4">
          {/* Phone Number Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/60 p-4 transition-all hover:border-violet-200/50 hover:bg-white/80">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg transition-colors ${showPhone ? "bg-violet-100" : "bg-slate-100"}`}>
                {showPhone ? (
                  <Eye className="size-5 text-violet-600" />
                ) : (
                  <EyeOff className="size-5 text-slate-500" />
                )}
              </div>
              <div className="pr-2">
                <p className="font-medium text-slate-900">Publicly Display Phone Number</p>
                <p className="text-sm text-slate-500">
                  {showPhone ? "Other users can see your phone number" : "Your phone number is hidden from other users"}
                </p>
              </div>
            </div>
            <Switch 
              checked={showPhone} 
              onCheckedChange={toggleShowPhone}
              disabled={loading}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-purple-600"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50/80 p-4">
          <p className="text-sm text-amber-800">
            <strong>Privacy Tip:</strong> We recommend keeping your phone number private and using our in-app messaging for initial contact with ride partners.
          </p>
        </div>
      </div>
    </div>
  )
}
