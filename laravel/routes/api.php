<?php

use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Api\TrackController;
use Illuminate\Support\Facades\Route;

Route::post('/track', [TrackController::class, 'store'])->name('track');
Route::get('/stream', [StreamController::class, 'stream'])->name('stream');
Route::get('/stats/summary', [StatsController::class, 'summary'])->name('stats.summary');
Route::get('/stats/events', [StatsController::class, 'events'])->name('stats.events');
Route::get('/stats/realtime', [StatsController::class, 'realtime'])->name('stats.realtime');
