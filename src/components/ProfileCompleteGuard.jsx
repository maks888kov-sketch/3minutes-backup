/* b44-full-sync 2026-06-01 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentProfile } from '@/lib/useProfile';
import PageLoader from '@/components/PageLoader';
import PresenceHeartbeat from '@/components/PresenceHeartbeat';

const ALLOWED_INCOMPLETE = ['/profile-setup', '/settings', '/feedback', '/premium'];

export default function ProfileCompleteGuard() {
  const location = useLocation();
  const { data: profile, isLoading } = useCurrentProfile();

  const allowed = ALLOWED_INCOMPLETE.some((path) => location.pathname.startsWith(path));

  if (isLoading) {
    return <PageLoader className="min-h-screen" />;
  }

  const needsSetup = !profile || !profile.profile_complete;

  if (needsSetup && !allowed) {
    return <Navigate to="/profile-setup" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <PresenceHeartbeat />
      <Outlet />
    </>
  );
}
