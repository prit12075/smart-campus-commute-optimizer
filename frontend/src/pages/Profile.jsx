import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, GraduationCap, Car, Loader2, CheckCircle,
  Shield, Camera, Trash2, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/common/PageWrapper';

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

function AvatarUploader({ user, onUpload, onRemove }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return toast.error('Only JPG, PNG, or WebP images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5 MB');
    }
    // local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // upload
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.post('/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Photo updated!');
      onUpload(data.avatar);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    setRemoving(true);
    try {
      await api.delete('/users/avatar');
      toast.success('Photo removed');
      setPreview(null);
      onRemove();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setRemoving(false);
    }
  };

  const currentSrc = preview || user?.avatar;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative group cursor-pointer ${dragging ? 'scale-105' : ''} transition-transform`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
      >
        <div className={`w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center font-bold text-3xl text-white shadow-brand transition-all ${currentSrc ? '' : 'bg-gradient-brand'}`}>
          {currentSrc
            ? <img src={currentSrc} alt="Avatar" className="w-full h-full object-cover" />
            : initials}
        </div>
        {/* Overlay */}
        <div className={`absolute inset-0 rounded-3xl bg-ink-900/50 flex items-center justify-center transition-opacity ${dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {uploading
            ? <Loader2 size={22} className="text-white animate-spin" />
            : <Camera size={22} className="text-white" />}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors disabled:opacity-50"
        >
          <Upload size={12} /> Upload photo
        </button>
        {(user?.avatar || preview) && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {removing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={12} />}
            Remove
          </button>
        )}
      </div>
      <p className="text-[11px] text-ink-300">JPG, PNG or WebP · Max 5 MB · Drag & drop supported</p>
    </div>
  );
}

const SectionCard = ({ icon: Icon, title, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    className="card"
  >
    <h3 className="text-sm font-bold text-ink-800 mb-5 flex items-center gap-2">
      <div className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center">
        <Icon size={14} className="text-brand-600" />
      </div>
      {title}
    </h3>
    {children}
  </motion.div>
);

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  // Always fetch fresh profile on mount so email-login users see latest data
  useEffect(() => {
    refreshUser().then((freshUser) => {
      const u = freshUser || user;
      if (!u) return;
      reset({
        name: u.name || '',
        registrationNumber: u.registrationNumber || '',
        department: u.department || '',
        year: u.year || '',
        section: u.section || '',
        phone: u.phone || '',
        preferredPickupTime: u.preferredPickupTime || '',
        vehicleType: u.vehicleType || '',
        isDriver: u.isDriver || false,
      });
    });
  }, []); // eslint-disable-line

  const onSubmit = async (values) => {
    setSaving(true);
    // Don't send empty vehicleType — avoids enum error
    if (!values.vehicleType) delete values.vehicleType;
    try {
      await api.put('/users/profile', values);
      await refreshUser();
      toast.success('Profile saved! ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const completionFields = ['name', 'email', 'registrationNumber', 'department', 'year'];
  const completedCount = completionFields.filter((f) => !!user?.[f]).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-50 pb-20">
      <div className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-40 -top-40 size-96 rounded-full bg-gradient-to-br from-violet-200/40 to-purple-200/40 blur-3xl opacity-50" />
          <div className="absolute -left-40 top-40 size-96 rounded-full bg-gradient-to-br from-violet-100/40 to-purple-100/40 blur-3xl opacity-50" />
        </div>
        <PageWrapper className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Profile</h1>
        <p className="text-ink-400 text-sm mt-1">Manage your student info and commute preferences</p>
      </div>

      {/* Profile header card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        className="card mb-6 bg-gradient-to-br from-brand-50/60 to-violet-50/60"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <AvatarUploader
            user={user}
            onUpload={() => refreshUser()}
            onRemove={() => refreshUser()}
          />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
              <h2 className="text-xl font-extrabold text-ink-900">{user?.name || 'Student'}</h2>
              {user?.role === 'admin' && (
                <span className="badge-brand flex items-center gap-1"><Shield size={10} /> Admin</span>
              )}
              {user?.isEmailVerified && (
                <span className="badge-green flex items-center gap-1"><CheckCircle size={10} /> Verified</span>
              )}
            </div>
            <p className="text-sm text-ink-500 truncate">{user?.email}</p>
            {user?.registrationNumber && (
              <p className="text-xs font-semibold text-brand-600 mt-1">{user.registrationNumber}</p>
            )}

            {/* Completion */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-ink-400 font-medium">Profile completion</span>
                <span className="text-xs font-bold text-brand-600">{completionPct}%</span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-brand rounded-full"
                />
              </div>
              {completionPct < 100 && (
                <p className="text-[11px] text-ink-300 mt-1">Fill in the missing fields to complete your profile</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal Info */}
        <SectionCard icon={User} title="Personal Information">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input h-11" placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <input {...register('phone')} className="input h-11 pl-9" placeholder="+91 9876543210" type="tel" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Email Address</label>
            <div className="flex items-center gap-2 h-11 px-3.5 rounded-2xl bg-ink-50 border border-ink-100 text-ink-400 text-sm">
              <Mail size={14} className="flex-shrink-0" />
              <span className="flex-1 truncate">{user?.email || 'Not set'}</span>
              {user?.isEmailVerified && <CheckCircle size={13} className="text-green-500 flex-shrink-0" />}
            </div>
            <p className="text-[11px] text-ink-300 mt-1.5">Email is linked to your SRM account and cannot be changed</p>
          </div>
        </SectionCard>

        {/* Academic Info */}
        <SectionCard icon={GraduationCap} title="Academic Information">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Registration Number *</label>
              <input
                {...register('registrationNumber')}
                className="input h-11 uppercase tracking-wide"
                placeholder="AP21110010001"
              />
            </div>
            <div>
              <label className="label">Year *</label>
              <select {...register('year')} className="input h-11">
                <option value="">Select year</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Department *</label>
              <select {...register('department')} className="input h-11">
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <input {...register('section')} className="input h-11" placeholder="e.g., A, B, C" />
            </div>
          </div>
        </SectionCard>

        {/* Commute Preferences */}
        <SectionCard icon={Car} title="Commute Preferences">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Preferred Pickup Time</label>
              <input {...register('preferredPickupTime')} type="time" className="input h-11" />
            </div>
            <div>
              <label className="label">My Vehicle Type</label>
              <select {...register('vehicleType')} className="input h-11">
                <option value="">None / Not applicable</option>
                <option value="bike">🏍️ Bike</option>
                <option value="car">🚗 Car</option>
                <option value="auto">🛺 Auto</option>
                <option value="bus">🚌 Bus</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 mt-4 p-4 bg-ink-50 rounded-2xl cursor-pointer hover:bg-ink-100 transition-colors group">
            <input
              {...register('isDriver')}
              type="checkbox"
              className="w-4 h-4 accent-brand-600 cursor-pointer"
            />
            <div>
              <p className="text-sm font-semibold text-ink-800 group-hover:text-ink-900">I'm available as a driver</p>
              <p className="text-xs text-ink-400 mt-0.5">Others can discover and request rides from you</p>
            </div>
          </label>
        </SectionCard>

        {/* Save */}
        <motion.button
          whileHover={{ scale: isDirty && !saving ? 1.01 : 1 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={saving || !isDirty}
          className="btn-primary w-full h-12 text-sm"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
        </motion.button>
      </form>
        </PageWrapper>
      </div>
    </div>
  );
}
