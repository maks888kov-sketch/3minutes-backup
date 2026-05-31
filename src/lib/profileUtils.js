import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isProfileOnline(profile) {
  if (!profile) return false;
  if (profile.is_online) return true;
  if (!profile.last_seen) return false;
  return Date.now() - new Date(profile.last_seen).getTime() < ONLINE_WINDOW_MS;
}

export function formatChatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Вчера';
  return format(date, 'd MMM', { locale: ru });
}

export function getOtherProfileId(match, myProfileId) {
  if (!match || !myProfileId) return null;
  return match.profile_a_id === myProfileId ? match.profile_b_id : match.profile_a_id;
}

export function getUnreadCount(match, myProfileId) {
  if (!match || !myProfileId) return 0;
  return match.profile_a_id === myProfileId
    ? match.unread_count_a || 0
    : match.unread_count_b || 0;
}

/** Единый список целей — в profile-setup и в настройках профиля */
export const PROFILE_GOALS = [
  { value: 'relationship', emoji: '❤️', label: 'Отношения', desc: 'Ищу серьёзные отношения' },
  { value: 'friendship', emoji: '🤝', label: 'Дружба', desc: 'Хочу найти друзей' },
  { value: 'networking', emoji: '💼', label: 'Нетворкинг', desc: 'Полезные знакомства' },
  { value: 'chat', emoji: '💬', label: 'Общение', desc: 'Просто пообщаться' },
];

export function getGoalDisplay(goal) {
  return PROFILE_GOALS.find((g) => g.value === goal) || PROFILE_GOALS[3];
}

export function sharedInterestsCount(a, b) {
  if (!a?.length || !b?.length) return 0;
  const setB = new Set(b);
  return a.filter((tag) => setB.has(tag)).length;
}
