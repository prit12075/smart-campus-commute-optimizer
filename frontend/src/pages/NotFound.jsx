import { Link } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
          <Car size={36} className="text-white" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-800 mb-2">404</h1>
        <p className="text-lg font-semibold text-slate-600 mb-1">Page not found</p>
        <p className="text-slate-400 text-sm mb-8">Looks like this route took a wrong turn.</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
