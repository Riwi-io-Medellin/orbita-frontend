import {
  createContext,
  createElement,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import type { User } from "../../../types/user";

import {
  getCurrentUser,
  logout as logoutService,
} from "../services/authService";

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;

    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    return getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        isAuthenticated: user !== null,
        refreshUser,
        logout,
      },
    },
    children,
  );
}