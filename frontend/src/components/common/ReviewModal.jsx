import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import StarRating from './StarRating';

export default function ReviewModal({ ride, revieweeId, revieweeName, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Please select a star rating');
    setLoading(true);
    try {
      await api.post('/reviews', {
        rideId: ride._id,
        revieweeId,
        rating,
        comment: comment.trim(),
      });
      setDone(true);
      setTimeout(() => { onDone?.(); onClose(); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-3xl w-full max-w-sm shadow-glass-lg overflow-hidden"
        >
          {done ? (
            <div className="p-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle size={30} className="text-green-500" />
              </motion.div>
              <p className="text-lg font-bold text-ink-900">Review submitted!</p>
              <p className="text-ink-400 text-sm mt-1">Thanks for your feedback.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-100">
                <div>
                  <h2 className="text-base font-bold text-ink-900">Rate your ride</h2>
                  <p className="text-xs text-ink-400 mt-0.5">with {revieweeName}</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-ink-50 flex items-center justify-center hover:bg-ink-100 transition-colors">
                  <X size={15} className="text-ink-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Stars */}
                <div className="text-center">
                  <StarRating value={rating} onChange={setRating} size={36} />
                  <motion.p
                    key={rating}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-semibold text-ink-700 mt-2 h-5"
                  >
                    {LABELS[rating] || ''}
                  </motion.p>
                </div>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Punctual', 'Friendly', 'Safe driver', 'Smooth ride', 'Good communication'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setComment((c) => c ? `${c}, ${chip}` : chip)}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-ink-50 text-ink-600 hover:bg-brand-50 hover:text-brand-700 transition-colors border border-ink-100"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Comment */}
                <div>
                  <label className="label">Additional comments <span className="text-ink-300 normal-case font-normal">(optional)</span></label>
                  <textarea
                    className="input resize-none text-sm"
                    rows={2}
                    placeholder="Share your experience…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading || !rating}
                  className="btn-primary w-full h-11"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><Star size={14} /> Submit Review</>}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
