/* b44-full-sync 2026-06-01 */
import { Loader2 } from 'lucide-react';

export default function PageLoader({ className = '' }) {
  return (
    <div className={`flex flex-1 items-center justify-center min-h-[40vh] ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Загрузка" />
    </div>
  );
}
