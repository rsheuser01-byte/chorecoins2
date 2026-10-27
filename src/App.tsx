import { AccountDataBoundary } from '@/contexts/AccountDataContext';
import { useEffect } from "react";
import { shouldRouteToRecovery } from "@/lib/authFlows";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NotificationWidget } from "@/components/GamificationWidget";
import { SoundToggle } from "@/components/SoundToggle";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Chores from "./pages/Chores";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import Invest from "./pages/Invest";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import { ParentDashboard } from "./pages/ParentDashboard";
import Notifications from "./pages/Notifications";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const AuthHashRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPasswordRecovery } = useAuth();

  useEffect(() => {
    // Confirmation and magic-link tokens are not password recovery links.
    if (shouldRouteToRecovery(location.hash, location.pathname, isPasswordRecovery)) {
      navigate(`/reset-password${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.hash, isPasswordRecovery, navigate]);

  return null;
};

// Component to handle route changes and prevent sounds
const RouteChangeHandler = () => {
  const location = useLocation();

  useEffect(() => {
    const resetScrollLock = () => {
      const { body, documentElement } = document;
      body.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.touchAction = '';
      documentElement.style.overflow = '';
      documentElement.style.position = '';
    };

    // Stop any playing audio elements when route changes
    const audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach((element) => {
      if (element instanceof HTMLAudioElement || element instanceof HTMLVideoElement) {
        element.pause();
        element.currentTime = 0;
        element.muted = true;
      }
    });

    // Prevent any Web Audio API contexts from playing sounds
    // This ensures no sounds are triggered by route changes

    resetScrollLock();
  }, [location.pathname]);

  // Global effect to prevent sounds on initial load and navigation
  useEffect(() => {
    // Mute all audio/video elements globally to prevent navigation sounds
    const muteAllMedia = () => {
      const allMedia = document.querySelectorAll('audio, video');
      allMedia.forEach((media) => {
        if (media instanceof HTMLAudioElement || media instanceof HTMLVideoElement) {
          media.muted = true;
        }
      });
    };

    // Run immediately and set up observer for dynamically added elements
    muteAllMedia();
    
    // Observe for new audio/video elements and mute them
    const observer = new MutationObserver(muteAllMedia);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return null;
};

const ScrollLockGuard = () => {
  useEffect(() => {
    const unlockScroll = () => {
      const hasOpenDialog = !!document.querySelector(
        '[role="dialog"][data-state="open"], [data-dialog][data-state="open"], [data-modal="true"][data-state="open"]'
      );

      if (!hasOpenDialog) {
        const { body, documentElement } = document;
        body.style.overflow = '';
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.width = '';
        body.style.touchAction = '';
        documentElement.style.overflow = '';
        documentElement.style.position = '';
      }
    };

    unlockScroll();

    const observer = new MutationObserver(unlockScroll);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    window.addEventListener('focus', unlockScroll);
    window.addEventListener('pageshow', unlockScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('focus', unlockScroll);
      window.removeEventListener('pageshow', unlockScroll);
    };
  }, []);

  return null;
};

const AppContent = () => (
  <div className="min-h-screen bg-background overflow-x-hidden">
    <ScrollLockGuard />
    <AuthHashRedirect />
    <RouteChangeHandler />
    <Header />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/chores" element={<Chores />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/lesson/:moduleId" element={<Lesson />} />
      <Route path="/invest" element={<Invest />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/parent" element={<ParentDashboard />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <AccountDataBoundary>
          <Toaster />
          <Sonner />
          <NotificationWidget />
          <SoundToggle />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
                  </AccountDataBoundary>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

