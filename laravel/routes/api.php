<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\SitesController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Api\TrackController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('auth.login');

Route::post('/track', [TrackController::class, 'store'])->middleware(['throttle:track', 'track.cors'])->name('track');

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::post('/auth/me', [AuthController::class, 'me'])->name('auth.me');
    Route::post('/auth/stream-token', [AuthController::class, 'streamToken'])->name('auth.stream-token');

    Route::get('/config/sites', [ConfigController::class, 'sites'])->name('config.sites');

    Route::get('/stream', [StreamController::class, 'stream'])->name('stream');

    Route::get('/stats/summary', [StatsController::class, 'summary'])->name('stats.summary');
    Route::get('/stats/events', [StatsController::class, 'events'])->name('stats.events');
    Route::get('/stats/realtime', [StatsController::class, 'realtime'])->name('stats.realtime');
    Route::get('/stats/sites', [StatsController::class, 'sites'])->name('stats.sites');

    Route::get('/sites', [SitesController::class, 'index'])->name('sites.index');
    Route::post('/sites', [SitesController::class, 'store'])->name('sites.store');
    Route::put('/sites/{site}', [SitesController::class, 'update'])->name('sites.update');
    Route::delete('/sites/{site}', [SitesController::class, 'destroy'])->name('sites.destroy');
});
