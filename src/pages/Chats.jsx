import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Search } from 'lucide-react';
import { MOCK_PROFILES, MOCK_CHAT_LIST } from '@/lib/mockChats';

export default function Chats() {
  const [search, setSearch] = useState('');

  const chats = MOCK_CHAT_LIST
    .map(chat => ({ ...chat, profile: MOCK_PROFILES.find(p => p.id === chat.profileId) }))
    .filter(chat => {
      if (!search) return true;
      return chat.profile?.name?.toLowerCase().includes(search.toLowerCase());
    });

  return (
    <div className="min-h-screen pb-28 safe-top">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-bold">Чаты</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Активные переписки</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full h-11 bg-secondary rounded-xl pl-10 pr-4 text-sm border-0 outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Chat list */}
      {chats.length === 0 ? (
        <div className="text-center py-16 px-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-24 h-24 mx-auto mb-6"
          >
            <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8), transparent 70%)' }} />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <MessageCircle className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
          <h3 className="font-bold text-xl mb-2">Ничего не найдено</h3>
        </div>
      ) : (
        <div className="space-y-0.5 px-3">
          {chats.map((chat, i) => {
            const { profile } = chat;
            if (!profile) return null;
            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/mock-chat/${chat.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden">
                      <img
                        src={profile.photos?.[0]}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {profile.is_online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`font-semibold truncate ${chat.unread > 0 ? 'text-foreground' : ''}`}>
                        {profile.name}, {profile.age}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {chat.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${chat.unread > 0 ? 'text-foreground/80 font-medium' : 'text-muted-foreground'}`}>
                        {chat.lastMessage}
                      </p>
                      {chat.unread > 0 && (
                        <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white">
                          {chat.unread}
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