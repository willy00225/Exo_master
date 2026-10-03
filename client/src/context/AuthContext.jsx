import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chargement initial : lecture sécurisée du localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        const parsed = JSON.parse(storedUser);
        // Vérification minimale : l'objet doit avoir un id et un role
        if (parsed && parsed.id && parsed.role) {
          setUser(parsed);
        } else {
          // Données invalides → on nettoie
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch (err) {
      // En cas de JSON corrompu, on nettoie proprement
      console.error('Erreur de lecture du localStorage :', err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: loggedUser, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);