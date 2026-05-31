import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { MapPin, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
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
      <motion.div style={{ boxShadow: cardGlow }} className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden bg-secondary">
        <img
          src={currentPhoto}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          onError={handlePhotoError}
        />

        {photos.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4 z-20 pointer-events-none">
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
              className="absolute left-0 top-0 bottom-24 w-1/4 z-10"
            />
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={nextPhoto}
              className="absolute right-0 top-0 bottom-24 w-1/4 z-10"
            />
          </>
        )}

        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-20 left-6 border-4 border-green-400 rounded-2xl px-4 py-2 -rotate-12 pointer-events-none z-20"
        >
          <span className="text-green-400 text-3xl font-black tracking-wider">LIKE</span>
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-20 right-6 border-4 border-red-400 rounded-2xl px-4 py-2 rotate-12 pointer-events-none z-20"
        >
          <span className="text-red-400 text-3xl font-black tracking-wider">NOPE</span>
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10 pointer-events-none" />

        {online && (
          <div className="absolute top-6 right-6 flex items-center gap-1.5 glass rounded-full px-3 py-1.5 z-20 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/90 font-medium">Онлайн</span>
          </div>
        )}
        {isTestBotId(profile.id) && (
          <div className="absolute top-6 left-6 glass rounded-full px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/30 z-20 pointer-events-none">
            TEST BOT
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
          <div className="flex items-end justify-between pointer-events-auto">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-3xl font-bold text-white">{profile.name}</h3>
                {profile.age != null && (
                  <span className="text-2xl text-white/70">{profile.age}</span>
                )}
                {profile.is_verified && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              {profile.city && (
                <div className="flex items-center gap-1 text-white/70 mb-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{profile.city}</span>
                </div>
              )}
              {!expanded && profile.bio && (
                <p className="text-white/80 text-sm line-clamp-2">{profile.bio}</p>
              )}
              {!expanded && profile.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.interests.slice(0, 4).map((tag) => {
                    const { emoji, label } = displayInterest(tag);
                    return (
                      <span key={tag} className="glass rounded-full px-2.5 py-1 text-xs text-white/90">
                        {emoji} {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="glass rounded-full p-2 ml-3 flex-shrink-0"
            >
              {expanded ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white" />}
            </button>
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-3 pointer-events-auto"
            >
              {profile.bio && <p className="text-white/85 text-sm">{profile.bio}</p>}
              {profile.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((tag) => {
                    const { emoji, label } = displayInterest(tag);
                    return (
                      <span key={tag} className="glass rounded-full px-3 py-1 text-xs text-white/90">
                        {emoji} {label}
                      </span>
                    );
                  })}
                </div>
              )}
              {profile.goal && (
                <div className="glass rounded-xl px-3 py-2 inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-white/90">
                    {goal.emoji} {goal.label}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
