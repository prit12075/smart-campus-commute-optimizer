import { motion } from 'framer-motion';
import { CheckCircle, Circle, MapPin, Car, Flag } from 'lucide-react';

const STEPS = [
  { key: 'active', label: 'Confirmed', icon: CheckCircle },
  { key: 'in_progress', label: 'En Route', icon: Car },
  { key: 'completed', label: 'Arrived', icon: Flag },
];

const STATUS_INDEX = { active: 0, full: 0, in_progress: 1, completed: 2, cancelled: -1 };

export default function RideProgressTracker({ status = 'active' }) {
  const currentIndex = STATUS_INDEX[status] ?? -1;

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
        <Circle size={14} className="text-red-500" />
        <span className="text-xs font-semibold text-red-600">Ride Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = i <= currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: isCurrent ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${
                isDone
                  ? isCurrent
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-50 text-slate-300'
              }`}
            >
              <Icon size={12} strokeWidth={isDone ? 2.5 : 1.5} />
              <span className="hidden sm:inline">{step.label}</span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                i < currentIndex ? 'bg-emerald-300' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
