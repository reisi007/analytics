<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Api\TrackController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');

Route::post('/track', [TrackController::class, 'store'])->name('track');

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::post('/auth/me', [AuthController::class, 'me'])->name('auth.me');

    Route::get('/stream', [StreamController::class, 'stream'])->name('stream');

    Route::get('/stats/summary', [StatsController::class, 'summary'])->name('stats.summary');
    Route::get('/stats/events', [StatsController::class, 'events'])->name('stats.events');
    Route::get('/stats/realtime', [StatsController::class, 'realtime'])->name('stats.realtime');
    Route::get('/stats/sites', [StatsController::class, 'sites'])->name('stats.sites');
});
