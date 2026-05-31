import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchFilters from '@/components/discover/SearchFilters';
import { useSearchFilters } from '@/lib/useSearchFilters';

export default function DiscoverFiltersSheet({ profile, onClose }) {
  const navigate = useNavigate();
  const {
    ageRange,
    cityFilter,
    lookingFor,
    handleAgeChange,
    handleCityChange,
    handleLookingForChange,
    isSaving,
  } = useSearchFilters(profile);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60]"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute inset-x-0 bottom-[5.25rem] mx-auto w-full max-w-lg glass-strong rounded-t-3xl px-6 pt-6 pb-5 max-h-[min(72vh,calc(100dvh-6.5rem))] overflow-y-auto safe-bottom"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Фильтры поиска</h2>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <button onClick={onClose} className="glass p-2 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Те же настройки, что в профиле — изменения сразу обновляют ленту
        </p>

        <SearchFilters
          ageRange={ageRange}
          cityFilter={cityFilter}
          lookingFor={lookingFor}
          onAgeChange={handleAgeChange}
          onCityChange={handleCityChange}
          onLookingForChange={handleLookingForChange}
          disabled={isSaving}
        />

        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/settings');
          }}
          className="mt-6 mb-1 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Открыть все настройки профиля →
        </button>
      </motion.div>
    </motion.div>
  );
}
