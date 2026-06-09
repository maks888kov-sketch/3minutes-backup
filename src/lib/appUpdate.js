import { APP_BUILD_ID } from '@/lib/appBuild';

const STORAGE_KEY = 'app_build_id';

export function getInstalledBuildId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function markBuildInstalled(buildId = APP_BUILD_ID) {
  try {
    localStorage.setItem(STORAGE_KEY, buildId);
  } catch {
    // ignore
  }
}

/** Серверная сборка (version.json или meta в index.html) */
export async function fetchRemoteBuildId() {
  const bust = `t=${Date.now()}`;
  try {
    const res = await fetch(`/version.json?${bust}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.buildId) return String(data.buildId);
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch(`/?${bust}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    const meta = html.match(/<meta\s+name="app-version"\s+content="([^"]+)"/i);
    if (meta?.[1]) return meta[1];
  } catch {
    return null;
  }

  return null;
}

export async function checkForAppUpdate() {
  const remote = await fetchRemoteBuildId();
  if (!remote) {
    return { updateAvailable: false, remote: null, local: APP_BUILD_ID };
  }
  const installed = getInstalledBuildId();
  const updateAvailable = remote !== APP_BUILD_ID || (installed && installed !== remote);
  return { updateAvailable, remote, local: APP_BUILD_ID, installed };
}

export async function hardReloadApp() {
  markBuildInstalled(APP_BUILD_ID);

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // ignore
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }

  const url = new URL(window.location.href);
  url.searchParams.set('_refresh', String(Date.now()));
  window.location.replace(url.toString());
}
