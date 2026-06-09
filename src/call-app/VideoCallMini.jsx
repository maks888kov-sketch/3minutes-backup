/**
 * Мини-программа видеозвонков внутри 3Minutes.
 * Как звонок в Telegram/WhatsApp: одна комната на matchId, без своего signaling-сервера.
 * Работает по HTTPS на base44 — камера на телефоне и ноуте.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentProfile } from '@/lib/useProfile';
import { isUnlimitedVideoCall, INTRO_VIDEO_DURATION_SEC } from '@/lib/chatMatchUtils';
import { isTestBotMatchId } from '@/lib/testBots';
import { getTestBotMatch } from '@/lib/testBotStore';
import { isSelfMirrorMatchId, getSelfMirrorMatch } from '@/lib/selfMirrorStore';
import { buildJitsiEmbedUrl } from '@/call-app/buildJitsiRoomUrl';
import { X, PhoneOff, Timer } from 'lucide-react';

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoCallMini() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { data: myProfile } = useCurrentProfile();
  const [elapsed, setElapsed] = useState(0);

  const { data: match } = useQuery({
    queryKey: ['match', matchId, 'call-mini'],
    queryFn: async () => {
      if (isSelfMirrorMatchId(matchId)) return getSelfMirrorMatch(matchId);
      if (isTestBotMatchId(matchId)) return getTestBotMatch(matchId);
      const ms = await base44.entities.Match.filter({ id: matchId });
      return ms[0] || null;
    },
    enabled: !!matchId,
  });

  const unlimited = isUnlimitedVideoCall(match);
  const limitSec = unlimited ? null : INTRO_VIDEO_DURATION_SEC;
  const timeLeft = limitSec != null ? Math.max(0, limitSec - elapsed) : null;

  const leaveCall = useCallback(() => {
    navigate(matchId ? `/chat/${matchId}` : '/chats');
  }, [matchId, navigate]);

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (limitSec != null && elapsed >= limitSec) {
      leaveCall();
    }
  }, [elapsed, limitSec, leaveCall]);

  const displayName = myProfile?.name || 'Участник';
  const embedUrl = matchId ? buildJitsiEmbedUrl(matchId, displayName) : null;

  if (!matchId || !embedUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-black p-6 text-center text-white">
        <p className="text-sm text-red-300">Нет id чата для звонка</p>
        <button type="button" onClick={leaveCall} className="mt-4 text-primary underline text-sm">
          Вернуться
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#121212]">
      <div className="safe-top z-20 flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={leaveCall}
          className="flex h-10 w-10 items-center justify-center rounded-full glass"
          aria-label="Выйти из звонка"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        <div className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="tabular-nums text-sm font-semibold text-white">
            {unlimited
              ? formatTime(elapsed)
              : formatTime(timeLeft ?? 0)}
          </span>
          <span className="text-[10px] text-white/50 uppercase">
            {unlimited ? 'на связи' : 'осталось'}
          </span>
        </div>

        <div className="w-10" />
      </div>

      <p className="z-20 px-4 pb-2 text-center text-[11px] text-white/50">
        Видеозвонок · оба в одной комнате · разреши камеру и микрофон
      </p>

      <iframe
        title="Видеозвонок"
        src={embedUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="min-h-0 flex-1 w-full border-0 bg-black"
      />

      <div className="safe-bottom z-20 flex justify-center py-4">
        <button
          type="button"
          onClick={leaveCall}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg active:scale-95"
          aria-label="Завершить звонок"
        >
          <PhoneOff className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}
