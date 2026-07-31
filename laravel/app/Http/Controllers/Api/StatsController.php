<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\PageView;
use App\Models\Site;
use App\Services\StatsAggregator;
use App\Support\ReportTime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StatsController extends Controller
{
    public function summary(Request $request, StatsAggregator $aggregator): JsonResponse
    {
        $request->validate(['site' => ['nullable', 'string', 'max:255']]);
        $site = $request->input('site') ?: null;

        $from = $request->filled('from')
            ? ReportTime::parse((string) $request->query('from'))
            : ReportTime::today()->subDays(29);
        $to = $request->filled('to')
            ? ReportTime::parse((string) $request->query('to'))
            : ReportTime::today();

        $from = $from->startOfDay();
        $to = $to->endOfDay();

        $key = 'stats.summary.'.ReportTime::timezone().'.'.($site ?? 'all').'.'.$from->format('Y-m-d').'.'.$to->format('Y-m-d');

        return response()->json(Cache::remember($key, 300, fn () => $aggregator->summary($site, $from, $to)));
    }

    public function events(Request $request, StatsAggregator $aggregator): JsonResponse
    {
        $request->validate(['site' => ['nullable', 'string', 'max:255']]);
        $site = $request->input('site') ?: null;

        $from = $request->filled('from')
            ? ReportTime::parse((string) $request->query('from'))
            : ReportTime::today()->subDays(29);
        $to = $request->filled('to')
            ? ReportTime::parse((string) $request->query('to'))
            : ReportTime::today();

        $name = $request->filled('name') ? (string) $request->query('name') : null;
        $page = max(1, (int) $request->query('page', 1));

        $from = $from->startOfDay();
        $to = $to->endOfDay();

        $key = 'stats.events.'.ReportTime::timezone().'.'.($site ?? 'all').'.'.$from->format('Y-m-d').'.'.$to->format('Y-m-d').'.'.($name ?? 'all').'.'.$page;

        return response()->json(Cache::remember($key, 60, fn () => $aggregator->events($site, $from, $to, $name, 20, $page)->toArray()));
    }

    public function realtime(Request $request, StatsAggregator $aggregator): JsonResponse
    {
        $site = $request->query('site');
        if (is_string($site) && $site === '') {
            $site = null;
        }

        $minutes = (int) $request->query('minutes', config('analytics.stream.realtime_window_minutes', 30));

        $key = 'stats.realtime.'.($site ?? 'all').'.'.$minutes;

        return response()->json(Cache::remember($key, 15, fn () => $aggregator->realtime(is_string($site) ? $site : null, $minutes)));
    }

    public function sites(Request $request): JsonResponse
    {
        $fromPageviews = PageView::query()->distinct()->pluck('site');
        $fromEvents = Event::query()->distinct()->pluck('site');
        $configured = Site::query()->pluck('site');

        $sites = collect($fromPageviews)
            ->merge($fromEvents)
            ->merge($configured)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return response()->json($sites);
    }
}
