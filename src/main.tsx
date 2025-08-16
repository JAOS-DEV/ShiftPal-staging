import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { registerSW } from "virtual:pwa-register";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA service worker with update flow hook support
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("pwa:update-available"));
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent("pwa:offline-ready"));
  },
});

// Expose a global to allow triggering update from UI
// @ts-expect-error attach helper
window.__SHIFT_PAL_PWA_UPDATE__ = updateSW;
