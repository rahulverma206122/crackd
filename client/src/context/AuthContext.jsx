import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = (data) => {
    localStorage.setItem("token", data.token);

    setToken(data.token);
    setUser(data.user);
  };

  const register = async (userData) => {
    const data = await registerUser(userData);

    saveAuth(data);

    return data;
  };

  const login = async (userData) => {
    const data = await loginUser(userData);

    saveAuth(data);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const data = await getCurrentUser(storedToken);

        setUser(data.user);
      } catch (error) {
        console.error("Authentication restore failed:", error);

        localStorage.removeItem("token");

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};