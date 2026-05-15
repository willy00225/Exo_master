import axios from 'axios';

const api = axios.create({
  // En production, utilisez la variable d'environnement VITE_API_URL
  // Si elle n'est pas définie, on reste sur localhost (développement)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse enrichi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      // Token expiré ou invalide (401) ou token absent/malformé (400 avec message spécifique)
      if (status === 401 || (status === 400 && error.response.data?.error === 'Token invalide.')) {
        // Supprimer les anciennes données
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Rediriger vers la page de connexion avec un paramètre pour informer l'utilisateur
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;