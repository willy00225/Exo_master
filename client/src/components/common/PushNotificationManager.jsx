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

    // Vérifier le support navigateur
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications non supportées par ce navigateur.');
      return;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('Clé publique VAPID manquante. Configurez VITE_VAPID_PUBLIC_KEY.');
      return;
    }

    const isSubscribed = localStorage.getItem('push_subscription');
    if (isSubscribed === 'true') {
      return;
    }

    const subscribeUser = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (cancelled || permission !== 'granted') return;

        await navigator.serviceWorker.register('/sw.js');
        const readyRegistration = await navigator.serviceWorker.ready;

        const subscription = await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        if (cancelled) return;

        await api.post('/notifications/subscribe', subscription);
        localStorage.setItem('push_subscription', 'true');
      } catch (error) {
        if (!cancelled) {
          console.error('Erreur push :', error);
        }
      }
    };

    subscribeUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default PushNotificationManager;