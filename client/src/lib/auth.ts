import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "./types";

interface AuthStore extends AuthState {
  login: (email: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error("Login failed");
          }

          const { user, token } = await response.json();
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

// Helper hook to get auth headers
export const useAuthHeaders = (): Record<string, string> => {
  const token = useAuth((state) => state.token);
  return token && typeof token === 'string' ? { "x-user-id": token } : {};
};
