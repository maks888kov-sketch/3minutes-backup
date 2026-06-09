/**
 * STUN + TURN для WebRTC (обход NAT на мобильном интернете).
 * Xirsys: опционально через VITE_XIRSYS_TURN_* в .env.local
 */

const OPEN_RELAY_USER = 'openrelay';
const OPEN_RELAY_PASS = 'openrelay';

function buildXirsysServers() {
  const username = import.meta.env.VITE_XIRSYS_TURN_USERNAME;
  const credential = import.meta.env.VITE_XIRSYS_TURN_CREDENTIAL;
  const urlsRaw = import.meta.env.VITE_XIRSYS_TURN_URLS;
  if (!username || !credential || !urlsRaw) return [];

  const urls = urlsRaw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  if (!urls.length) return [];
  return [{ urls, username, credential }];
}

/** Бесплатный обход блокировок NAT для WebRTC (OpenRelay / Metered) */
export function getIceServers() {
  return {
    iceServers: [
      { urls: 'stun:openrelay.metered.ca:80' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: OPEN_RELAY_USER,
        credential: OPEN_RELAY_PASS,
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: OPEN_RELAY_USER,
        credential: OPEN_RELAY_PASS,
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: OPEN_RELAY_USER,
        credential: OPEN_RELAY_PASS,
      },
      ...buildXirsysServers(),
    ],
    iceCandidatePoolSize: 10,
  };
}
