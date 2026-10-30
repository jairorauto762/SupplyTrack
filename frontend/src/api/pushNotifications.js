import api from './axios';

function decodeApplicationServerKey(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);

  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function syncPushSubscription() {
  if (
    !('serviceWorker' in navigator)
    || !('PushManager' in window)
    || !('Notification' in window)
    || Notification.permission !== 'granted'
  ) {
    return;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  let subscription = await registration.pushManager.getSubscription();
  const isNewSubscription = !subscription;

  if (isNewSubscription) {
    const { data } = await api.get('/push/vapid-public-key');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(data.publicKey),
    });
  }

  try {
    await api.post('/push-subscriptions', subscription.toJSON());
  } catch (error) {
    if (isNewSubscription) {
      await subscription.unsubscribe();
    }

    throw error;
  }
}
