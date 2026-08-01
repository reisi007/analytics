<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CheckOAuthToken extends Command
{
    protected $signature = 'oauth:check-token';

    protected $description = 'Checks the Google OAuth2 refresh token and alerts via Make webhook on failure';

    public function handle(): int
    {
        $clientId = config('analytics.oauth.client_id');
        $clientSecret = config('analytics.oauth.client_secret');
        $refreshToken = config('analytics.oauth.refresh_token');
        $webhookUrl = config('analytics.make.webhook_url');
        $apiKey = config('analytics.make.api_key');

        if ($clientId === null || $clientSecret === null || $refreshToken === null) {
            $this->warn('OAuth credentials not configured — skipping check.');

            return self::SUCCESS;
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        if (! $response->successful() || $response->json('error') !== null) {
            $this->error('OAuth2 refresh token expired or invalid — sending alert.');

            if ($webhookUrl !== null && $apiKey !== null) {
                Http::withHeaders(['x-make-apikey' => $apiKey])->post($webhookUrl, [
                    'error' => 'Automated Checker: OAuth2 Refresh Token for analytics (stats.reisinger.pictures) has expired or is invalid!',
                    'formatted_message' => 'System Alert - Check Portainer Logs.',
                ]);
            }

            return self::FAILURE;
        }

        $this->info('OAuth2 token is valid.');

        return self::SUCCESS;
    }
}
