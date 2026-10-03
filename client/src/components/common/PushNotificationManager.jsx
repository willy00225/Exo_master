import { useEffect } from 'react';
import api from '../../services/api';

// Convertit une clé VAPID base64 en Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PushNotificationManager = () => {
  useEffect(() => {
    let cancelled = false;

    // ----------------------------------------------------------------
    // 🔒 PROTECTION 1 : Ne rien faire si l'utilisateur n'est pas connecté
    // Empêche les appels API 401 en boucle sur les pages publiques
    // ----------------------------------------------------------------
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // ----------------------------------------------------------------
    // 🔒 PROTECTION 2 : Vérifier le support navigateur
    // ----------------------------------------------------------------
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    // ----------------------------------------------------------------
    // 🔒 PROTECTION 3 : Vérifier la clé VAPID
    // ----------------------------------------------------------------
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return;
    }

    // ----------------------------------------------------------------
    // 🔒 PROTECTION 4 : Ne pas redemander si déjà abonné
    // ----------------------------------------------------------------
    const isSubscribed = localStorage.getItem('push_subscription');
    if (isSubscribed === 'true') {
      return;
    }

    const subscribeUser = async () => {
      try {
        // Demande la permission (nécessite un geste utilisateur sur mobile)
        const permission = await Notification.requestPermission();
        if (cancelled || permission !== 'granted') return;

        // Enregistre le service worker (déjà enregistré = ne fait rien)
        await navigator.serviceWorker.register('/sw.js');
        const readyRegistration = await navigator.serviceWorker.ready;

        // Vérifie s'il y a déjà un abonnement actif (évite les doublons)
        let subscription = await readyRegistration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await readyRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        if (cancelled || !subscription) return;

        // Envoie l'abonnement au backend (une seule fois)
        await api.post('/notifications/subscribe', subscription);
        localStorage.setItem('push_subscription', 'true');
      } catch (error) {
        // Échec silencieux — l'app continue de fonctionner normalement
        if (!cancelled) {
          console.warn('Push notifications indisponibles :', error?.message || error);
        }
      }
    };

    // Petit délai pour ne pas bloquer le rendu initial
    const timer = setTimeout(() => {
      if (!cancelled) subscribeUser();
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
};

export default PushNotificationManager;