<?php

namespace App\Support;

use Illuminate\Http\Request;

class Site
{
    /**
     * Normalize a host to its canonical site name.
     * Unknown hosts are kept as-is (lowercase, without www. and port) so
     * that local development / E2E stacks (localhost) keep working.
     */
    public static function fromHost(?string $host): ?string
    {
        if ($host === null || $host === '') {
            return null;
        }

        $host = strtolower(trim($host));
        $host = preg_replace('/:\d+$/', '', $host) ?? $host;
        $host = preg_replace('/^www\./', '', $host) ?? $host;

        foreach (config('analytics.sites', []) as $site => $aliases) {
            if ($host === $site || in_array($host, $aliases, true)) {
                return $site;
            }
        }

        return $host === '' ? null : $host;
    }

    /**
     * Derive the site from the HTTP Referer header of a tracking request.
     * The referer is the URL of the page that embedded the tracker.
     */
    public static function fromRequest(Request $request): ?string
    {
        $referer = $request->headers->get('referer');

        if ($referer === null || $referer === '') {
            return null;
        }

        return static::fromHost(parse_url($referer, PHP_URL_HOST) ?: null);
    }
}
