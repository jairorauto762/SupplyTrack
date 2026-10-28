self.addEventListener('push', (event) => {
  let payload;

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() || 'You have a new SupplyTrack update.' };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'SupplyTrack', {
      body: payload.body || 'You have a new update.',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((windowClient) => windowClient.url.startsWith(self.location.origin));

      if (client) {
        return client.navigate(destination).then((windowClient) => windowClient?.focus());
      }

      return self.clients.openWindow(destination);
    }),
  );
});
