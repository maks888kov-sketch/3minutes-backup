/* b44-full-sync 2026-06-01 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isProfileOnline } from '@/lib/profileUtils';
import { isTestBotId } from '@/lib/testBots';
import { isSelfMirrorProfileId } from '@/lib/selfMirrorStore';
import { buildPhotoSlides } from '@/lib/profilePhotoSlides';

const MAX_TAGS = 2;

export default function ProfilePhotoCard({
  profile,
  photoIndex,
  onPhotoIndexChange,
  enablePhotoNav = true,
  showOnlineBadge = true,
  rounded = true,
  className = '',
  extraBottomPadding = false,
  infoPlacement = 'mosdate',
  children,
}) {
  const slides = useMemo(() => buildPhotoSlides(profile), [profile]);
  const slide = slides[photoIndex] || slides[0];
  const online = isProfileOnline(profile);
  const mosdate = infoPlacement === 'mosdate' || infoPlacement === 'overlay';

  const prevPhoto = (e) => {
    e?.stopPropagation?.();
    if (photoIndex > 0) onPhotoIndexChange(photoIndex - 1);
  };

  const nextPhoto = (e) => {
    e?.stopPropagation?.();
    if (photoIndex < slides.length - 1) onPhotoIndexChange(photoIndex + 1);
  };

  const showName = slide?.showName !== false && (photoIndex === 0 || slide?.showName);
  const tags = (slide?.tags || []).slice(0, MAX_TAGS);
  const moreCount = slide?.moreTagsCount || 0;
  const textContentClass = extraBottomPadding
    ? 'card-text-content card-text-content--with-actions pt-6'
    : 'card-text-content pt-8';

  return (
    <div
      className={`card-photo-container relative h-full w-full overflow-hidden bg-black ${rounded ? 'rounded-3xl' : ''} ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={slide?.url}
          src={slide?.url}
          alt={profile?.name || ''}
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
          referrerPolicy="no-referrer"
          initial={{ opacity: 0.9, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.9 }}
          transition={{ duration: 0.2 }}
          draggable={false}
        />
      </AnimatePresence>

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
            className="absolute left-0 top-0 z-10 h-[70%] w-[36%]"
          />
          <button
            type="button"
            aria-label="Следующее фото"
            onClick={nextPhoto}
            className="absolute right-0 top-0 z-10 h-[70%] w-[36%]"
          />
        </>
      )}

      {showOnlineBadge && online && (
        <div className="pointer-events-none absolute right-3 top-9 z-20">
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            Онлайн
          </span>
        </div>
      )}

      {showOnlineBadge && isSelfMirrorProfileId(profile?.id) && (
        <div className="pointer-events-none absolute left-3 top-9 z-20">
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold text-primary/90">
            🔁 ТЫ
          </span>
        </div>
      )}

      {showOnlineBadge && isTestBotId(profile?.id) && (
        <div className="pointer-events-none absolute left-3 top-9 z-20">
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold text-primary/90">
            TEST
          </span>
        </div>
      )}

      {mosdate && (
        <div className={textContentClass}>
          <AnimatePresence mode="wait">
            <motion.div
              key={photoIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {showName && (
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-[1.35rem] font-bold leading-tight text-white drop-shadow-md">
                    {profile.name}
                    {profile.age != null && `, ${profile.age}`}
                  </h3>
                  {profile.is_verified && (
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                      ✓
                    </span>
                  )}
                </div>
              )}

              {(tags.length > 0 || moreCount > 0) && (
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <span
                      key={`${tag.label}-${i}`}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-black/85"
                    >
                      <span>{tag.emoji}</span>
                      <span>{tag.label}</span>
                    </span>
                  ))}
                  {moreCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-white/85 px-2 py-1 text-[11px] font-medium text-black/70">
                      +{moreCount}
                    </span>
                  )}
                </div>
              )}

              {slide?.text && (
                <p className="text-[13px] leading-snug text-white/90 line-clamp-1 drop-shadow-sm">
                  {slide.text}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {children}
    </div>
  );
}
