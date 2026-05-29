import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { MapPin, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';

const INTEREST_ICONS = {
  'Музыка': '🎵', 'Игры': '🎮', 'Спорт': '🏋️', 'Путешествия': '✈️',
  'Кино': '🎬', 'Книги': '📚', 'Готовка': '🍳', 'Арт': '🎨',
  'Йога': '🧘', 'Фото': '📷', 'Танцы': '💃', 'Природа': '🌿',
};

export default function SwipeCard({ profile, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

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

  const photos = profile.photos?.length > 0 ? profile.photos : [
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop`
  ];

  const likeGlow = useTransform(x, [0, 120], ['0px 0px 0px rgba(34,197,94,0)', '0px 0px 50px rgba(34,197,94,0.5)']);
  const nopeGlow = useTransform(x, [-120, 0], ['0px 0px 50px rgba(239,68,68,0.5)', '0px 0px 0px rgba(239,68,68,0)']);
  const cardGlow = useTransform(x, [-120, 0, 120], [
    '0 0 50px rgba(239,68,68,0.4)',
    '0 20px 60px rgba(0,0,0,0.5)',
    '0 0 50px rgba(34,197,94,0.4)'
  ]);

  return (
    <motion.div
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <motion.div style={{ boxShadow: cardGlow }} className="relative w-full h-full rounded-3xl overflow-hidden">
        {/* Photo */}
        <img
          src={photos[photoIndex]}
          alt={profile.name}
          className="w-full h-full object-cover"
        />

        {/* Photo pagination dots */}
        {photos.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all ${
                  i === photoIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo tap areas */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full" onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))} />
          <div className="w-1/2 h-full" onClick={() => setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1))} />
        </div>

        {/* LIKE / NOPE stamps */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-20 left-6 border-4 border-green-400 rounded-2xl px-4 py-2 -rotate-12"
          style={{ opacity: likeOpacity, borderColor: '#4ade80', boxShadow: '0 0 20px rgba(74,222,128,0.4)' }}
        >
          <span className="text-green-400 text-3xl font-black tracking-wider">LIKE</span>
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity, borderColor: '#f87171', boxShadow: '0 0 20px rgba(248,113,113,0.4)' }}
          className="absolute top-20 right-6 border-4 rounded-2xl px-4 py-2 rotate-12"
        >
          <span className="text-red-400 text-3xl font-black tracking-wider">NOPE</span>
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Online indicator */}
        {profile.is_online && (
          <div className="absolute top-6 right-6 flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/90 font-medium">Online</span>
          </div>
        )}

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-3xl font-bold text-white">{profile.name}</h3>
                <span className="text-2xl text-white/70">{profile.age}</span>
                {profile.is_verified && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              {profile.city && (
                <div className="flex items-center gap-1 text-white/60 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.city}</span>
                </div>
              )}
              {!expanded && profile.bio && (
                <p className="text-white/70 text-sm line-clamp-2">{profile.bio}</p>
              )}
              {!expanded && profile.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.interests.slice(0, 3).map((tag) => (
                    <span key={tag} className="glass rounded-full px-2.5 py-1 text-xs text-white/80">
                      {INTEREST_ICONS[tag] || '✨'} {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="glass rounded-full p-2 ml-3"
            >
              {expanded ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white" />}
            </button>
          </div>

          {/* Expanded info */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-3"
            >
              {profile.bio && <p className="text-white/80 text-sm">{profile.bio}</p>}
              {profile.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((tag) => (
                    <span key={tag} className="glass rounded-full px-3 py-1 text-xs text-white/80">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {profile.goal && (
                <div className="glass rounded-xl px-3 py-2 inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-white/80">
                    {profile.goal === 'relationship' ? 'Отношения' :
                     profile.goal === 'friendship' ? 'Дружба' :
                     profile.goal === 'networking' ? 'Нетворкинг' : 'Общение'}
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