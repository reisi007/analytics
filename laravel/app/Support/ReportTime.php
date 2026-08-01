<?php

namespace App\Support;

use DateTimeZone;
use Illuminate\Support\Carbon;

final class ReportTime
{
    public static function timezone(): string
    {
        $tz = (string) config('analytics.timezone', 'UTC');

        return in_array($tz, DateTimeZone::listIdentifiers(), true) ? $tz : 'UTC';
    }

    public static function now(): Carbon
    {
        return Carbon::now(self::timezone());
    }

    public static function today(): Carbon
    {
        return Carbon::today(self::timezone());
    }

    public static function parse(string $date): Carbon
    {
        return Carbon::parse($date, self::timezone());
    }

    /**
     * Parse a `Y-m-d` calendar day as a UTC day boundary (start of day).
     * Used for API query bounds (`from`/`to`) which are UTC calendar days,
     * independent of the report timezone.
     */
    public static function parseUtc(string $date): Carbon
    {
        return Carbon::createFromFormat('Y-m-d', $date, 'UTC')->startOfDay();
    }
}
