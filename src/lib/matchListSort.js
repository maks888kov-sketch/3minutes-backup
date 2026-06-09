import { isTestBotMatchId } from '@/lib/testBots';
import { isSelfMirrorMatchId } from '@/lib/selfMirrorStore';

/** Реальные пары сверху; тест с собой — внизу списка */
function matchListPriority(match) {
  if (isSelfMirrorMatchId(match?.id)) return 3;
  if (isTestBotMatchId(match?.id)) return 2;
  return 1;
}

export function sortMatchesForUi(matches = []) {
  return [...matches].sort((a, b) => {
    const pr = matchListPriority(a) - matchListPriority(b);
    if (pr !== 0) return pr;
    return (
      new Date(b.last_message_time || b.created_date) -
      new Date(a.last_message_time || a.created_date)
    );
  });
}

export function isRealUserMatch(match) {
  return match?.id && !isSelfMirrorMatchId(match.id) && !isTestBotMatchId(match.id);
}
