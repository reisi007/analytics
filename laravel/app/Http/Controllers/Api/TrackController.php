<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\PageView;
use App\Support\SiteDetector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $sessionHash = $this->sessionHash($request);

        if ($validated['type'] === 'pageview') {
            PageView::create([
                'site' => $site,
                'url' => $validated['url'],
                'title' => $validated['title'] ?? null,
                'referrer' => $validated['referrer'] ?? null,
                'screen_width' => $validated['screen']['width'] ?? null,
                'screen_height' => $validated['screen']['height'] ?? null,
                'language' => $validated['lang'] ?? null,
                'session_hash' => $sessionHash,
            ]);
        } else {
            Event::create([
                'site' => $site,
                'name' => $validated['name'],
                'url' => $validated['url'],
                'payload' => $validated['payload'] ?? [],
                'session_hash' => $sessionHash,
            ]);
        }

        return response()->json(null, 204, ['Access-Control-Allow-Origin' => $this->refererOrigin($request)]);
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

    private function sessionHash(Request $request): string
    {
        $raw = $request->ip().'|'.($request->userAgent() ?? '').'|'.now()->toDateString();

        return hash('sha256', $raw);
    }

    /**
     * Full origin (scheme + host) of the Referer header, echoed back as the
     * CORS allow-origin value for the tracking response.
     */
    private function refererOrigin(Request $request): string
    {
        $referer = $request->headers->get('referer');

        if ($referer === null || $referer === '') {
            return '*';
        }

        $scheme = (string) (parse_url($referer, PHP_URL_SCHEME) ?? '');
        $host = (string) (parse_url($referer, PHP_URL_HOST) ?? '');

        return $scheme === '' || $host === '' ? '*' : $scheme.'://'.$host;
    }
}
