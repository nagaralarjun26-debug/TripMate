// src/context/AuthContext.jsx
// JWT-based authentication context for TripMate (migrated from Supabase)
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if token exists in localStorage and verify it
  useEffect(() => {
    const token = localStorage.getItem('tripmate_token');
    if (token) {
      api.get('/api/auth/me')
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem('tripmate_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Register new user with name, email, and password
  const signUp = async (name, email, password) => {
    const data = await api.post('/api/auth/register', { name, email, password });
    localStorage.setItem('tripmate_token', data.token);
    setUser(data.user);
  };

  // Sign in existing user with email and password
  const signIn = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('tripmate_token', data.token);
    setUser(data.user);
  };

  // Sign out user by removing token from localStorage and clearing user state
  const signOut = () => {
    localStorage.removeItem('tripmate_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
