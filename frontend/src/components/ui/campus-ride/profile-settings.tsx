"use client"

import { useState } from "react"
import { User, Mail, Phone, Shield, Eye, EyeOff, Camera, MapPin, Car } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

export function ProfileSettings() {
  const [showPhone, setShowPhone] = useState(false)
  const [showEmail, setShowEmail] = useState(true)
  const [allowMessages, setAllowMessages] = useState(true)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Header Card */}
      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar with edit overlay */}
          <div className="group relative">
            <Avatar className="size-24 ring-4 ring-violet-500/20">
              <AvatarImage 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" 
                alt="Profile" 
              />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-2xl text-white">
                JD
              </AvatarFallback>
            </Avatar>
            <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-6 text-white" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-900">John Doe</h2>
            <p className="text-slate-500">Computer Science, Class of 2025</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                <Shield className="size-3" />
                Verified Student
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <Car className="size-3" />
                42 Rides Completed
              </span>
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
            <div className="flex-1">
              <p className="text-sm text-slate-500">Email Address</p>
              <p className="font-medium text-slate-900">john.doe@university.edu</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
              <Phone className="size-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500">Phone Number</p>
              <p className="font-medium text-slate-900">(555) 123-4567</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
              <MapPin className="size-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500">Default Location</p>
              <p className="font-medium text-slate-900">Engineering Building, Campus</p>
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
              <div>
                <p className="font-medium text-slate-900">Publicly Display Phone Number</p>
                <p className="text-sm text-slate-500">
                  {showPhone ? "Other users can see your phone number" : "Your phone number is hidden from other users"}
                </p>
              </div>
            </div>
            <Switch 
              checked={showPhone} 
              onCheckedChange={setShowPhone}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-purple-600"
            />
          </div>

          {/* Email Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/60 p-4 transition-all hover:border-violet-200/50 hover:bg-white/80">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg transition-colors ${showEmail ? "bg-violet-100" : "bg-slate-100"}`}>
                {showEmail ? (
                  <Eye className="size-5 text-violet-600" />
                ) : (
                  <EyeOff className="size-5 text-slate-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">Display Email Address</p>
                <p className="text-sm text-slate-500">
                  {showEmail ? "Your email is visible to verified students" : "Your email is hidden from other users"}
                </p>
              </div>
            </div>
            <Switch 
              checked={showEmail} 
              onCheckedChange={setShowEmail}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-purple-600"
            />
          </div>

          {/* Messages Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/60 p-4 transition-all hover:border-violet-200/50 hover:bg-white/80">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg transition-colors ${allowMessages ? "bg-violet-100" : "bg-slate-100"}`}>
                {allowMessages ? (
                  <Eye className="size-5 text-violet-600" />
                ) : (
                  <EyeOff className="size-5 text-slate-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">Allow Direct Messages</p>
                <p className="text-sm text-slate-500">
                  {allowMessages ? "Anyone can send you ride requests" : "Only people you know can contact you"}
                </p>
              </div>
            </div>
            <Switch 
              checked={allowMessages} 
              onCheckedChange={setAllowMessages}
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
