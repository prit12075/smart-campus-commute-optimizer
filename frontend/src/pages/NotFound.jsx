import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-brand-300/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-violet-300/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative"
      >
        {/* Logo */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center mx-auto mb-8 shadow-brand-lg"
        >
          <Car size={34} className="text-white" />
        </motion.div>

        {/* 404 */}
        <h1 className="text-8xl font-extrabold text-ink-900 leading-none mb-3 tracking-tight">
          4<span className="text-gradient">0</span>4
        </h1>
        <p className="text-xl font-bold text-ink-700 mb-2">Page not found</p>
        <p className="text-ink-400 text-sm mb-10 max-w-xs mx-auto">
          Looks like this route took a wrong turn. The page you're looking for doesn't exist.
        </p>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
