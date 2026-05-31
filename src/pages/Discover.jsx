import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentProfile, useDiscoverProfiles, useOnlineCount } from '@/lib/useProfile';
import { showNotification } from '@/components/AppNotifications';
import SwipeCard from '@/components/SwipeCard';
import MatchPopup from '@/components/MatchPopup';
import DailyPicks from '@/components/DailyPicks';
import DiscoverSkeleton from '@/components/DiscoverSkeleton';
import { Heart, X, Star, Sparkles, Flame, RefreshCw } from 'lucide-react';

export default function Discover() {
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: profiles = [], isLoading, refetch } = useDiscoverProfiles(profile);
  const { data: onlineCount = 0 } = useOnlineCount();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState(null);
  const [showDailyPicks, setShowDailyPicks] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setPullRefreshing(true);
    await refetch();
    setCurrentIndex(0);
    setTimeout(() => setPullRefreshing(false), 600);
  }, [refetch]);

  // Pull-to-refresh
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80 && currentIndex === 0) handleRefresh();
  };

  const handleSwipe = useCallback(async (direction, options = {}) => {
    const targetProfile = profiles[currentIndex];
    if (!targetProfile || !profile) return;

    const isLike = direction === 'right' || direction === 'super';
    const isSuperLike = direction === 'super' || options.superLike;

    await base44.entities.Like.create({
      from_profile_id: profile.id,
      to_profile_id: targetProfile.id,
      is_like: isLike,
      is_super_like: !!isSuperLike,
    });

    if (isSuperLike) {
      showNotification({
        type: 'match',
        title: 'Суперлайк отправлен ⭐',
        body: `${targetProfile.name} увидит, что вы заинтересованы`,
      });
    }

    if (isLike) {
      const reverseL = await base44.entities.Like.filter({
        from_profile_id: targetProfile.id,
        to_profile_id: profile.id,
        is_like: true,
      });

      if (reverseL.length > 0) {
        const match = await base44.entities.Match.create({
          profile_a_id: profile.id,
          profile_b_id: targetProfile.id,
          status: 'active',
        });
        setMatchPopup({ match, otherProfile: targetProfile });
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        queryClient.invalidateQueries({ queryKey: ['chatList'] });
      }
    }

    setCurrentIndex((prev) => prev + 1);
  }, [profiles, currentIndex, profile, queryClient]);

  if (profileLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col safe-top relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
        </div>
        <div className="relative z-20 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold gradient-text">3Minutes</h1>
          </div>
        </div>
        <div className="relative flex-1 mx-4 mb-4">
          <DiscoverSkeleton />
        </div>
      </div>
    );
  }

  const remaining = profiles.slice(currentIndex);

  return (
    <div
      className="min-h-screen flex flex-col safe-top relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {pullRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full glass"
          >
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Обновление...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold gradient-text">3Minutes</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Online count */}
          <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-400">{onlineCount} онлайн</span>
          </div>
          <button
            onClick={() => setShowDailyPicks(true)}
            className="flex items-center gap-1.5 glass rounded-xl px-3 py-2"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-orange-400">Daily</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="relative flex-1 mx-4 mb-4">
        {remaining.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-5">
            {/* floating heart */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full blur-2xl opacity-50"
                style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent 70%)' }} />
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <Heart className="w-12 h-12 text-primary" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Пока никого нет</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ты просмотрел всех поблизости.<br />Загляни позже — новые люди появятся скоро!
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, hsl(270,80%,60%), hsl(330,85%,60%))' }}
            >
              <RefreshCw className="w-4 h-4" />
              Обновить рекомендации
            </motion.button>
          </div>
        ) : (
          <motion.div
            className="relative h-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {remaining.slice(0, 3).reverse().map((p, i, arr) => (
              <SwipeCard
                key={p.id}
                profile={p}
                isTop={i === arr.length - 1}
                onSwipe={handleSwipe}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Action buttons */}
      {remaining.length > 0 && (
        <div className="relative z-20 flex items-center justify-center gap-4 pb-24 px-6">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full glass flex items-center justify-center"
          >
            <X className="w-7 h-7 text-red-400" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe('right')}
            className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center neon-glow-pink"
          >
            <Heart className="w-9 h-9 text-white" fill="white" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSwipe('super')}
            className="w-16 h-16 rounded-full glass flex items-center justify-center"
          >
            <Star className="w-7 h-7 text-yellow-400" fill="currentColor" />
          </motion.button>
        </div>
      )}

      {/* Match Popup */}
      <AnimatePresence>
        {matchPopup && (
          <MatchPopup
            match={matchPopup.match}
            otherProfile={matchPopup.otherProfile}
            myProfile={profile}
            onClose={() => setMatchPopup(null)}
          />
        )}
      </AnimatePresence>

      {/* Daily Picks */}
      <AnimatePresence>
        {showDailyPicks && (
          <DailyPicks profiles={profiles} onClose={() => setShowDailyPicks(false)} onSwipe={(p, dir) => {
            const idx = profiles.findIndex(x => x.id === p.id);
            if (idx !== -1) {
              setCurrentIndex(idx);
              setTimeout(() => handleSwipe(dir), 100);
            }
            setShowDailyPicks(false);
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}