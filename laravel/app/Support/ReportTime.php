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
        return Carbon::now(static::timezone());
    }

    public static function today(): Carbon
    {
        return Carbon::today(static::timezone());
    }

    public static function parse(string $date): Carbon
    {
        return Carbon::parse($date, static::timezone());
    }
}
