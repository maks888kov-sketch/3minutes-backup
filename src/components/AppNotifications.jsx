/* b44-full-sync 2026-06-01 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Video, X } from 'lucide-react';

// Simple event bus
const listeners = new Set();
export function showNotification(notification) {
  listeners.forEach(fn => fn(notification));
}

const ICONS = {
  match: { icon: Heart, color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  message: { icon: MessageCircle, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  video_request: { icon: Video, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  video_ready: { icon: Video, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  info: { icon: MessageCircle, color: '#93c5fd', bg: 'rgba(147,197,253,0.12)' },
  error: { icon: X, color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
};

export default function AppNotifications() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((n) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...n, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => listeners.delete(addToast);
  }, [addToast]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-4 left-0 right-0 z-[300] flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map(toast => {
          const cfg = ICONS[toast.type] || ICONS.message;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              role={toast.onClick ? 'button' : undefined}
              tabIndex={toast.onClick ? 0 : undefined}
              onClick={() => toast.onClick?.()}
              onKeyDown={(e) => {
                if (toast.onClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  toast.onClick();
                }
              }}
              className={`w-full max-w-sm pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl ${
                toast.onClick ? 'cursor-pointer hover:border-white/20' : ''
              }`}
              style={{
                background: 'hsl(250,15%,12%)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bg }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{toast.title}</p>
                {toast.body && <p className="text-xs text-muted-foreground truncate">{toast.body}</p>}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="p-1 rounded-lg flex-shrink-0 hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}