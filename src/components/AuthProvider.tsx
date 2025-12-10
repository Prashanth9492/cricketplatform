
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";


interface AuthContextType {
  user: string | null;
  loading: boolean;
  role: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check localStorage for token/role
    try {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      const userRole = localStorage.getItem('role');
      if (token && username && userRole) {
        setUser(username);
        setRole(userRole);
      }
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', username);
      setUser(username);
      setRole(res.data.role);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
    setRole(null);
  };

  const isAdmin = role === 'admin';

  const value = {
    user,
    loading,
    role,
    signIn,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};