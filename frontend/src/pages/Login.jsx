import { useState } from 'react';
import { Car, Mail, ArrowRight, Shield, Users, Clock, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STEPS = { EMAIL: 'email', OTP: 'otp' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidSRMEmail = (e) =>
    /^[a-zA-Z0-9._%+\-]+@(srmist\.edu\.in|srmap\.edu\.in)$/.test(e);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    if (!isValidSRMEmail(email)) {
      return toast.error('Only @srmist.edu.in emails are allowed');
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      toast.success('OTP sent to your email!');
      setStep(STEPS.OTP);
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
      toast.success(`Welcome, ${data.user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
              <Car size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Smart Campus</h1>
              <p className="text-white/60 text-xs">SRM AP University</p>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-6">
            Smarter commutes<br />for SRM AP students
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Find ride-sharing partners, reduce travel time, and commute together with fellow students.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: Users, text: 'Connect with classmates going your way' },
            { icon: Clock, text: 'Save time with optimized route matching' },
            { icon: Shield, text: 'Verified SRM AP students only' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none">Smart Campus</h1>
              <p className="text-slate-500 text-xs">SRM AP University</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              {step === STEPS.EMAIL ? 'Sign in' : 'Verify OTP'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {step === STEPS.EMAIL
                ? 'Use your @srmist.edu.in email to continue'
                : `Enter the 6-digit code sent to ${email}`}
            </p>

            {/* Google OAuth */}
            {step === STEPS.EMAIL && (
              <>
                <button
                  onClick={handleGoogleLogin}
                  className="btn-secondary w-full mb-4 h-11"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-surface-200" />
                  <span className="text-xs text-slate-400 font-medium">or use email OTP</span>
                  <div className="flex-1 h-px bg-surface-200" />
                </div>
              </>
            )}

            {/* Email Step */}
            {step === STEPS.EMAIL && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="label">Student Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      className="input pl-10"
                      placeholder="you@srmist.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Only @srmist.edu.in emails are accepted</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full h-11">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {/* OTP Step */}
            {step === STEPS.OTP && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="label">One-Time Password</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="input text-center text-2xl font-bold tracking-widest"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1.5 text-center">Valid for 10 minutes</p>
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full h-11">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Verify & Sign In <ChevronRight size={16} /></>}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(STEPS.EMAIL); setOtp(''); }}
                  className="btn-ghost w-full text-sm"
                >
                  ← Change email
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By signing in, you agree to our terms of service. <br />
            Only SRM AP University students can access this platform.
          </p>
        </div>
      </div>
    </div>
  );
}
