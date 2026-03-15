// API base URL configuration
// - Development (localhost): direct to backend port 5000
// - Production: relative /api/v1, handled by nginx proxy
//   (so the domain never needs to be hardcoded in source code)
// - Override: set VITE_API_URL env var at build time for custom setups

const getBaseUrl = () => {
  // Explicit override always wins (e.g. VITE_API_URL=https://api.example.com)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Local development — talk directly to the Express server
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000/api/v1";
  }

  // Production — use a relative path so nginx proxies it to the backend
  // container regardless of which domain the app is served from
  return "/api/v1";
};

export const API_BASE = getBaseUrl();
