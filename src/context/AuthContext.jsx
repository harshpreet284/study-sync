import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, tokenStorage } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenStorage.get());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initializes auth state by verifying stored token with /api/auth/me.
   */
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = tokenStorage.get();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await authService.getMe(storedToken);
        if (isMounted) {
          setUser(data.user);
          setToken(storedToken);
        }
      } catch (err) {
        // Confirmed authentication failure (401 Unauthorized: token expired, invalid, or deleted user)
        if (err.status === 401) {
          console.warn('[AuthContext] Session expired or invalid. Clearing stored credentials.');
          tokenStorage.remove();
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        } else if (err.status === 403) {
          // HTTP 403 Forbidden indicates an access restriction (e.g. CORS policy), not an invalid token.
          // Preserve the token but leave user unverified.
          console.warn('[AuthContext] Access restricted (HTTP 403). Preserving token:', err.message);
          if (isMounted) {
            setUser(null);
          }
        } else {
          // Transient network failure (offline, timeout) or 5xx server error.
          // Do NOT erase a potentially valid token due to temporary connectivity issues.
          console.warn('[AuthContext] Transient network or server error during session verification. Preserving token:', err.message);
          if (isMounted) {
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Logs in a user with email and password.
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registers a new user.
   */
  const register = useCallback(async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register({ name, email, password });
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logs out the user and clears state.
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
