/* Локальный матч «с самим собой» для теста: Discover → лайк → чат */

export const SELF_MIRROR_PROFILE_PREFIX = 'self-mirror-';
export const SELF_MATCH_PREFIX = 'self-match-';

const STORAGE_KEY = '3minutes_self_mirror_v1';

export function isSelfMirrorEnabled() {
  if (import.meta.env.VITE_ENABLE_SELF_MIRROR === 'false') return false;
  if (import.meta.env.VITE_ENABLE_SELF_MIRROR === 'true') return true;
  return import.meta.env.DEV;
}

export function isSelfMirrorProfileId(id) {
  return typeof id === 'string' && id.startsWith(SELF_MIRROR_PROFILE_PREFIX);
}

export function isSelfMirrorMatchId(id) {
  return typeof id === 'string' && id.startsWith(SELF_MATCH_PREFIX);
}

export function buildSelfMatchId(profileId) {
  return `${SELF_MATCH_PREFIX}${profileId}`;
}

export function buildSelfMirrorProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    id: `${SELF_MIRROR_PROFILE_PREFIX}${profile.id}`,
    is_self_mirror: true,
  };
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getState(profileId) {
  return readAll()[profileId] || { swiped: false, match: null, messages: [] };
}

function saveState(profileId, state) {
  const all = readAll();
  all[profileId] = state;
  writeAll(all);
}

export function resetSelfMirrorState(profileId) {
  if (!profileId) return;
  const all = readAll();
  delete all[profileId];
  writeAll(all);
}

function findContext(matchId) {
  const all = readAll();
  for (const profileId of Object.keys(all)) {
    const state = all[profileId];
    if (state.match?.id === matchId) {
      return { profileId, state };
    }
  }
  return null;
}

export function getSelfMirrorDiscoverProfile(profile) {
  if (!isSelfMirrorEnabled() || !profile?.id) return null;
  const state = getState(profile.id);
  if (state.swiped) return null;
  return buildSelfMirrorProfile(profile);
}

export function recordSelfMirrorSwipe(profileId, direction, { superLike = false } = {}) {
  if (!profileId) return { matched: false, match: null };

  const state = getState(profileId);
  state.swiped = true;

  const isLike = direction === 'right' || direction === 'super' || superLike;
  let match = state.match;
  let matched = false;

  if (isLike) {
    const now = new Date().toISOString();
    const matchId = buildSelfMatchId(profileId);
    if (!match) {
      match = {
        id: matchId,
        profile_a_id: profileId,
        profile_b_id: profileId,
        status: 'active',
        created_date: now,
        last_message_time: now,
        last_message_text: 'Чат с собой — тестовый режим',
        unread_count_a: 0,
        unread_count_b: 0,
        video_consent_a: false,
        video_consent_b: false,
        video_result_a: 'pending',
        video_result_b: 'pending',
        is_self_mirror: true,
      };
      state.messages = [
        {
          id: `${matchId}-welcome`,
          match_id: matchId,
          sender_profile_id: profileId,
          type: 'system',
          content: '🔁 Тест: это чат с тобой. Пиши сюда — ответит твоё зеркало.',
          created_date: now,
        },
      ];
      matched = true;
    } else {
      matched = true;
    }
    state.match = match;
  }

  saveState(profileId, state);
  return { matched, match };
}

export function getSelfMirrorMatches(profileId) {
  if (!profileId) return [];
  const state = getState(profileId);
  return state.match ? [state.match] : [];
}

export function getSelfMirrorMatch(matchId) {
  if (!isSelfMirrorMatchId(matchId)) return null;
  return findContext(matchId)?.state?.match || null;
}

export function getSelfMirrorMessages(matchId) {
  if (!isSelfMirrorMatchId(matchId)) return [];
  const ctx = findContext(matchId);
  if (!ctx) return [];
  return [...(ctx.state.messages || [])].sort(
    (a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime(),
  );
}

function patchMatch(profileId, matchId, patch) {
  const state = getState(profileId);
  if (!state.match || state.match.id !== matchId) return null;
  state.match = { ...state.match, ...patch };
  saveState(profileId, state);
  return state.match;
}

export function sendSelfMirrorMessage(matchId, senderProfileId, content) {
  const ctx = findContext(matchId);
  if (!ctx || !content?.trim()) return null;

  const { profileId, state } = ctx;
  const now = new Date().toISOString();
  const outgoing = {
    id: `${matchId}-out-${Date.now()}`,
    match_id: matchId,
    sender_profile_id: senderProfileId,
    type: 'text',
    content: content.trim(),
    created_date: now,
  };

  const reply = {
    id: `${matchId}-echo-${Date.now()}`,
    match_id: matchId,
    sender_profile_id: senderProfileId,
    type: 'text',
    content: `🔁 ${content.trim()}`,
    created_date: new Date(Date.now() + 400).toISOString(),
  };

  state.messages = [...(state.messages || []), outgoing, reply];
  state.match = {
    ...state.match,
    last_message_text: reply.content,
    last_message_time: reply.created_date,
    unread_count_a: 0,
    unread_count_b: 0,
  };
  saveState(profileId, state);
  return outgoing;
}

export function sendSelfMirrorMediaMessage(matchId, senderProfileId, type, content) {
  const ctx = findContext(matchId);
  if (!ctx || !content) return null;

  const { profileId, state } = ctx;
  const now = new Date().toISOString();
  const message = {
    id: `${matchId}-${type}-${Date.now()}`,
    match_id: matchId,
    sender_profile_id: senderProfileId,
    type,
    content,
    created_date: now,
  };
  state.messages = [...(state.messages || []), message];
  state.match = {
    ...state.match,
    last_message_text: type === 'photo' ? '📷 Фото' : '🎤 Голосовое',
    last_message_time: now,
  };
  saveState(profileId, state);
  return message;
}

export function markSelfMirrorMatchRead(matchId) {
  const ctx = findContext(matchId);
  if (!ctx?.state.match) return;
  patchMatch(ctx.profileId, matchId, { unread_count_a: 0, unread_count_b: 0 });
}

export function setSelfMirrorVideoConsent(matchId) {
  const ctx = findContext(matchId);
  if (!ctx) return null;
  return patchMatch(ctx.profileId, matchId, {
    video_consent_a: true,
    video_consent_b: true,
  });
}

export function completeSelfMirrorVideoCall(matchId, profileId, result) {
  const ctx = findContext(matchId);
  if (!ctx) return null;
  const patch = {
    video_result_a: result,
    video_result_b: result,
    status: result === 'continue' ? 'video_unlocked' : 'ended',
  };
  return patchMatch(ctx.profileId, matchId, patch);
}

export function removeSelfMirrorMatch(profileId) {
  resetSelfMirrorState(profileId);
}
