/* b44-full-sync 2026-06-01 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Briefcase, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { isProfileOnline, displayInterest, getGoalDisplay } from '@/lib/profileUtils';
import { isTestBotId } from '@/lib/testBots';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=900&fit=crop';

const LOOKING_FOR_LABELS = {
  male: 'Мужчин',
  female: 'Женщин',
  everyone: 'Всех',
};

export default function ChatProfileSheet({ open, onClose, profile }) {
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!open || !profile) return null;

  const photos = profile.photos?.length > 0 ? profile.photos : [FALLBACK_PHOTO];
  const currentPhoto = photos[photoIndex] || FALLBACK_PHOTO;
  const online = isProfileOnline(profile);
  const goal = getGoalDisplay(profile.goal);
  const interests = profile.interests || [];

  const prevPhoto = () => setPhotoIndex((i) => Math.max(0, i - 1));
  const nextPhoto = () => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70]"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-lg max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl glass-strong"
      >
        <div className="flex flex-shrink-0 items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Профиль</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 glass" aria-label="Закрыть">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          <div className="relative mx-4 aspect-[3/4] max-h-[min(52vh,420px)] overflow-hidden rounded-2xl bg-[#14111c]">
            <img
              src={currentPhoto}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-105 object-cover blur-xl opacity-50"
              referrerPolicy="no-referrer"
            />
            <img
              src={currentPhoto}
              alt={profile.name}
              className="relative z-[1] h-full w-full object-contain object-center"
              referrerPolicy="no-referrer"
            />

            {photos.length > 1 && (
              <>
                <div className="absolute left-0 right-0 top-3 z-20 flex justify-center gap-1 px-4">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/30'}`}
                    />
                  ))}
                </div>
                {photoIndex > 0 && (
                  <button
                    type="button"
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 glass"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                )}
                {photoIndex < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-2 glass"
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                )}
              </>
            )}

            <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
              {online && (
                <span className="rounded-full px-3 py-1 text-xs font-medium text-white glass">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
                  Онлайн
                </span>
              )}
              {isTestBotId(profile.id) && (
                <span className="rounded-full border border-primary/30 px-2.5 py-1 text-[10px] font-bold text-primary glass">
                  TEST BOT
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 px-5 pt-5">
            <div>
              <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="text-2xl font-bold">{profile.name}</h3>
                {profile.age != null && (
                  <span className="text-xl text-muted-foreground">{profile.age}</span>
                )}
                {profile.is_verified && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {online ? 'Сейчас в сети' : 'Был(а) недавно'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {profile.city && (
                <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 glass">
                  <MapPin className="h-4 w-4 text-primary" />
                  {profile.city}
                </span>
              )}
              {profile.goal && (
                <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 glass">
                  <Briefcase className="h-4 w-4 text-primary" />
                  {goal.emoji} {goal.label}
                </span>
              )}
            </div>

            {profile.bio && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  О себе
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">{profile.bio}</p>
              </div>
            )}

            {interests.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Интересы
                </p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((tag) => {
                    const { emoji, label } = displayInterest(tag);
                    return (
                      <span key={tag} className="rounded-full px-3 py-1.5 text-xs glass">
                        {emoji} {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {(profile.gender || profile.looking_for) && (
              <div className="rounded-2xl p-4 glass text-sm text-muted-foreground">
                {profile.gender && (
                  <p>
                    Пол:{' '}
                    <span className="text-foreground">
                      {profile.gender === 'male' ? 'Мужской' : profile.gender === 'female' ? 'Женский' : 'Другой'}
                    </span>
                  </p>
                )}
                {profile.looking_for && (
                  <p className={profile.gender ? 'mt-1' : ''}>
                    Ищет:{' '}
                    <span className="text-foreground">
                      {LOOKING_FOR_LABELS[profile.looking_for] || profile.looking_for}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
