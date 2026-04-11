import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Phone, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function SOSButton() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSOS = async () => {
    setSending(true);
    try {
      let lat, lng;
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 4000 }
          );
        });
      }
      await api.post('/rides/sos', {
        lat, lng,
        message: 'Emergency SOS triggered from CampusRide app.',
      });
      toast.success('SOS sent to campus security! Stay calm.', { duration: 8000 });
      setOpen(false);
    } catch {
      toast.error('Failed to send SOS. Call 100 directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating SOS trigger */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 flex items-center justify-center transition-colors"
        title="Emergency SOS"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle size={22} strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-glass-lg overflow-hidden"
            >
              {/* Red header */}
              <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-6 pb-8 text-white text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4"
                >
                  <AlertTriangle size={30} strokeWidth={2.5} />
                </motion.div>
                <h2 className="text-xl font-extrabold">Emergency SOS</h2>
                <p className="text-red-100 text-sm mt-1">
                  This will alert campus security with your location.
                </p>
              </div>

              <div className="p-6 space-y-3">
                {/* Emergency contacts */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-ink-50 border border-ink-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Shield size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-800">Campus Security</p>
                    <p className="text-xs text-ink-400">Alert will include your GPS location</p>
                  </div>
                </div>

                <a
                  href="tel:100"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-ink-50 border border-ink-100 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <Phone size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-800">Call Police — 100</p>
                    <p className="text-xs text-ink-400">Tap to call directly</p>
                  </div>
                </a>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSOS}
                  disabled={sending}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                  {sending ? 'Sending Alert…' : 'Send SOS Alert'}
                </motion.button>

                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-2.5 rounded-2xl text-ink-500 text-sm font-medium hover:bg-ink-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
