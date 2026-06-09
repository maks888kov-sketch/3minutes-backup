/** Комната = matchId. Оба с одним matchId попадают в одну видеокомнату (как ссылка в Telegram). */
export function buildJitsiRoomName(matchId) {
  const safe = String(matchId || 'room').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ThreeMinutes_${safe}`;
}

export function buildJitsiEmbedUrl(matchId, displayName = 'Участник') {
  const room = buildJitsiRoomName(matchId);
  const hash = [
    'config.prejoinPageEnabled=false',
    'config.startWithAudioMuted=false',
    'config.startWithVideoMuted=false',
    'config.disableDeepLinking=true',
    'config.enableWelcomePage=false',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
    'interfaceConfig.MOBILE_APP_PROMO=false',
    `userInfo.displayName=${encodeURIComponent(displayName)}`,
  ].join('&');
  return `https://meet.jit.si/${room}#${hash}`;
}
