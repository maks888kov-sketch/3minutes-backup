/* b44-full-sync 2026-06-01 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isProfileOnline } from '@/lib/profileUtils';
import { isTestBotId } from '@/lib/testBots';
import { buildPhotoSlides } from '@/lib/profilePhotoSlides';

export default function ProfilePhotoCard({
  profile,
  photoIndex,
  onPhotoIndexChange,
  enablePhotoNav = true,
  showOnlineBadge = true,
  rounded = true,
  className = '',
  extraBottomPadding = false,
  children,
}) {
  const slides = useMemo(() => buildPhotoSlides(profile), [profile]);
  const slide = slides[photoIndex] || slides[0];
  const online = isProfileOnline(profile);

  const prevPhoto = (e) => {
    e?.stopPropagation?.();
    if (photoIndex > 0) onPhotoIndexChange(photoIndex - 1);
  };

  const nextPhoto = (e) => {
    e?.stopPropagation?.();
    if (photoIndex < slides.length - 1) onPhotoIndexChange(photoIndex + 1);
  };

  const showName = slide?.showName !== false && (photoIndex === 0 || slide?.showName);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-black ${rounded ? 'rounded-3xl' : ''} ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={slide?.url}
          src={slide?.url}
          alt={profile?.name || ''}
          className="absolute inset-0 h-full w-full object-cover object-[50%_12%]"
          referrerPolicy="no-referrer"
          initial={{ opacity: 0.85, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.85, scale: 1.01 }}
          transition={{ duration: 0.22 }}
          draggable={false}
        />
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[38%] bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {slides.length > 1 && (
        <div className="pointer-events-none absolute left-0 right-0 top-3 z-20 flex gap-1 px-3">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-all duration-200 ${
                i === photoIndex ? 'bg-white' : 'bg-white/35'
              }`}
            />
          ))}
        </div>
      )}

      {enablePhotoNav && slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Предыдущее фото"
            onClick={prevPhoto}
            className="absolute left-0 top-0 z-10 h-[72%] w-[38%]"
          />
          <button
            type="button"
            aria-label="Следующее фото"
            onClick={nextPhoto}
            className="absolute right-0 top-0 z-10 h-[72%] w-[38%]"
          />
        </>
      )}

      {showOnlineBadge && (
        <div className="pointer-events-none absolute right-3 top-8 z-20 flex flex-col items-end gap-2">
          {online && (
            <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
              Онлайн
            </span>
          )}
          {isTestBotId(profile?.id) && (
            <span className="rounded-full border border-primary/40 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-primary backdrop-blur-md">
              TEST BOT
            </span>
          )}
        </div>
      )}

      <div className={`absolute inset-x-0 bottom-0 z-20 px-5 pt-16 ${extraBottomPadding ? 'pb-28' : 'pb-6'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={photoIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {showName && (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="text-[1.65rem] font-bold leading-tight text-white drop-shadow-lg">
                  {profile.name}
                  {profile.age != null && (
                    <span className="font-semibold text-white/90">, {profile.age}</span>
                  )}
                </h3>
                {profile.is_verified && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white shadow-md">
                    ✓
                  </span>
                )}
              </div>
            )}

            {slide?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {slide.tags.map((tag, i) => (
                  <span
                    key={`${tag.label}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1.5 text-xs font-medium text-black/85 shadow-sm"
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </span>
                ))}
                {photoIndex === 0 && slides.length > 1 && (
                  <span className="inline-flex items-center rounded-full bg-white/75 px-2.5 py-1.5 text-xs font-medium text-black/70">
                    +{Math.max(0, slides.length - 1)}
                  </span>
                )}
              </div>
            )}

            {slide?.text && (
              <p className="text-sm leading-relaxed text-white/90 drop-shadow-md line-clamp-3">
                {slide.text}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {children}
    </div>
  );
}
