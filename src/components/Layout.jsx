import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const hiddenNavRoutes = ['/onboarding', '/profile-setup', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/chat/', '/video-call'];

export default function Layout() {
  const location = useLocation();
  const hideNav = hiddenNavRoutes.some(r => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}