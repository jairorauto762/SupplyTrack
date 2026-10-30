<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use RuntimeException;

class GenerateWebPushKeys extends Command
{
    protected $signature = 'webpush:keys';

    protected $description = 'Generate VAPID keys for browser push notifications';

    public function handle(): int
    {
        try {
            $keys = $this->createVapidKeys();
        } catch (\Throwable $exception) {
            $this->error('Could not generate VAPID keys: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->line('VAPID_PUBLIC_KEY='.$keys['publicKey']);
        $this->line('VAPID_PRIVATE_KEY='.$keys['privateKey']);
        $this->comment('Store these values in backend/.env and keep the private key secret.');

        return self::SUCCESS;
    }

    private function createVapidKeys(): array
    {
        $options = [
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ];
        $opensslConfig = getenv('OPENSSL_CONF')
            ?: dirname(PHP_BINARY).DIRECTORY_SEPARATOR.'extras'.DIRECTORY_SEPARATOR.'ssl'.DIRECTORY_SEPARATOR.'openssl.cnf';

        if (is_file($opensslConfig)) {
            $options['config'] = $opensslConfig;
        }

        $key = openssl_pkey_new($options);

        if ($key === false) {
            $errors = [];
            while ($error = openssl_error_string()) {
                $errors[] = $error;
            }

            throw new RuntimeException('OpenSSL could not create an elliptic curve key. '.implode(' ', $errors));
        }

        $details = openssl_pkey_get_details($key);

        if ($details === false || ! isset($details['ec']['x'], $details['ec']['y'], $details['ec']['d'])) {
            throw new RuntimeException('OpenSSL did not return the expected P-256 key details.');
        }

        $publicKey = "\x04"
            .str_pad($details['ec']['x'], 32, "\0", STR_PAD_LEFT)
            .str_pad($details['ec']['y'], 32, "\0", STR_PAD_LEFT);
        $privateKey = str_pad($details['ec']['d'], 32, "\0", STR_PAD_LEFT);

        return [
            'publicKey' => $this->encodeBase64Url($publicKey),
            'privateKey' => $this->encodeBase64Url($privateKey),
        ];
    }

    private function encodeBase64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
