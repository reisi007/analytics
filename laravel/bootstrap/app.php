<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'ingest',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: explode(',', (string) env('TRUSTED_PROXIES', '172.18.0.0/16,127.0.0.1')));

        $middleware->remove(HandleCors::class);

        $middleware->alias([
            'track.cors' => \App\Http\Middleware\TrackCors::class,
        ]);

        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('ingest/*') ? null : '/login',
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('ingest/*'),
        );
    })->create();
