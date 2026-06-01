/* b44-full-sync 2026-06-01 */
import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { MapPin, Briefcase, ChevronDown } from 'lucide-react';
import { isProfileOnline, displayInterest, getGoalDisplay } from '@/lib/profileUtils';
import { isTestBotId } from '@/lib/testBots';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=900&fit=crop';

export default function SwipeCard({ profile, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoSrc, setPhotoSrc] = useState(null);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      animate(x, 500, { duration: 0.3 });
      setTimeout(() => onSwipe('right'), 300);
    } else if (info.offset.x < -100) {
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => onSwipe('left'), 300);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
    }
  };

  const photos = profile.photos?.length > 0 ? profile.photos : [FALLBACK_PHOTO];
  const currentPhoto = photoSrc || photos[photoIndex] || FALLBACK_PHOTO;
  const online = isProfileOnline(profile);
  const goal = getGoalDisplay(profile.goal);
  const interests = profile.interests || [];
  const visibleInterests = expanded ? interests : interests.slice(0, 3);

  const cardGlow = useTransform(x, [-120, 0, 120], [
    '0 0 50px rgba(239,68,68,0.4)',
    '0 20px 60px rgba(0,0,0,0.5)',
    '0 0 50px rgba(34,197,94,0.4)',
  ]);

  const handlePhotoError = () => {
    setPhotoSrc(FALLBACK_PHOTO);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoSrc(null);
    setPhotoIndex((i) => Math.max(0, i - 1));
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoSrc(null);
    setPhotoIndex((i) => Math.min(photos.length - 1, i + 1));
  };

  return (
    <motion.div
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
    >
      <motion.div
        style={{ boxShadow: cardGlow }}
        className="relative h-full w-full overflow-hidden rounded-3xl bg-secondary"
      >
        <img
          src={currentPhoto}
          alt={profile.name}
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
          onError={handlePhotoError}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10" />

        {photos.length > 1 && (
          <div className="pointer-events-none absolute left-0 right-0 top-3 z-20 flex justify-center gap-1 px-4">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i === photoIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {photos.length > 1 && isTop && (
          <>
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={prevPhoto}
              className="absolute bottom-28 left-0 top-12 z-10 w-1/3"
            />
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={nextPhoto}
              className="absolute bottom-28 right-0 top-12 z-10 w-1/3"
            />
          </>
        )}

        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-6 top-16 z-20 -rotate-12 rounded-2xl border-4 border-green-400 px-4 py-2"
        >
          <span className="text-3xl font-black tracking-wider text-green-400">LIKE</span>
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="pointer-events-none absolute right-6 top-16 z-20 rotate-12 rounded-2xl border-4 border-red-400 px-4 py-2"
        >
          <span className="text-3xl font-black tracking-wider text-red-400">NOPE</span>
        </motion.div>

        <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
          {online && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 glass">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs font-medium text-white/90">Онлайн</span>
            </div>
          )}
          {isTestBotId(profile.id) && (
            <div className="rounded-full border border-primary/30 px-2.5 py-1 text-[10px] font-bold text-primary glass">
              TEST BOT
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[52%] flex-col justify-end">
          <div className="pointer-events-auto px-5 pb-5 pt-10">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 className="truncate text-[1.75rem] font-bold leading-tight text-white">
                    {profile.name}
                  </h3>
                  {profile.age != null && (
                    <span className="text-xl text-white/75">{profile.age}</span>
                  )}
                  {profile.is_verified && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                      ✓
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
                  {profile.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {profile.city}
                    </span>
                  )}
                  {profile.goal && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      {goal.emoji} {goal.label}
                    </span>
                  )}
                </div>
              </div>

              {(profile.bio || interests.length > 3) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((value) => !value);
                  }}
                  className="flex-shrink-0 rounded-full p-2 glass"
                  aria-label={expanded ? 'Свернуть профиль' : 'Развернуть профиль'}
                >
                  <ChevronDown
                    className={`h-5 w-5 text-white transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>

            <div className={`space-y-3 ${expanded ? 'max-h-[28vh] overflow-y-auto pr-1' : ''}`}>
              {profile.bio && (
                <p className={`text-sm leading-relaxed text-white/85 ${expanded ? '' : 'line-clamp-2'}`}>
                  {profile.bio}
                </p>
              )}

              {visibleInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {visibleInterests.map((tag) => {
                    const { emoji, label } = displayInterest(tag);
                    return (
                      <span
                        key={tag}
                        className="rounded-full px-2.5 py-1 text-xs text-white/90 glass"
                      >
                        {emoji} {label}
                      </span>
                    );
                  })}
                  {!expanded && interests.length > 3 && (
                    <span className="rounded-full px-2.5 py-1 text-xs text-white/70 glass">
                      +{interests.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
