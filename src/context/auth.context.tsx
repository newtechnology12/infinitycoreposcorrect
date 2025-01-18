import pocketbase from "@/lib/pocketbase";
import authService from "@/services/auth.service";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";

interface User {
  id: any;
  names: any;
  photo: any;
  email: any;
  role: any;
  department: any;
  phone?: any;
  created_at?: any;
  status?: any;
}

interface AuthContextValue {
  user: User | null;
  setCurrentUser: (userData: User) => void;
  logout: () => void;
  loaderUser: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setloading] = useState(true);

  const setCurrentUser = (user) => {
    setloading(false);
    if (user) {
      setUser(user);
    } else {
      setUser(undefined);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const loaderUser = async () => {
    try {
      const authData: any = await authService.getCurrentUser();
      setCurrentUser(authData);
    } catch (error) {
      setCurrentUser(undefined);
      console.log(error);
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      setCurrentUser,
      logout,
      loading,
      loaderUser,
    }),
    [user, loading]
  );

  useEffect(() => {
    loaderUser();
  }, []);

  useEffect(() => {
    const unsubscribe = pocketbase.authStore.onChange((...all) => {
      const user = all[1];
      if (user) {
        if (user.expand) {
          // console.log("dddd");
          setCurrentUser({
            names: user?.name,
            role: user?.expand?.role,
            department: user?.expand?.department,
            email: user.email,
            id: user.id,
            photo: user.avatar,
            phone: user.record?.phone,
            created_at: user.record?.created_at,
            status: user.record?.status,
          });
        } else {
          loaderUser();
        }
      } else {
        setCurrentUser(undefined);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
