import { createRoot } from "react-dom/client";
import { enabled } from "./prototype/model";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Register service worker for push notifications
if (!enabled(location.search) && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

const root = createRoot(rootElement);
root.render(<p role="status">Loading ChoreCoins…</p>);
const entry = enabled(location.search) ? import('./prototype/Prototype') : import('./App');
entry.then(({ default: App }) => root.render(<App />)).catch(() => {
  root.render(<p role="alert">ChoreCoins could not load. Please refresh to retry.</p>);
});
