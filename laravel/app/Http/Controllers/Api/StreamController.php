<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\PageView;
use App\Services\StatsAggregator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StreamController extends Controller
{
    public function stream(Request $request, StatsAggregator $aggregator): Response
    {
        $request->validate(['site' => ['nullable', 'string', 'max:255']]);

        if ((auth('api')->payload()->get('scope') ?? '') !== 'stream') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $site = $request->query('site');
        if (is_string($site) && $site === '') {
            $site = null;
        }

        return new StreamedResponse(function () use ($site, $aggregator) {
            set_time_limit(0);

            $started = microtime(true);
            $maxRuntime = (float) config('analytics.stream.max_runtime');
            $pollSeconds = (float) config('analytics.stream.poll_seconds');
            $windowMinutes = (int) config('analytics.stream.realtime_window_minutes');

            $lastPageviewId = 0;
            $lastEventId = 0;

            while (true) {
                if ($maxRuntime > 0 && microtime(true) - $started >= $maxRuntime) {
                    break;
                }

                if (connection_aborted()) {
                    break;
                }

                $this->send($this->fetchSince($site, $lastPageviewId, $lastEventId));

                $lastPageviewId = PageView::query()->max('id') ?? 0;
                $lastEventId = Event::query()->max('id') ?? 0;

                $this->send(collect([
                    [
                        'type' => 'snapshot',
                        'data' => $aggregator->realtime($site, $windowMinutes),
                        'time' => now()->toIso8601String(),
                    ],
                ]));

                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();

                if ($pollSeconds <= 0) {
                    break;
                }

                usleep((int) ($pollSeconds * 1_000_000));
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function fetchSince(?string $site, int $lastPageviewId, int $lastEventId): Collection
    {
        $pageviews = PageView::query()
            ->when($site, fn ($q) => $q->where('site', $site))
            ->where('id', '>', $lastPageviewId)
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->map(fn ($pv) => [
                'id' => $pv->id,
                'type' => 'pageview',
                'site' => $pv->site,
                'url' => $pv->url,
                'title' => $pv->title,
                'time' => $pv->created_at?->toIso8601String(),
            ]);

        $events = Event::query()
            ->when($site, fn ($q) => $q->where('site', $site))
            ->where('id', '>', $lastEventId)
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'type' => 'event',
                'site' => $e->site,
                'name' => $e->name,
                'url' => $e->url,
                'payload' => $e->payload,
                'time' => $e->created_at?->toIso8601String(),
            ]);

        return $pageviews->concat($events)->sortBy('time')->values();
    }

    private function send(Collection $items): void
    {
        foreach ($items as $item) {
            echo 'data: '.json_encode($item, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n\n";
        }
    }
}
