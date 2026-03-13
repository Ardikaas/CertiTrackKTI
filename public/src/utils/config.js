// Environment-based API configuration
const getBaseUrl = () => {
  const isProd = 
    import.meta.env.VITE_API_URL ||
    window.location.hostname !== 'localhost';
  
  return isProd
    ? "https://certitrack.perfectlyx.my.id/api/v1"
    : "http://localhost:5000/api/v1";
};

export const API_BASE = getBaseUrl();
