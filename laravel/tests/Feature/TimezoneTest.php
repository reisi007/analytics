<?php

namespace Tests\Feature;

use App\Models\PageView;
use App\Models\User;
use App\Support\ReportTime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TimezoneTest extends TestCase
{
    use RefreshDatabase;

    private function login(): string
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        return $this->postJson('/ingest/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertOk()->json('token');
    }

    private function authedHeaders(string $token): array
    {
        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_utc_default_buckets_midnight_event_previous_day(): void
    {
        config(['analytics.timezone' => 'UTC']);
        $token = $this->login();

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
            'created_at' => Carbon::parse('2026-07-30 22:30:00', 'UTC'),
        ]);

        $this->getJson('/ingest/stats/summary?site=reisinger.pictures&from=2026-07-30&to=2026-07-31', $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('totals.pageviews', 1)
            ->assertJsonPath('series.0.date', '2026-07-30')
            ->assertJsonPath('series.0.pageviews', 1);
    }

    public function test_from_to_are_utc_calendar_days_with_berlin_series_buckets(): void
    {
        config(['analytics.timezone' => 'Europe/Berlin']);
        $token = $this->login();

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
            'created_at' => Carbon::parse('2026-07-30 22:30:00', 'UTC'),
        ]);

        // from/to sind UTC-Kalendertage: 22:30 UTC (00:30 Berlin am Folgetag)
        // liegt im UTC-Tag 2026-07-30 und wird über from/to gezählt.
        $this->getJson('/ingest/stats/summary?site=reisinger.pictures&from=2026-07-30&to=2026-07-30', $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('totals.pageviews', 1);

        // Die Series-Gruppierung bleibt Report-TZ (Europe/Berlin): der Treffer
        // um 22:30 UTC wird als 2026-07-31 gebucktet, auch wenn die Query-Bounds
        // in UTC liegen.
        $this->getJson('/ingest/stats/summary?site=reisinger.pictures&from=2026-07-30&to=2026-07-31', $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonCount(2, 'series')
            ->assertJsonPath('series.0.date', '2026-07-30')
            ->assertJsonPath('series.0.pageviews', 0)
            ->assertJsonPath('series.1.date', '2026-07-31')
            ->assertJsonPath('series.1.pageviews', 1);
    }

    public function test_berlin_range_filter_respects_utc_midnight(): void
    {
        config(['analytics.timezone' => 'Europe/Berlin']);
        $token = $this->login();

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
            'created_at' => Carbon::parse('2026-07-30 22:00:00', 'UTC'),
        ]);

        // 22:00 UTC liegt im UTC-Tag 2026-07-30 (in Berlin bereits der 31.).
        $this->getJson('/ingest/stats/summary?site=reisinger.pictures&from=2026-07-30&to=2026-07-30', $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('totals.pageviews', 1);

        $this->getJson('/ingest/stats/summary?site=reisinger.pictures&from=2026-07-31&to=2026-07-31', $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('totals.pageviews', 0);
    }

    public function test_berlin_weekly_report_range_uses_local_week(): void
    {
        config(['analytics.timezone' => 'Europe/Berlin']);

        $this->assertSame(
            '2026-07-30 22:00:00',
            ReportTime::parse('2026-07-31')->startOfDay()->utc()->toDateTimeString(),
        );

        $from = ReportTime::now()->startOfWeek()->subWeek();
        $to = ReportTime::now()->startOfWeek();

        $this->assertSame(1, (int) $to->format('N'));
        $this->assertSame('00:00:00', $to->format('H:i:s'));
        $this->assertSame(7, (int) $from->diffInDays($to));
        $this->assertStringContainsString('+00:00', $from->utc()->toIso8601String());
        $this->assertStringContainsString('+00:00', $to->utc()->toIso8601String());
    }
}
