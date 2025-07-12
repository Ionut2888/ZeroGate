import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';

// Types
export interface User {
  id: string;
  proofVerified: boolean;
  timestamp: string;
  username?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Context
interface AuthContextValue extends AuthState {
  login: (proof: any, publicInputs: string[], secret: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('zerogate_token');
    const user = localStorage.getItem('zerogate_user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: parsedUser, token }
        });
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('zerogate_token');
        localStorage.removeItem('zerogate_user');
      }
    }
  }, []);

  // Save to localStorage when authentication state changes
  useEffect(() => {
    if (state.isAuthenticated && state.token && state.user) {
      localStorage.setItem('zerogate_token', state.token);
      localStorage.setItem('zerogate_user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('zerogate_token');
      localStorage.removeItem('zerogate_user');
    }
  }, [state.isAuthenticated, state.token, state.user]);

  const login = async (proof: any, publicInputs: string[], username: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof,
          publicInputs,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Authentication failed');
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.user,
          token: data.token,
        },
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Authentication failed',
      });
      throw error;
    }
  };

  const logout = (): void => {
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
