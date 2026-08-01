<?php

namespace App\Http\Middleware;

use App\Support\SiteDetector;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class TrackCors
{
    /**
     * Echo the Referer origin back as `Access-Control-Allow-Origin` for the
     * tracking response — but only when the Referer host is a known site.
     * Unknown/missing Referer responses stay without the header (403).
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $response = $next($request);
        } catch (ValidationException $e) {
            $response = $e->getResponse();
        }

        if ($this->isAllowedReferer($request)) {
            $response->headers->set('Access-Control-Allow-Origin', $this->refererOrigin((string) $request->headers->get('referer')));
        }

        return $response;
    }

    private function isAllowedReferer(Request $request): bool
    {
        $referer = $request->headers->get('referer');

        if ($referer === null || $referer === '') {
            return false;
        }

        return SiteDetector::fromHost(parse_url($referer, PHP_URL_HOST) ?: null) !== null;
    }

    private function refererOrigin(string $referer): string
    {
        $scheme = (string) (parse_url($referer, PHP_URL_SCHEME) ?? '');
        $host = (string) (parse_url($referer, PHP_URL_HOST) ?? '');
        $port = parse_url($referer, PHP_URL_PORT);

        return $scheme.'://'.$host.($port ? ':'.$port : '');
    }
}
