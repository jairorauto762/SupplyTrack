<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PushSubscriptionController extends Controller
{
    public function publicKey()
    {
        $publicKey = config('services.webpush.public_key');

        if (! $publicKey) {
            return response()->json(['message' => 'Browser push notifications are not configured.'], 503);
        }

        return response()->json(['publicKey' => $publicKey]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'endpoint' => [
                'required',
                'url',
                'max:2048',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value)) {
                        $fail('The push endpoint must be a supported browser push provider URL.');

                        return;
                    }

                    $host = strtolower((string) parse_url($value, PHP_URL_HOST));
                    $allowedHost = $host === 'fcm.googleapis.com'
                        || $host === 'push.services.mozilla.com'
                        || $host === 'push.apple.com'
                        || Str::endsWith($host, ['.push.services.mozilla.com', '.push.apple.com', '.notify.windows.com']);

                    if (strtolower((string) parse_url($value, PHP_URL_SCHEME)) !== 'https' || ! $allowedHost) {
                        $fail('The push endpoint must use HTTPS and a supported browser push provider.');
                    }
                },
            ],
            'keys.p256dh' => 'required|string|max:255',
            'keys.auth' => 'required|string|max:255',
        ]);

        PushSubscription::updateOrCreate(
            ['endpoint_hash' => hash('sha256', $data['endpoint'])],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $data['endpoint'],
                'public_key' => $data['keys']['p256dh'],
                'auth_token' => $data['keys']['auth'],
                'content_encoding' => 'aes128gcm',
            ],
        );

        return response()->noContent();
    }

    public function destroy(Request $request)
    {
        $data = $request->validate([
            'endpoint' => 'required|url|max:2048',
        ]);

        PushSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('endpoint_hash', hash('sha256', $data['endpoint']))
            ->delete();

        return response()->noContent();
    }
}
