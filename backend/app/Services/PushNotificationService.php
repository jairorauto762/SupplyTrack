<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

class PushNotificationService
{
    public function sendToRole(string $role, string $title, string $body, string $url): void
    {
        $subscriptions = PushSubscription::query()
            ->whereHas('user', fn ($query) => $query->where('role', $role))
            ->get();

        $this->send($subscriptions, $title, $body, $url);
    }

    public function sendToUser(int $userId, string $title, string $body, string $url): void
    {
        $subscriptions = PushSubscription::query()
            ->where('user_id', $userId)
            ->get();

        $this->send($subscriptions, $title, $body, $url);
    }

    private function send(iterable $subscriptions, string $title, string $body, string $url): void
    {
        $subscriptions = collect($subscriptions);

        if ($subscriptions->isEmpty()) {
            return;
        }

        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');

        if (! $publicKey || ! $privateKey) {
            Log::warning('Push notification was not sent because VAPID keys are not configured.');

            return;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => config('services.webpush.subject'),
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ], ['TTL' => 60]);

            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'url' => $url,
            ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        } catch (Throwable $exception) {
            Log::error('Could not initialize browser push notifications.', [
                'exception' => $exception->getMessage(),
            ]);

            return;
        }

        foreach ($subscriptions as $storedSubscription) {
            try {
                $report = $webPush->sendOneNotification(
                    Subscription::create([
                        'endpoint' => $storedSubscription->endpoint,
                        'publicKey' => $storedSubscription->public_key,
                        'authToken' => $storedSubscription->auth_token,
                        'contentEncoding' => $storedSubscription->content_encoding,
                    ]),
                    $payload,
                );

                if ($report->isSuccess()) {
                    continue;
                }

                if ($report->isSubscriptionExpired()) {
                    $storedSubscription->delete();

                    continue;
                }

                Log::warning('Browser push provider rejected a notification.', [
                    'subscription_id' => $storedSubscription->id,
                    'reason' => $report->getReason(),
                ]);
            } catch (Throwable $exception) {
                Log::warning('Could not send a browser push notification.', [
                    'subscription_id' => $storedSubscription->id,
                    'exception' => $exception->getMessage(),
                ]);
            }
        }
    }
}
