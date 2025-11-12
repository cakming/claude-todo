import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(false);

  // Check if auth is enabled and verify token on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if auth is enabled on server
      const enabled = await authService.checkAuthEnabled();
      setAuthEnabled(enabled);

      if (!enabled) {
        // Auth is disabled, no need to verify token
        setLoading(false);
        return;
      }

      // Auth is enabled, check if user is logged in
      if (authService.isAuthenticated()) {
        const isValid = await authService.verifyToken();
        if (isValid) {
          // Get user profile
          try {
            const profile = await authService.getProfile();
            setUser(profile);
          } catch (error) {
            // Token might be invalid, clear it
            authService.logout();
            setUser(null);
          }
        } else {
          // Token is invalid
          authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const userData = await authService.login(username, password);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const userData = await authService.register(username, email, password);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    authEnabled,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
