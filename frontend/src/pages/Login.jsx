import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ChevronLeft, Car, Users, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ALLOWED_DOMAINS = ['srmsp.edu.in', 'srmap.edu.in', 'srmist.edu.in'];

const isValidSRMEmail = (email) =>
  ALLOWED_DOMAINS.some((d) => email.toLowerCase().endsWith(`@${d}`));

const features = [
  { icon: Zap,    label: 'Instant Matching',   desc: 'AI-powered ride pairing in seconds' },
  { icon: Users,  label: 'Student Community',  desc: 'Connect with verified SRM students' },
  { icon: Shield, label: 'Verified Only',      desc: 'Exclusive @srmsp.edu.in access' },
];

// Floating blob background
const Blobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl animate-float" />
    <div className="absolute top-1/3 -right-24 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
    <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-brand-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
  </div>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email address');
    if (!isValidSRMEmail(email)) {
      return toast.error('Only @srmsp.edu.in emails are allowed');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { email });
      toast.success('OTP sent! Check your inbox.');
      // Dev: show OTP in console if returned
      if (data.devOtp) {
        console.info('[DEV] OTP:', data.devOtp);
        toast(`DEV OTP: ${data.devOtp}`, { icon: '🔑', duration: 30000 });
      }
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name.split(' ')[0]}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Branding panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 p-12 overflow-hidden">
        <Blobs />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inset-brand">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Smart Campus</p>
            <p className="text-white/60 text-xs mt-0.5">SRM University · Amaravati</p>
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="relative"
        >
          <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Commute<br />
            <span className="text-white/70">smarter,</span><br />
            together.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            The ride-sharing platform built exclusively for SRM students. Find your commute match in seconds.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative space-y-3"
        >
          {features.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">{label}</p>
                <p className="text-white/50 text-xs mt-0.5">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Right: Auth form ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-ink-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

        <div className="relative w-full max-w-sm">

          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 mb-8 lg:hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <Car size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-ink-900 leading-none">Smart Campus</p>
              <p className="text-ink-400 text-xs mt-0.5">SRM University</p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-2xl font-bold text-ink-900 mb-1">Welcome back</h2>
                <p className="text-ink-400 text-sm mb-7">Sign in with your SRM student email</p>

                {/* Google */}
                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                  onClick={handleGoogleLogin}
                  className="btn-secondary w-full h-12 text-sm font-semibold mb-5"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.button>

                <div className="divider text-xs text-ink-300 font-medium">or use email OTP</div>

                <form onSubmit={handleSendOTP} className="space-y-4 mt-5">
                  <div>
                    <label className="label">Student Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                      <input
                        type="email"
                        className="input pl-10 h-12"
                        placeholder="you@srmsp.edu.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-ink-300 mt-1.5">Only @srmsp.edu.in emails are accepted</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full h-12"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>Send OTP <ArrowRight size={15} /></>}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => { setStep('email'); setOtp(''); }}
                  className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 mb-6 transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>

                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mb-5">
                  <Mail size={22} className="text-brand-600" />
                </div>

                <h2 className="text-2xl font-bold text-ink-900 mb-1">Check your inbox</h2>
                <p className="text-ink-400 text-sm mb-7">
                  We sent a 6-digit code to<br />
                  <span className="text-ink-700 font-medium">{email}</span>
                </p>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="label">One-Time Password</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="input-lg text-center text-3xl font-bold tracking-[0.5em] h-16"
                      placeholder="——————"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      autoFocus
                    />
                    <p className="text-[11px] text-ink-300 mt-1.5 text-center">Valid for 10 minutes</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="btn-primary w-full h-12"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Sign In'}
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="btn-ghost w-full text-sm"
                  >
                    Resend OTP
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-[11px] text-ink-300 mt-8">
            By signing in you agree to our terms. This platform is exclusively for SRM students.
          </p>
        </div>
      </div>
    </div>
  );
}
