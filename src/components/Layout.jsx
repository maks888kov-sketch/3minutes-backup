/* b44-full-sync 2026-06-01 */
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import AddToHomeScreenHint from './AddToHomeScreenHint';
import { HIDDEN_NAV_PREFIXES, matchesRoutePrefix } from '@/lib/appRoutes';

export default function Layout() {
  const location = useLocation();
  const hideNav = matchesRoutePrefix(location.pathname, HIDDEN_NAV_PREFIXES);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#121212]">
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      {!hideNav && (
        <div className="relative z-40 flex-shrink-0">
          <AddToHomeScreenHint />
          <BottomNav />
        </div>
      )}
    </div>
  );
}
