import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Building, GraduationCap, Car, MapPin, Loader2, CheckCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical and Electronics Engineering',
  'Information Technology',
  'Biotechnology',
  'Chemical Engineering',
  'Business Administration',
  'Other',
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        registrationNumber: user.registrationNumber || '',
        department: user.department || '',
        year: user.year || '',
        section: user.section || '',
        phone: user.phone || '',
        preferredPickupTime: user.preferredPickupTime || '',
        vehicleType: user.vehicleType || '',
        isDriver: user.isDriver || false,
      });
    }
  }, [user, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.put('/users/profile', values);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const completionFields = ['name', 'email', 'registrationNumber', 'department', 'year'];
  const completedCount = completionFields.filter((f) => !!user?.[f]).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);

  return (
    <div className="page-container animate-fade-in max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your student information and preferences</p>
      </div>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : (user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
              {user?.role === 'admin' && (
                <span className="badge-primary flex items-center gap-1"><Shield size={10} /> Admin</span>
              )}
              {user?.isEmailVerified && (
                <span className="badge-green flex items-center gap-1"><CheckCircle size={10} /> Verified</span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            {user?.registrationNumber && (
              <p className="text-xs text-primary-600 font-medium mt-0.5">{user?.registrationNumber}</p>
            )}
          </div>
        </div>

        {/* Completion Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-medium">Profile completion</span>
            <span className="text-xs font-bold text-primary-600">{completionPct}%</span>
          </div>
          <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {completionPct < 100 && (
            <p className="text-xs text-slate-400 mt-1">Complete your profile to unlock all features</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal Info */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User size={16} className="text-primary-500" /> Personal Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input {...register('phone')} className="input" placeholder="+91 9876543210" type="tel" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Email</label>
            <div className="input bg-surface-50 text-slate-500 cursor-not-allowed flex items-center gap-2">
              <Mail size={14} />
              <span>{user?.email || 'Not set'}</span>
              {user?.isEmailVerified && <CheckCircle size={12} className="text-green-500 ml-auto" />}
            </div>
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        {/* Academic Info */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-primary-500" /> Academic Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Registration Number *</label>
              <input
                {...register('registrationNumber')}
                className="input uppercase"
                placeholder="AP21110010001"
                onChange={(e) => e.target.value = e.target.value.toUpperCase()}
              />
            </div>
            <div>
              <label className="label">Year *</label>
              <select {...register('year')} className="input">
                <option value="">Select year</option>
                {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department *</label>
              <select {...register('department')} className="input">
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <input {...register('section')} className="input" placeholder="e.g., A, B, C" />
            </div>
          </div>
        </div>

        {/* Commute Preferences */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Car size={16} className="text-primary-500" /> Commute Preferences
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Preferred Pickup Time</label>
              <input {...register('preferredPickupTime')} type="time" className="input" />
            </div>
            <div>
              <label className="label">Vehicle Type</label>
              <select {...register('vehicleType')} className="input">
                <option value="">None</option>
                <option value="bike">🏍️ Bike</option>
                <option value="car">🚗 Car</option>
                <option value="auto">🛺 Auto</option>
                <option value="bus">🚌 Bus</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
            <input {...register('isDriver')} type="checkbox" id="isDriver" className="w-4 h-4 accent-primary-600 cursor-pointer" />
            <label htmlFor="isDriver" className="text-sm text-slate-700 cursor-pointer">
              <span className="font-medium">I'm available as a driver</span>
              <p className="text-xs text-slate-400 mt-0.5">Others can request rides from you</p>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !isDirty}
          className="btn-primary w-full h-11"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
