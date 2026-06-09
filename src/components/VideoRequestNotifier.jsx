/* b44-full-sync 2026-06-01 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentProfile } from '@/lib/useProfile';
import { getOtherProfileId } from '@/lib/profileUtils';
import { getTestBotProfile, isTestBotId } from '@/lib/testBots';
import { isSelfMirrorMatchId } from '@/lib/selfMirrorStore';
import { isVideoReady, needsMyVideoConsent } from '@/lib/chatMatchUtils';
import { showNotification } from '@/components/AppNotifications';
import { getMergedBlockedIds } from '@/lib/moderation';
import { getTestBotMatches } from '@/lib/testBotStore';
import { getSelfMirrorMatches } from '@/lib/selfMirrorStore';
import { sortMatchesForUi } from '@/lib/matchListSort';

async function resolveOtherName(otherId, myProfile) {
  if (!otherId) return 'Собеседник';
  if (isTestBotId(otherId)) {
    return getTestBotProfile(otherId)?.name || 'Собеседник';
  }
  if (otherId === myProfile?.id) {
    return myProfile?.name || 'Ты';
  }
  try {
    const ps = await base44.entities.Profile.filter({ id: otherId });
    return ps[0]?.name || 'Собеседник';
  } catch {
    return 'Собеседник';
  }
}

/**
 * Следит за матчами и показывает уведомление, если собеседник предложил видео
 * или оба согласны — можно звонить (если пользователь не в этом чате/звонке).
 */
export default function VideoRequestNotifier() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile } = useCurrentProfile();
  const blockedIds = getMergedBlockedIds(profile);
  const consentNotifiedRef = useRef(new Set());
  const readyNotifiedRef = useRef(new Set());

  const { data: matches = [] } = useQuery({
    queryKey: ['matches', profile?.id, blockedIds.join(','), 'notify'],
    queryFn: async () => {
      if (!profile?.id) return [];
      const blockedSet = new Set(blockedIds);
      const matchesA = await base44.entities.Match.filter({ profile_a_id: profile.id });
      const matchesB = await base44.entities.Match.filter({ profile_b_id: profile.id });
      const test = getTestBotMatches(profile.id);
      const selfMatches = getSelfMirrorMatches(profile.id);
      const isActive = (m) => m.status !== 'ended' && m.status !== 'blocked';

      return sortMatchesForUi(
        [...matchesA, ...matchesB, ...test, ...selfMatches].filter((m) => {
          if (isSelfMirrorMatchId(m.id)) return false;
          const otherId = getOtherProfileId(m, profile.id);
          return isActive(m) && !blockedSet.has(otherId);
        }),
      );
    },
    enabled: !!profile?.id,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!profile?.id || !matches.length) return;

    let cancelled = false;

    (async () => {
      for (const match of matches) {
        if (cancelled || isSelfMirrorMatchId(match.id)) continue;

        const chatPath = `/chat/${match.id}`;
        const callPath = `/video-call/${match.id}`;
        const onThisMatch =
          location.pathname === chatPath || location.pathname === callPath;

        const otherId = getOtherProfileId(match, profile.id);
        const name = await resolveOtherName(otherId, profile);
        if (cancelled) return;

        if (needsMyVideoConsent(match, profile.id) && !onThisMatch) {
          if (!consentNotifiedRef.current.has(match.id)) {
            consentNotifiedRef.current.add(match.id);
            showNotification({
              type: 'video_request',
              title: `${name} хочет видео-встречу`,
              body: 'Нажми — откроется чат, можно согласиться',
              onClick: () => navigate(chatPath),
            });
          }
        } else {
          consentNotifiedRef.current.delete(match.id);
        }

        if (isVideoReady(match) && !onThisMatch) {
          if (!readyNotifiedRef.current.has(match.id)) {
            readyNotifiedRef.current.add(match.id);
            showNotification({
              type: 'video_ready',
              title: `Видео с ${name} доступно`,
              body: 'Оба согласились — нажми, чтобы открыть звонок',
              onClick: () => navigate(callPath),
            });
          }
        } else if (!isVideoReady(match)) {
          readyNotifiedRef.current.delete(match.id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [matches, profile, location.pathname, navigate]);

  return null;
}
