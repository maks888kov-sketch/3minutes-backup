import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { showNotification } from '@/components/AppNotifications';
import { useCurrentProfile, useMessages } from '@/lib/useProfile';
import { isProfileOnline } from '@/lib/profileUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Send, Video, Image, Mic,
  CheckCheck, Loader2, Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { data: myProfile } = useCurrentProfile();
  const { data: messages = [], isLoading: msgsLoading } = useMessages(matchId);
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const unreadClearedRef = useRef(false);

  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const matches = await base44.entities.Match.filter({ id: matchId });
      return matches[0] || null;
    },
    enabled: !!matchId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!match || !myProfile) return;
    const otherId = match.profile_a_id === myProfile.id ? match.profile_b_id : match.profile_a_id;
    base44.entities.Profile.filter({ id: otherId }).then((ps) => {
      if (ps[0]) setOtherProfile(ps[0]);
    });
  }, [match, myProfile]);

  useEffect(() => {
    if (!match || !myProfile || unreadClearedRef.current) return;
    const isA = match.profile_a_id === myProfile.id;
    const myUnread = isA ? match.unread_count_a : match.unread_count_b;
    if (!myUnread) return;

    unreadClearedRef.current = true;
    base44.entities.Match.update(match.id, {
      [isA ? 'unread_count_a' : 'unread_count_b']: 0,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    });
  }, [match, myProfile, matchId, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !myProfile || sending) return;
    setSending(true);
    const msg = text.trim();
    setText('');
    await base44.entities.Message.create({
      match_id: matchId,
      sender_profile_id: myProfile.id,
      type: 'text',
      content: msg,
    });
    if (match) {
      const isA = match.profile_a_id === myProfile.id;
      const otherUnread = isA ? match.unread_count_b || 0 : match.unread_count_a || 0;
      await base44.entities.Match.update(match.id, {
        last_message_text: msg,
        last_message_time: new Date().toISOString(),
        [isA ? 'unread_count_b' : 'unread_count_a']: otherUnread + 1,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    queryClient.invalidateQueries({ queryKey: ['chatList'] });
    setSending(false);
  };

  const sendPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !myProfile) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Message.create({
      match_id: matchId,
      sender_profile_id: myProfile.id,
      type: 'photo',
      content: file_url,
    });
    if (match) {
      const isA = match.profile_a_id === myProfile.id;
      const otherUnread = isA ? match.unread_count_b || 0 : match.unread_count_a || 0;
      await base44.entities.Match.update(match.id, {
        last_message_text: '📷 Фото',
        last_message_time: new Date().toISOString(),
        [isA ? 'unread_count_b' : 'unread_count_a']: otherUnread + 1,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
    queryClient.invalidateQueries({ queryKey: ['chatList'] });
  };

  const handleVideoRequest = async () => {
    if (!match || !myProfile) return;
    const isA = match.profile_a_id === myProfile.id;
    await base44.entities.Match.update(match.id, {
      [isA ? 'video_consent_a' : 'video_consent_b']: true,
    });
    await base44.entities.Message.create({
      match_id: matchId,
      sender_profile_id: myProfile.id,
      type: 'system',
      content: '📹 Предложил(а) видео-встречу на 3 минуты',
    });
    queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
    queryClient.invalidateQueries({ queryKey: ['match', matchId] });
    showNotification({
      type: 'video_request',
      title: 'Запрос видео-встречи отправлен',
      body: 'Ждём, пока собеседник согласится',
    });
  };

  const prevVideoUnlocked = useRef(false);
  const videoUnlocked = match?.video_consent_a && match?.video_consent_b;
  useEffect(() => {
    if (videoUnlocked && !prevVideoUnlocked.current) {
      showNotification({ type: 'video_ready', title: 'Видео-встреча доступна! 🎉', body: 'Оба согласились — можно начинать' });
    }
    prevVideoUnlocked.current = !!videoUnlocked;
  }, [videoUnlocked]);
  const myConsent = match && myProfile && (
    match.profile_a_id === myProfile.id ? match.video_consent_a : match.video_consent_b
  );
  const theirConsent = match && myProfile && (
    match.profile_a_id === myProfile.id ? match.video_consent_b : match.video_consent_a
  );

  const otherOnline = isProfileOnline(otherProfile);
  const otherPhoto = otherProfile?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop';

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-3 py-3 safe-top flex items-center gap-3 z-10">
        <button onClick={() => navigate('/chats')} className="p-1.5">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <img src={otherPhoto} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{otherProfile?.name || '...'}</h2>
          <div className="flex items-center gap-1">
            {otherOnline && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            <span className="text-xs text-muted-foreground">
              {otherOnline ? 'онлайн' : 'был(а) недавно'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {videoUnlocked ? (
            <button
              onClick={() => navigate(`/video-call/${matchId}`)}
              className="p-2.5 rounded-xl gradient-primary neon-glow"
            >
              <Video className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={handleVideoRequest}
              disabled={myConsent}
              className={`p-2.5 rounded-xl transition-all ${
                myConsent ? 'glass text-muted-foreground' : 'glass hover:bg-primary/20 text-primary'
              }`}
            >
              <Video className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Video consent banner */}
      {theirConsent && !myConsent && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mx-4 mt-3 glass-strong rounded-2xl p-4 neon-glow"
        >
          <p className="text-sm font-medium mb-2">
            📹 {otherProfile?.name} хочет видео-встречу!
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Согласись — и вы сможете созвониться на 3 минуты
          </p>
          <Button
            onClick={handleVideoRequest}
            className="w-full gradient-primary rounded-xl border-0"
          >
            Согласиться на видео-встречу
          </Button>
        </motion.div>
      )}

      {videoUnlocked && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mx-4 mt-3 glass-strong rounded-2xl p-4 neon-glow-pink text-center"
        >
          <p className="text-sm font-medium">🎉 Видео-встреча разблокирована!</p>
          <Button
            onClick={() => navigate(`/video-call/${matchId}`)}
            className="mt-2 gradient-primary rounded-xl border-0"
          >
            <Video className="w-4 h-4 mr-2" />
            Начать 3-минутный звонок
          </Button>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Начните общение!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_profile_id === myProfile?.id;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center">
                  <span className="glass rounded-full px-4 py-1.5 text-xs text-muted-foreground inline-block">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${
                  isMine
                    ? 'gradient-primary rounded-2xl rounded-br-md'
                    : 'glass rounded-2xl rounded-bl-md'
                } px-4 py-2.5`}>
                  {msg.type === 'photo' ? (
                    <img src={msg.content} alt="" className="rounded-xl max-w-full" />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${
                    isMine ? 'text-white/60' : 'text-muted-foreground'
                  }`}>
                    <span className="text-[10px]">
                      {format(new Date(msg.created_date), 'HH:mm')}
                    </span>
                    {isMine && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <div className="glass-strong border-t border-white/5 px-3 pt-2 pb-3 safe-bottom">
        {!myConsent && !videoUnlocked && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleVideoRequest}
            className="w-full mb-2 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: 'hsl(270,80%,75%)',
            }}
          >
            <Video className="w-4 h-4" />
            Предложить видео-встречу
          </motion.button>
        )}
        {myConsent && !videoUnlocked && (
          <div className="w-full mb-2 py-2 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Clock className="w-4 h-4" />
            Запрос отправлен — ждём согласия
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="p-2.5 rounded-xl glass cursor-pointer flex-shrink-0">
            <Image className="w-5 h-5 text-muted-foreground" />
            <input type="file" accept="image/*" onChange={sendPhoto} className="hidden" />
          </label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Сообщение..."
            className="flex-1 h-11 bg-secondary border-0 rounded-xl text-sm"
          />
          {text.trim() ? (
            <button
              onClick={sendMessage}
              disabled={sending}
              className="p-2.5 rounded-xl gradient-primary neon-glow flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={() => showNotification({
                type: 'info',
                title: 'Голосовые сообщения',
                body: 'Скоро появятся в обновлении',
              })}
              className="p-2.5 rounded-xl glass flex-shrink-0"
            >
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
