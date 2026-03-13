// Helper: fetch API dengan Authorization header dari localStorage
import { API_BASE } from "./config";

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("ct_token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Jangan set Content-Type jika FormData (browser set otomatis)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res;
};
