import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminSignIn } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — restore session if already logged in
  useEffect(() => {
    const savedUser  = localStorage.getItem('fixit_admin_user');
    const savedToken = localStorage.getItem('fixit_admin_token');
    if (savedUser && savedToken) {
      setAdmin(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  // Fixes:
  // 1. Catches axios network errors properly (reads err.response.data.Result)
  // 2. Never clears Email/Password — error is shown without re-render blinking
  // 3. Backend 401 response is read correctly from { Status:"Fail", Result:"Invalid Password" }
  const login = async (Email, Password) => {
    let res;

    try {
      res = await adminSignIn(Email, Password);
    } catch (err) {
      // Axios throws on 4xx/5xx — read your backend's { Status, Result } message
      const backendMsg = err?.response?.data?.Result;
      throw new Error(backendMsg || 'Cannot connect to server. Check if backend is running.');
    }

    // Backend returned 200 but Status is not OK
    if (res.data.Status !== 'OK') {
      throw new Error(res.data.Result || 'Login failed');
    }

    // ✅ Login success
    const adminData = res.data.Result;
    const token = res.data.Token || 'temp_no_token';

    localStorage.setItem('fixit_admin_token', token);
    localStorage.setItem('fixit_admin_user', JSON.stringify(adminData));
    setAdmin(adminData);

    return adminData;
  };

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('fixit_admin_token');
    localStorage.removeItem('fixit_admin_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
