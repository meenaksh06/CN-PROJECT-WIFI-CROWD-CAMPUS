
import React, { useEffect } from 'react';


export default function Toast({
  message = '',
  open = false,
  onClose = () => {},
  level = 'info',
  duration = 3000,
  showSpinner = false,
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const bg = level === 'error' ? 'bg-red-600' : level === 'success' ? 'bg-green-600' : 'bg-gray-800';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`max-w-xs px-4 py-3 rounded shadow-lg text-white ${bg} border border-white/10`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {showSpinner ? (
              // spinner (uses tailwind animate-spin)
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.12" strokeWidth="4" />
                <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
              </svg>
            ) : (
              // small clock icon for non-spinning states
              <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              </svg>
            )}
          </div>

          <div className="text-sm">{message}</div>

          <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
