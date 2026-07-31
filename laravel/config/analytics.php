<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Realtime stream (SSE)
    |--------------------------------------------------------------------------
    */

    'stream' => [
        'poll_seconds' => (int) env('STREAM_POLL_SECONDS', 2),
        'max_runtime' => (int) env('STREAM_MAX_RUNTIME', 55),
        'realtime_window_minutes' => (int) env('STREAM_WINDOW_MINUTES', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Weekly report
    |--------------------------------------------------------------------------
    */

    'report' => [
        'email' => env('REPORT_EMAIL', env('MAIL_FROM_ADDRESS')),
        'schedule' => env('REPORT_SCHEDULE', 'monday 09:00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Report timezone (day boundaries for aggregation & reports)
    |--------------------------------------------------------------------------
    */

    'timezone' => env('ANALYTICS_TIMEZONE', 'Europe/Berlin'),

    /*
    |--------------------------------------------------------------------------
    | Gmail OAuth2 (gmail_rest mailer) token check
    |--------------------------------------------------------------------------
    */

    'oauth' => [
        'client_id' => env('OAUTH_CLIENT_ID'),
        'client_secret' => env('OAUTH_CLIENT_SECRET'),
        'refresh_token' => env('OAUTH_REFRESH_TOKEN'),
    ],

    'make' => [
        'webhook_url' => env('MAKE_WEBHOOK_URL'),
        'api_key' => env('MAKE_API_KEY'),
    ],
];
