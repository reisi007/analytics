<?php

namespace App\Support;

use App\Models\Site;
use Illuminate\Http\Request;

class SiteDetector
{
    private static ?array $map = null;

    /**
     * Normalize a host to its canonical site name.
     * Unknown hosts are blocked (null) — the site list in the DB is the
     * source of truth and doubles as the CORS whitelist.
     */
    public static function fromHost(?string $host): ?string
    {
        if ($host === null || $host === '') {
            return null;
        }

        $host = static::normalize($host);

        if ($host === '') {
            return null;
        }

        $map = static::map();

        return $map[$host] ?? null;
    }

    /**
     * Derive the site from the HTTP Referer header of a tracking request.
     * The referer is the URL of the page that embedded the tracker.
     * A missing/empty Referer is not tracked (blocked).
     */
    public static function fromRequest(Request $request): ?string
    {
        $referer = $request->headers->get('referer');

        if ($referer === null || $referer === '') {
            return null;
        }

        return static::fromHost(parse_url($referer, PHP_URL_HOST) ?: null);
    }

    /**
     * Drop the cached alias→site map (e.g. after seeding or tests).
     */
    public static function flush(): void
    {
        static::$map = null;
    }

    private static function normalize(string $host): string
    {
        $host = strtolower(trim($host));
        $host = preg_replace('/:\d+$/', '', $host) ?? $host;
        $host = preg_replace('/^www\./', '', $host) ?? $host;

        return $host;
    }

    /**
     * @return array<string, string> normalized alias => canonical site
     */
    private static function map(): array
    {
        if (static::$map === null) {
            static::$map = static::buildMap();
        }

        return static::$map;
    }

    /**
     * @return array<string, string> normalized alias => canonical site
     */
    private static function buildMap(): array
    {
        $map = [];

        foreach (Site::all() as $site) {
            $normalized = static::normalize($site->site);

            if ($normalized !== '') {
                $map[$normalized] = $site->site;
            }

            foreach ($site->aliases ?? [] as $alias) {
                $normalizedAlias = static::normalize($alias);

                if ($normalizedAlias !== '') {
                    $map[$normalizedAlias] = $site->site;
                }
            }
        }

        return $map;
    }
}
