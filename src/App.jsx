import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import SplashScreen from './components/SplashScreen';
import AppNotifications from './components/AppNotifications';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import ProfileSetup from './pages/ProfileSetup';
import Discover from './pages/Discover';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import VideoCall from './pages/VideoCall';
import Premium from './pages/Premium';
import Settings from './pages/Settings';
import Chats from './pages/Chats';
import Feedback from './pages/Feedback';
import MockChat from './pages/MockChat';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/video-call/:matchId" element={<VideoCall />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/mock-chat/:chatId" element={<MockChat />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SplashScreen onDone={() => setSplashDone(true)} />
        {splashDone && (
          <Router>
            <AuthenticatedApp />
          </Router>
        )}
        <AppNotifications />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App