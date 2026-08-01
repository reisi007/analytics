<?php

namespace App\Support;

class Url
{
    public static function path(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH);

        return $path === false || $path === null ? $url : $path;
    }

    public static function utmSource(string $url): ?string
    {
        $query = parse_url($url, PHP_URL_QUERY);

        if ($query === false || $query === null) {
            return null;
        }

        parse_str($query, $params);

        $value = $params['utm_source'] ?? null;

        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return $value;
    }
}
