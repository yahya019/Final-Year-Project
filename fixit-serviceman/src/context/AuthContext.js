import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveServiceman, getServiceman, clearServiceman } from '../utils/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [serviceman, setServiceman] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { loadSession(); }, []);

  const loadSession = async () => {
    try {
      const { token, user } = await getServiceman();
      if (token && user) setServiceman(user);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const login = async (data) => {
    await saveServiceman(data);
    setServiceman(data.user);
  };

  const logout = async () => {
    await clearServiceman();
    setServiceman(null);
  };

  const updateUser = async (updated) => {
    await AsyncStorage.setItem('serviceman_user', JSON.stringify(updated));
    setServiceman(updated);
  };

  return (
    <AuthContext.Provider value={{ serviceman, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
