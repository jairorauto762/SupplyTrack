# SupplyTrack backend setup

## Item photos

Custodians can add an optional JPEG, PNG, or WebP photo (up to 5 MB) while adding an inventory item. Laravel stores uploaded files in `storage/app/public/items`; the database stores a URL to each photo. To serve photos locally, run this once from the `backend` directory:

```powershell
php artisan storage:link
```

## Browser push notifications

Install dependencies and migrate the database, then generate a VAPID key pair:

```powershell
composer install
php artisan migrate
php artisan webpush:keys
```

Copy the printed `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` values into `backend/.env`, and set `VAPID_SUBJECT` to a contact email or URL. Keep the private key secret and stable; do not generate a new pair after users subscribe. Restart Laravel after changing `.env`.

Push subscriptions are registered automatically for signed-in users who have already granted notification permission in their browser. The browser must support push notifications and the app must be served from `localhost` or HTTPS. Because browsers require the user to grant notification permission, allow notifications for the site in browser settings before signing in if alerts are not arriving. Custodians receive alerts for new supply requests and items reaching zero stock; students receive an alert when their request is ready for pickup.
