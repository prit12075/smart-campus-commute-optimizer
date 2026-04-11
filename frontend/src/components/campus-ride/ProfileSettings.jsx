import { useState } from 'react';
import { User, Mail, Phone, Shield, Eye, EyeOff, Camera, MapPin, Car } from 'lucide-react';

const Avatar = ({ src, fallback = 'JD' }) => (
  <div className="relative size-24 rounded-3xl overflow-hidden ring-4 ring-violet-500/20 bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-semibold flex items-center justify-center">
    {src ? <img src={src} alt="Profile" className="w-full h-full object-cover" /> : fallback}
    <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
      <Camera className="size-6 text-white" />
    </button>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-slate-200'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function ProfileSettings() {
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" />
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

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Contact Information</h3>
        <div className="space-y-4">
          {[{ icon: Mail, label: 'Email Address', value: 'john.doe@university.edu' },
            { icon: Phone, label: 'Phone Number', value: '(555) 123-4567' },
            { icon: MapPin, label: 'Default Location', value: 'Engineering Building, Campus' }].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                <Icon className="size-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="font-medium text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="size-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900">Privacy Settings</h3>
        </div>

        <div className="space-y-4">
          <PrivacyRow
            checked={showPhone}
            onChange={setShowPhone}
            title="Publicly Display Phone Number"
            description={showPhone ? 'Other users can see your phone number' : 'Your phone number is hidden from other users'}
            iconOn={Eye}
            iconOff={EyeOff}
          />
          <PrivacyRow
            checked={showEmail}
            onChange={setShowEmail}
            title="Display Email Address"
            description={showEmail ? 'Your email is visible to verified students' : 'Your email is hidden from other users'}
            iconOn={Eye}
            iconOff={EyeOff}
          />
          <PrivacyRow
            checked={allowMessages}
            onChange={setAllowMessages}
            title="Allow Direct Messages"
            description={allowMessages ? 'Anyone can send you ride requests' : 'Only people you know can contact you'}
            iconOn={Eye}
            iconOff={EyeOff}
          />
        </div>

        <div className="mt-4 rounded-xl bg-amber-50/80 p-4">
          <p className="text-sm text-amber-800">
            <strong>Privacy Tip:</strong> We recommend keeping your phone number private and using our in-app messaging for initial contact with ride partners.
          </p>
        </div>
      </div>
    </div>
  );
}

const PrivacyRow = ({ checked, onChange, title, description, iconOn: IconOn, iconOff: IconOff }) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/60 p-4 transition-all hover:border-violet-200/50 hover:bg-white/80">
    <div className="flex items-center gap-3">
      <div className={`flex size-10 items-center justify-center rounded-lg transition-colors ${checked ? 'bg-violet-100' : 'bg-slate-100'}`}>
        {checked ? <IconOn className="size-5 text-violet-600" /> : <IconOff className="size-5 text-slate-500" />}
      </div>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);
