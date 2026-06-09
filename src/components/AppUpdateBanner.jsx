import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { APP_BUILD_ID } from '@/lib/appBuild';
import {
  checkForAppUpdate,
  hardReloadApp,
  markBuildInstalled,
} from '@/lib/appUpdate';
import { Button } from '@/components/ui/button';

const CHECK_MS = 90_000;

export default function AppUpdateBanner() {
  const [show, setShow] = useState(false);
  const [remoteBuild, setRemoteBuild] = useState('');
  const [checking, setChecking] = useState(false);

  const runCheck = useCallback(async () => {
    const result = await checkForAppUpdate();
    if (result.updateAvailable && result.remote) {
      setRemoteBuild(result.remote);
      setShow(true);
      return true;
    }
    if (result.remote === APP_BUILD_ID) {
      markBuildInstalled(APP_BUILD_ID);
      setShow(false);
    }
    return false;
  }, []);

  useEffect(() => {
    markBuildInstalled(APP_BUILD_ID);
    runCheck();

    const onVisible = () => {
      if (document.visibilityState === 'visible') runCheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(runCheck, CHECK_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [runCheck]);

  const handleUpdate = async () => {
    setChecking(true);
    try {
      await hardReloadApp();
    } finally {
      setChecking(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] safe-top px-3 pt-2 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md glass-strong border border-primary/40 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Доступна новая версия</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {remoteBuild || 'обновление'} — нажми «Обновить», удалять приложение не нужно
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 gradient-primary border-0 rounded-xl h-9"
          disabled={checking}
          onClick={handleUpdate}
        >
          {checking ? '…' : 'Обновить'}
        </Button>
      </div>
    </div>
  );
}
