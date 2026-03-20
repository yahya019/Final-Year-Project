import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveCustomer, getCustomer, clearCustomer } from '../utils/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { loadSession(); }, []);

  const loadSession = async () => {
    try {
      const { token, user } = await getCustomer();
      if (token && user) setCustomer(user);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const login = async (data) => {
    await saveCustomer(data);
    setCustomer(data.user);
  };

  const logout = async () => {
    await clearCustomer();
    setCustomer(null);
  };

  const updateUser = async (updated) => {
    await AsyncStorage.setItem('customer_user', JSON.stringify(updated));
    setCustomer(updated);
  };

  return (
    <AuthContext.Provider value={{ customer, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
