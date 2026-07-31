<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StatsAggregator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class StatsController extends Controller
{
    public function summary(Request $request, StatsAggregator $aggregator): JsonResponse
    {
        $site = $request->validate(['site' => ['required', 'string', 'max:255']])['site'];

        $from = $request->filled('from')
            ? Carbon::parse($request->query('from'))
            : Carbon::today()->subDays(29);
        $to = $request->filled('to')
            ? Carbon::parse($request->query('to'))
            : Carbon::today();

        return response()->json($aggregator->summary($site, $from->startOfDay(), $to->endOfDay()));
    }

    public function events(Request $request, StatsAggregator $aggregator): JsonResponse
    {
        $site = $request->validate(['site' => ['required', 'string', 'max:255']])['site'];

        $from = $request->filled('from')
            ? Carbon::parse($request->query('from'))
            : Carbon::today()->subDays(29);
        $to = $request->filled('to')
            ? Carbon::parse($request->query('to'))
            : Carbon::today();

        $name = $request->filled('name') ? (string) $request->query('name') : null;
        $page = max(1, (int) $request->query('page', 1));

        return response()->json($aggregator->events($site, $from->startOfDay(), $to->endOfDay(), $name, 20, ['page' => $page]));
    }

    public function realtime(Request $request, StatsAggregator $aggregator): JsonResponse
    {
        $site = $request->query('site');
        if (is_string($site) && $site === '') {
            $site = null;
        }

        $minutes = (int) $request->query('minutes', config('analytics.stream.realtime_window_minutes', 30));

        return response()->json($aggregator->realtime(is_string($site) ? $site : null, $minutes));
    }
}
