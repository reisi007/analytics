<?php

namespace App\Services;

use App\Models\Event;
use App\Models\PageView;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class StatsAggregator
{
    public function summary(string $site, Carbon $from, Carbon $to): array
    {
        $pageviews = PageView::query()->where('site', $site)->whereBetween('created_at', [$from, $to]);
        $events = Event::query()->where('site', $site)->whereBetween('created_at', [$from, $to]);

        $totals = [
            'pageviews' => (clone $pageviews)->count(),
            'unique' => (clone $pageviews)->distinct('session_hash')->count('session_hash'),
            'events' => (clone $events)->count(),
        ];

        return [
            'site' => $site,
            'from' => $from->toIso8601String(),
            'to' => $to->toIso8601String(),
            'totals' => $totals,
            'series' => $this->series($site, $from, $to),
            'top_pages' => $this->topPages($pageviews, 10),
            'top_referrers' => $this->topReferrers($pageviews, 10),
            'top_events' => $this->topEvents($events, 10),
        ];
    }

    public function events(string $site, Carbon $from, Carbon $to, ?string $name = null, int $perPage = 20): LengthAwarePaginator
    {
        return Event::query()
            ->where('site', $site)
            ->whereBetween('created_at', [$from, $to])
            ->when($name, fn ($q) => $q->where('name', $name))
            ->latest('id')
            ->paginate($perPage);
    }

    public function realtime(?string $site, int $minutes): array
    {
        $since = now()->subMinutes($minutes);

        $pageviews = PageView::query()->when($site, fn ($q) => $q->where('site', $site))->where('created_at', '>=', $since);
        $events = Event::query()->when($site, fn ($q) => $q->where('site', $site))->where('created_at', '>=', $since);

        return [
            'window_minutes' => $minutes,
            'pageviews' => (clone $pageviews)->count(),
            'unique' => (clone $pageviews)->distinct('session_hash')->count('session_hash'),
            'events' => (clone $events)->count(),
            'recent' => $this->recentActivity($site, $since),
        ];
    }

    private function series(string $site, Carbon $from, Carbon $to): Collection
    {
        $rows = PageView::query()
            ->where('site', $site)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as pageviews, COUNT(DISTINCT session_hash) as unique_visitors')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $events = Event::query()
            ->where('site', $site)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $series = collect();

        for ($day = $from->copy(); $day->lte($to); $day->addDay()) {
            $key = $day->format('Y-m-d');
            $series->push([
                'date' => $key,
                'pageviews' => (int) ($rows[$key]->pageviews ?? 0),
                'unique' => (int) ($rows[$key]->unique_visitors ?? 0),
                'events' => (int) ($events[$key]->count ?? 0),
            ]);
        }

        return $series;
    }

    private function topPages($query, int $limit): Collection
    {
        return (clone $query)
            ->selectRaw('url, COUNT(*) as pageviews')
            ->groupBy('url')
            ->orderByDesc('pageviews')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => ['url' => $row->url, 'pageviews' => (int) $row->pageviews]);
    }

    private function topReferrers($query, int $limit): Collection
    {
        return (clone $query)
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->selectRaw('referrer, COUNT(*) as pageviews')
            ->groupBy('referrer')
            ->orderByDesc('pageviews')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => ['referrer' => $row->referrer, 'pageviews' => (int) $row->pageviews]);
    }

    private function topEvents($query, int $limit): Collection
    {
        return (clone $query)
            ->selectRaw('name, COUNT(*) as events')
            ->groupBy('name')
            ->orderByDesc('events')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'events' => (int) $row->events]);
    }

    private function recentActivity(?string $site, Carbon $since): Collection
    {
        $pageviews = PageView::query()
            ->when($site, fn ($q) => $q->where('site', $site))
            ->where('created_at', '>=', $since)
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn ($pv) => [
                'type' => 'pageview',
                'url' => $pv->url,
                'title' => $pv->title,
                'time' => $pv->created_at?->toIso8601String(),
            ]);

        $events = Event::query()
            ->where('site', $site)
            ->where('created_at', '>=', $since)
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn ($e) => [
                'type' => 'event',
                'name' => $e->name,
                'url' => $e->url,
                'time' => $e->created_at?->toIso8601String(),
            ]);

        return $pageviews->concat($events)->sortByDesc('time')->values();
    }
}
