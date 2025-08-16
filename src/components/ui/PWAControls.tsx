import React, { useEffect, useRef, useState } from "react";
import ToastNotification from "./ToastNotification";

const PWAControls: React.FC = () => {
  const deferredPromptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    // Check if we already have a deferred prompt (event fired before component mounted)
    if ((window as any).deferredPrompt) {
      deferredPromptRef.current = (window as any).deferredPrompt;
      setCanInstall(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for PWA events from Vite PWA plugin
    const handleOfflineReady = () => {
      setOfflineReady(true);
    };

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener("pwa:offline-ready", handleOfflineReady);
    window.addEventListener("pwa:update-available", handleUpdateAvailable);

    // Check for existing service worker updates
    const checkForUpdates = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.waiting) {
            setUpdateAvailable(true);
          }
        }
      } catch (error) {
        console.error("[PWA] Error checking for updates:", error);
      }
    };

    // Check if we just reloaded from an update
    const checkIfJustUpdated = () => {
      const lastUpdateTime = sessionStorage.getItem("pwa_update_time");
      const currentTime = Date.now();

      if (lastUpdateTime) {
        const timeSinceUpdate = currentTime - parseInt(lastUpdateTime);
        // If we reloaded within the last 5 seconds, we're probably on a fresh version
        if (timeSinceUpdate < 5000) {
          setUpdateAvailable(false);
          sessionStorage.removeItem("pwa_update_time");
          return true;
        }
      }
      return false;
    };

    // Only check for updates if we didn't just update
    if (!checkIfJustUpdated()) {
      checkForUpdates();
    }

    // Listen for network status changes
    const handleOnline = () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration && registration.active) {
            setOfflineReady(true);
          }
        });
      }
    };

    const handleOffline = () => {
      // Handle offline state if needed
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("pwa:offline-ready", handleOfflineReady);
      window.removeEventListener("pwa:update-available", handleUpdateAvailable);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const onInstallClick = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;
    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } catch (_) {
      // ignore
    }
    deferredPromptRef.current = null;
    setCanInstall(false);
  };

  const onUpdateClick = () => {
    // Clear the update state immediately
    setUpdateAvailable(false);

    // Set timestamp to track that we just updated
    sessionStorage.setItem("pwa_update_time", Date.now().toString());

    // Use the Vite PWA update mechanism
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          // Send the skip waiting message
          registration.waiting.postMessage({ type: "SKIP_WAITING" });

          // Force reload after a short delay as backup
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Fallback to direct reload
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <ToastNotification
        visible={offlineReady}
        message="App is ready for offline use"
      />
      {/* Offline ready banner with dismiss button */}
      {offlineReady && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-sm font-medium">
              ✅ App is ready for offline use
            </span>
            <button
              onClick={() => setOfflineReady(false)}
              className="bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-md text-xs"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Install button */}
      {canInstall && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={onInstallClick}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
            aria-label="Install app"
          >
            Install app
          </button>
        </div>
      )}
      {/* Update available banner */}
      {updateAvailable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-sm font-medium">Update available</span>
            <button
              onClick={onUpdateClick}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-xs"
              aria-label="Reload to update"
            >
              Reload
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAControls;
