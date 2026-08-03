<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\PageView;
use App\Support\SiteDetector;
use App\Support\Url;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TrackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $site = SiteDetector::fromRequest($request);

        if ($site === null) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $payload = $this->payload($request);

        $validated = validator($payload, [
            'type' => ['required', 'in:pageview,event'],
            'url' => ['required', 'string', 'max:2048'],
            'title' => ['nullable', 'string', 'max:500'],
            'referrer' => ['nullable', 'string', 'max:2048'],
            'screen.width' => ['nullable', 'integer', 'min:1', 'max:20000'],
            'screen.height' => ['nullable', 'integer', 'min:1', 'max:20000'],
            'lang' => ['nullable', 'string', 'max:20'],
            'name' => ['nullable', 'string', 'max:100', 'required_if:type,event'],
            'payload' => ['nullable', 'array'],
        ])->validate();

        $eventPayload = $validated['payload'] ?? [];
        if ($this->payloadTooDeep($eventPayload)) {
            throw ValidationException::withMessages(['payload' => 'payload.too_deep']);
        }
        if (mb_strlen(json_encode($eventPayload, JSON_UNESCAPED_UNICODE)) > 65536) {
            throw ValidationException::withMessages(['payload' => 'payload.too_large']);
        }

        $sessionHash = $this->sessionHash($site, $request);

        $isPageview = $validated['type'] === 'pageview'
            || ($validated['type'] === 'event' && $validated['name'] === 'pageview');

        if ($isPageview) {
            $this->recordPageview($site, $validated, $sessionHash);
        } else {
            Event::create([
                'site' => $site,
                'name' => $validated['name'],
                'url' => $validated['url'],
                'payload' => $eventPayload,
                'session_hash' => $sessionHash,
            ]);
        }

        return response()->json(null, 204);
    }

    /**
     * Ein `pageview`-Event wird wie eine Seitenansicht gezählt. Dedup: Pro Besucher
     * (session_hash) zählt eine URL nur, wenn der letzte getrackte Pageview eine
     * andere URL hatte — fängt den SPA-Doppelfall (Auto-Pageview + Router-Event)
     * und Seiten-Reloads ab. Trifft in beiden Reihenfolgen zu.
     */
    private function recordPageview(string $site, array $validated, string $sessionHash): void
    {
        $url = $validated['url'];

        $last = PageView::query()
            ->where('site', $site)
            ->where('session_hash', $sessionHash)
            ->latest('id')
            ->first();

        if ($last !== null && $last->url === $url) {
            return;
        }

        PageView::create([
            'site' => $site,
            'url' => $url,
            'title' => $validated['title'] ?? null,
            'referrer' => Url::utmSource($url) ?? ($validated['referrer'] ?? null),
            'screen_width' => $validated['screen']['width'] ?? null,
            'screen_height' => $validated['screen']['height'] ?? null,
            'language' => $validated['lang'] ?? null,
            'session_hash' => $sessionHash,
        ]);
    }

    /**
     * The tracker sends a `text/plain` body (simple CORS request).
     * Laravel only auto-parses JSON for application/json, so we parse the raw body.
     */
    private function payload(Request $request): array
    {
        $raw = $request->getContent();

        if ($raw === '') {
            return $request->all();
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : $request->all();
    }

    private function sessionHash(string $site, Request $request): string
    {
        $raw = $site.'|'.$request->ip().'|'.($request->userAgent() ?? '').'|'.now()->toDateString();

        return hash_hmac('sha256', $raw, (string) config('app.key'));
    }

    private function payloadTooDeep(array $payload): bool
    {
        return $this->payloadDepth($payload) > 5;
    }

    private function payloadDepth(array $value, int $depth = 1): int
    {
        $max = $depth;

        foreach ($value as $item) {
            if (is_array($item)) {
                $max = max($max, $this->payloadDepth($item, $depth + 1));
            }
        }

        return $max;
    }
}
