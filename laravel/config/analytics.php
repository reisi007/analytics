<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Sites
    |--------------------------------------------------------------------------
    |
    | Mapping of canonical site names to known host aliases. Used by the
    | dashboard to map its own host (stats.*) back to the tracked site.
    | The tracker itself does NOT send a site — the API derives the site
    | from the HTTP Referer header of the tracking request.
    |
    */

    'sites' => [
        'reisinger.pictures' => [
            'reisinger.pictures',
            'www.reisinger.pictures',
            'stats.reisinger.pictures',
        ],
        'all-the.rest' => [
            'all-the.rest',
            'www.all-the.rest',
            'stats.all-the.rest',
        ],
    ],

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
];
