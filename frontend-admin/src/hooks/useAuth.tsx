import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import toast from "react-hot-toast";
import { authApi } from "../services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({children}: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const getProfile = async () => {
        try {
          const profile = await authApi.getProfile();
          if (profile) {
            setUser(profile);
            console.log("profile fetched...", profile);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          setUser(null); // make sure no ghost user remains
        } finally {
          setIsLoading(false); // only stop loading after API resolves
        }
      };

      // only call API if token/cookie exists
      const token = localStorage.getItem("token");
      if (token) {
        getProfile();
      } else {
        setIsLoading(false);
      }
    }, []);

    async function login(email: string, password: string): Promise<void> {
        const { token, admin } = await authApi.login(email, password);

        localStorage.setItem("token", token);
        setUser(admin);

        toast.success("Login successful!");
    }

    function logout(): void {
        localStorage.removeItem("token");

        setUser(null);

        authApi.logout().catch(() => {});
        toast.success("Logged out successfully");
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}