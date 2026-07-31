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
];
