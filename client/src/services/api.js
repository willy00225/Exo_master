import axios from 'axios';

const api = axios.create({
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

// Routes publiques : ne JAMAIS rediriger en cas de 401
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/public/',
  '/notifications/subscribe',
];

// Pages publiques : ne JAMAIS rediriger si on est déjà dessus
const PUBLIC_PAGES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-email-pending',
  '/email-verified',
];

const isPublicEndpoint = (url = '') =>
  PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));

const isPublicPage = () => {
  const path = window.location.pathname;
  return PUBLIC_PAGES.some((page) => path.startsWith(page));
};

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || '';
      const hadToken = !!localStorage.getItem('token');

      const shouldHandleAuthError =
        status === 401 ||
        (status === 400 && error.response.data?.error === 'Token invalide.');

      // ⚠️ Conditions strictes pour éviter la boucle infinie :
      // 1. C'est bien une erreur d'auth
      // 2. Ce n'est PAS une route publique (login, register, subscribe, etc.)
      // 3. On n'est PAS déjà sur une page publique (login, register, etc.)
      // 4. L'utilisateur avait un token (donc il était connecté avant)
      if (
        shouldHandleAuthError &&
        !isPublicEndpoint(url) &&
        !isPublicPage() &&
        hadToken
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirection SPA si possible, sinon fallback
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;