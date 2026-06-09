/* b44-full-sync 2026-06-01 */
import { isTestBotMatchId } from '@/lib/testBots';
import { isSelfMirrorMatchId } from '@/lib/selfMirrorStore';

/** Локальный тест-чат (боты или «зеркало» с собой) */
export function isLocalMatch(matchOrId) {
  const id = typeof matchOrId === 'string' ? matchOrId : matchOrId?.id;
  return isTestBotMatchId(id) || isSelfMirrorMatchId(id);
}

/** @deprecated используй isLocalMatch */
export function isTestMatch(matchOrId) {
  return isLocalMatch(matchOrId);
}

/** Первое видео-знакомство — 3 минуты */
export const INTRO_VIDEO_DURATION_SEC = 180;

/** Фото и голосовые — только после видео-встречи, если оба выбрали «продолжить» */
export function isMediaUnlocked(match) {
  if (!match) return false;
  if (match.status === 'video_unlocked') return true;
  return match.video_result_a === 'continue' && match.video_result_b === 'continue';
}

/** Повторные видеозвонки без лимита — после взаимного «продолжить общение» */
export function isUnlimitedVideoCall(match) {
  return isMediaUnlocked(match);
}

export function getVideoConsent(match, profileId) {
  if (!match || !profileId) return false;
  return match.profile_a_id === profileId ? !!match.video_consent_a : !!match.video_consent_b;
}

export function isVideoReady(match) {
  return !!(match?.video_consent_a && match?.video_consent_b);
}

/** Собеседник уже согласился на видео, а я ещё нет */
export function needsMyVideoConsent(match, profileId) {
  if (!match || !profileId || match.status === 'ended' || match.status === 'blocked') {
    return false;
  }
  if (isVideoReady(match)) return false;
  const isA = match.profile_a_id === profileId;
  const myConsent = isA ? match.video_consent_a : match.video_consent_b;
  const theirConsent = isA ? match.video_consent_b : match.video_consent_a;
  return !!theirConsent && !myConsent;
}
