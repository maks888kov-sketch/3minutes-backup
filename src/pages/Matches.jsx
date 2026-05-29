import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useCurrentProfile, useMatches, useLikedMe } from '@/lib/useProfile';
import { Heart, MessageCircle, Crown, Loader2, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Matches() {
  const navigate = useNavigate();
  const { data: profile } = useCurrentProfile();
  const { data: matches = [], isLoading } = useMatches(profile?.id);
  const { data: likedMe = [] } = useLikedMe(profile?.id);
  const [matchProfiles, setMatchProfiles] = useState({});

  useEffect(() => {
    if (!matches.length || !profile) return;
    const ids = matches.map(m =>
      m.profile_a_id === profile.id ? m.profile_b_id : m.profile_a_id
    );
    const uniqueIds = [...new Set(ids)];
    Promise.all(
      uniqueIds.map(id => base44.entities.Profile.filter({ id }).then(ps => [id, ps[0]]))
    ).then(pairs => {
      const loaded = {};
      pairs.forEach(([id, p]) => { if (p) loaded[id] = p; });
      setMatchProfiles(loaded);
    });
  }, [matches, profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const empty = matches.length === 0 && likedMe.length === 0;

  return (
    <div className="min-h-screen pb-24 safe-top">
      <div className="px-5 pt-5 pb-2">
        <h1 className="text-2xl font-bold">Пары</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Взаимные симпатии</p>
      </div>

      {/* Liked me — premium teaser */}
      {likedMe.length > 0 && (
        <div className="px-5 mb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/premium')}
            className="w-full glass-strong rounded-2xl p-4 flex items-center gap-4 neon-glow"
          >
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Heart className="w-7 h-7 text-white" fill="white" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">
                {likedMe.length} {likedMe.length === 1 ? 'человек лайкнул' : 'человека лайкнули'} тебя
              </div>
              <div className="text-sm text-muted-foreground">Открой Premium, чтобы узнать кто</div>
            </div>
            <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          </motion.button>
        </div>
      )}

      {empty ? (
        <div className="text-center py-20 px-8">
          <div className="w-20 h-20 rounded-full glass flex items-center justify-center mx-auto mb-5">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-xl mb-2">Пока пусто</h3>
          <p className="text-muted-foreground text-sm mb-6">Ставь лайки — пары появятся здесь</p>
          <Button onClick={() => navigate('/discover')} className="gradient-primary border-0 rounded-xl neon-glow">
            <Sparkles className="w-4 h-4 mr-2" />
            Искать людей
          </Button>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {matches.map((match) => {
            const otherId = match.profile_a_id === profile?.id ? match.profile_b_id : match.profile_a_id;
            const other = matchProfiles[otherId];
            if (!other) return (
              <div key={match.id} className="h-24 glass rounded-2xl animate-pulse" />
            );
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${other.is_online ? 'border-green-500' : 'border-white/10'}`}>
                    <img
                      src={other.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}
                      alt={other.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {other.is_online && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                  {other.is_premium && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                      <Crown className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold truncate">{other.name}</h3>
                    <span className="text-muted-foreground text-sm">{other.age}</span>
                    {other.is_verified && <Star className="w-3.5 h-3.5 text-blue-400" fill="currentColor" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {other.is_online ? '🟢 Онлайн' : other.city || 'Не указан город'}
                  </p>
                  {other.bio && (
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{other.bio}</p>
                  )}
                </div>
                <Button
                  onClick={() => navigate(`/chat/${match.id}`)}
                  size="sm"
                  className="gradient-primary border-0 rounded-xl text-xs px-3 flex-shrink-0 neon-glow"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />
                  Чат
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}