<?php

namespace App\Providers;

use App\Mail\Transports\GmailRestTransport;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Den Custom Gmail-REST-Transport in Laravel's Mail-Manager integrieren
        Mail::extend('gmail_rest', function (array $config) {
            return new GmailRestTransport(
                $config['client_id'] ?? env('OAUTH_CLIENT_ID'),
                $config['client_secret'] ?? env('OAUTH_CLIENT_SECRET'),
                $config['refresh_token'] ?? env('OAUTH_REFRESH_TOKEN')
            );
        });
    }
}
