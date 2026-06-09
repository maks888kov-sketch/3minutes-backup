/** Ссылка для второго устройства — всегда на опубликованный HTTPS-сайт */
export function getAppPublicOrigin() {
  const fromEnv = import.meta.env.VITE_BASE44_APP_BASE_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function getChatShareUrl(matchId) {
  return `${getAppPublicOrigin()}/chat/${matchId}`;
}

export function getCallShareUrl(matchId) {
  return `${getAppPublicOrigin()}/video-call/${matchId}`;
}

export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}
