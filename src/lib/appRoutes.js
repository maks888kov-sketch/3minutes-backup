/** Общие списки маршрутов для Layout и AuthenticatedApp */

export const AUTH_ROUTES = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

export const PUBLIC_ROUTES = [
  ...AUTH_ROUTES,
  '/onboarding',
  '/logout',
];

export const HIDDEN_NAV_PREFIXES = [
  '/onboarding',
  '/profile-setup',
  ...AUTH_ROUTES,
  '/chat/',
  '/video-call',
  '/feedback',
];

export function matchesRoutePrefix(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}
