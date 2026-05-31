import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentProfile, useChatList, useMatches } from '@/lib/useProfile';
import { formatChatTime, isProfileOnline } from '@/lib/profileUtils';
import { getMergedBlockedIds } from '@/lib/moderation';

export default function Chats() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: profile } = useCurrentProfile();
  const blockedIds = getMergedBlockedIds(profile);
  const { data: chats = [], isLoading, isError, refetch } = useChatList(profile?.id, blockedIds);
  const { data: matches = [] } = useMatches(profile?.id, blockedIds);

  const filtered = chats.filter(({ other, match }) => {
    if (!match?.id) return false;
    if (!search.trim()) return true;
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-28">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 safe-top">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-bold">Чаты</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Активные переписки</p>
      </div>

      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени..."
            className="w-full h-11 bg-secondary rounded-xl pl-10 pr-4 text-sm border-0 outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-24 h-24 mx-auto mb-6"
          >
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8), transparent 70%)' }}
            />
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}
            >
              <MessageCircle className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
          <h3 className="font-bold text-xl mb-2">
            {search.trim() ? 'Никого не найдено' : 'Пока нет чатов'}
          </h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {search.trim()
              ? 'Попробуйте другое имя'
              : matches.length > 0
                ? `У вас ${matches.length} ${matches.length === 1 ? 'пара' : 'пары'} — откройте переписку из раздела «Пары»`
                : 'Поставьте лайк — при взаимной симпатии здесь появится переписка'}
          </p>
          {isError && (
            <p className="text-destructive text-sm mb-4">Не удалось загрузить чаты. Проверьте интернет.</p>
          )}
          {!search.trim() && (
            <div className="flex flex-col gap-2 items-center">
              {matches.length > 0 ? (
                <Button
                  onClick={() => navigate('/matches')}
                  className="gradient-primary border-0 rounded-xl neon-glow"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Открыть пары
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/discover')}
                  className="gradient-primary border-0 rounded-xl neon-glow"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Искать людей
                </Button>
              )}
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Обновить список
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-0.5 px-3">
          {filtered.map(({ match, other, unread, lastMessage, lastTime }, i) => {
            const online = other ? isProfileOnline(other) : false;
            const photo =
              other?.photos?.[0] ||
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop';
            const displayName = other?.name || 'Пользователь';
            const displayAge = other?.age ? `, ${other.age}` : '';

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/chat/${match.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden">
                      <img src={photo} alt={other.name} className="w-full h-full object-cover" />
                    </div>
                    {online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`font-semibold truncate ${unread > 0 ? 'text-foreground' : ''}`}>
                        {displayName}{displayAge}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatChatTime(lastTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate ${
                          unread > 0 ? 'text-foreground/80 font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {lastMessage}
                      </p>
                      {unread > 0 && (
                        <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
