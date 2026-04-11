"use client";

import { useState } from 'react';
import FloatingNav from '../components/campus-ride/floating-nav';
import InteractiveMap from '../components/campus-ride/InteractiveMap';
import RideFeed from '../components/campus-ride/RideFeed';
import ProfileSettings from '../components/campus-ride/ProfileSettings';
import { LayoutDashboard, Car, User } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50">
      <FloatingNav />

      <div className="relative overflow-hidden pt-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 size-96 rounded-full bg-gradient-to-br from-violet-200/40 to-purple-200/40 blur-3xl" />
          <div className="absolute -left-40 top-40 size-96 rounded-full bg-gradient-to-br from-violet-100/40 to-purple-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Your Smart Campus
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Commute
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-slate-600">
              Connect with fellow students, share rides, and make your campus commute effortless and eco-friendly.
            </p>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-2xl border border-white/30 bg-white/50 p-1.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'explore', label: 'Explore Rides', icon: Car },
                { id: 'profile', label: 'Profile', icon: User },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/25'
                        : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Rides Completed', value: '42', change: '+5 this week', positive: true },
                    { label: 'CO₂ Saved', value: '128 kg', change: '+12 kg this month', positive: true },
                    { label: 'Money Saved', value: '$156', change: 'vs. rideshare apps', positive: true },
                    { label: 'Active Rides', value: '3', change: 'Available now', positive: true },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/30 bg-white/70 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)]"
                    >
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className={`mt-1 text-xs font-medium ${stat.positive ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {stat.change}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="mb-4 text-xl font-bold text-slate-900">Find or Create a Ride</h2>
                  <InteractiveMap />
                </div>

                <RideFeed />
              </>
            )}

            {activeTab === 'explore' && (
              <>
                <InteractiveMap />
                <RideFeed />
              </>
            )}

            {activeTab === 'profile' && <ProfileSettings />}
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t border-slate-200/80 bg-white/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Car className="size-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">CampusRide</span>
            </div>
            <p className="text-sm text-slate-500">Made with care for sustainable campus commuting</p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-slate-500 transition-colors hover:text-violet-600">Privacy</a>
              <a href="#" className="text-sm text-slate-500 transition-colors hover:text-violet-600">Terms</a>
              <a href="#" className="text-sm text-slate-500 transition-colors hover:text-violet-600">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
