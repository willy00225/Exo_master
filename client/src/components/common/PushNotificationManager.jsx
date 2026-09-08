import { useEffect } from 'react';
import api from '../../services/api'; // Ajustez le chemin si nécessaire

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
    // Vérifier que le navigateur supporte les notifications push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications non supportées par ce navigateur.');
      return;
    }

    const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('Clé publique VAPID manquante. Configurez REACT_APP_VAPID_PUBLIC_KEY.');
      return;
    }

    // Vérifier si l'utilisateur est déjà abonné (stockage local simple)
    const isSubscribed = localStorage.getItem('push_subscription');
    if (isSubscribed === 'true') {
      console.log('Déjà abonné aux notifications push.');
      return;
    }

    async function subscribeUser() {
      try {
        // 1. Demander la permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Permission de notification refusée.');
          return;
        }

        // 2. Enregistrer le service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        const readyRegistration = await navigator.serviceWorker.ready;

        // 3. S'abonner au push
        const subscription = await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // 4. Envoyer l'abonnement au backend
        await api.post('/notifications/subscribe', subscription);
        localStorage.setItem('push_subscription', 'true');
        console.log('Abonnement aux notifications push réussi.');
      } catch (error) {
        console.error('Erreur lors de la souscription aux notifications push :', error);
      }
    }

    subscribeUser();

    // Nettoyage éventuel (rien à faire ici)
  }, []);

  // Ce composant ne rend rien
  return null;
};

export default PushNotificationManager;