import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE } from "../utils/config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ct_token"));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  const verifyToken = useCallback(async (t) => {
    if (!t) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setUser(data.data.user);
        setToken(t);
      } else {
        localStorage.removeItem("ct_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem("ct_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken(token);
  }, []); // eslint-disable-line

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.status !== "success") throw new Error(data.message || "Login gagal");
    localStorage.setItem("ct_token", data.token);
    setToken(data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = () => {
    localStorage.removeItem("ct_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
