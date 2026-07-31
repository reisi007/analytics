<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\PageView;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    private function login(): string
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        return $this->postJson('/api/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertOk()->json('token');
    }

    private function authedHeaders(string $token): array
    {
        return ['Authorization' => "Bearer {$token}"];
    }

    private function seedData(): void
    {
        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
            'created_at' => now()->subDay(),
        ]);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/bar',
            'title' => 'Bar',
            'session_hash' => 'hash-b',
            'created_at' => now()->subMinutes(30),
        ]);

        Event::create([
            'site' => 'reisinger.pictures',
            'name' => 'click',
            'url' => '/foo',
            'payload' => ['x' => 1],
            'session_hash' => 'hash-a',
            'created_at' => now()->subMinutes(30),
        ]);
    }

    public function test_summary_returns_totals_and_tops(): void
    {
        $token = $this->login();
        $this->seedData();

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/summary?site=reisinger.pictures&from={$from}&to={$to}", $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('site', 'reisinger.pictures')
            ->assertJsonPath('totals.pageviews', 2)
            ->assertJsonPath('totals.unique', 2)
            ->assertJsonPath('totals.events', 1)
            ->assertJsonCount(3, 'series')
            ->assertJsonFragment(['url' => '/foo', 'pageviews' => 1])
            ->assertJsonPath('top_events.0.name', 'click');
    }

    public function test_events_paginated(): void
    {
        $token = $this->login();
        $this->seedData();

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/events?site=reisinger.pictures&name=click&from={$from}&to={$to}", $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('data.0.name', 'click')
            ->assertJsonPath('total', 1)
            ->assertJsonStructure([
                'current_page',
                'data',
                'first_page_url',
                'last_page',
                'per_page',
                'total',
            ]);
    }

    public function test_realtime_counts(): void
    {
        $token = $this->login();
        $this->seedData();

        $this->getJson('/api/stats/realtime?site=reisinger.pictures&minutes=60', $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('window_minutes', 60)
            ->assertJsonPath('pageviews', 1)
            ->assertJsonPath('unique', 1)
            ->assertJsonPath('events', 1);
    }

    public function test_summary_without_site_aggregates_all_sites(): void
    {
        $token = $this->login();

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/a',
            'title' => 'A',
            'session_hash' => 'hash-a',
            'created_at' => now()->subMinutes(30),
        ]);

        PageView::create([
            'site' => 'dev.reisinger.pictures',
            'url' => '/b',
            'title' => 'B',
            'session_hash' => 'hash-b',
            'created_at' => now()->subMinutes(30),
        ]);

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/summary?from={$from}&to={$to}", $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonPath('totals.pageviews', 2)
            ->assertJsonPath('totals.unique', 2)
            ->assertJsonPath('site', null);
    }

    public function test_sites_lists_all_sites(): void
    {
        $token = $this->login();

        Site::create([
            'site' => 'reisinger.pictures',
            'aliases' => ['reisinger.pictures', 'www.reisinger.pictures'],
        ]);

        Site::create([
            'site' => 'all-the.rest',
            'aliases' => ['all-the.rest'],
        ]);

        PageView::create([
            'site' => 'dev.reisinger.pictures',
            'url' => '/dev',
            'title' => 'Dev',
            'session_hash' => 'hash-dev',
            'created_at' => now(),
        ]);

        $this->getJson('/api/stats/sites', $this->authedHeaders($token))
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonFragment(['dev.reisinger.pictures'])
            ->assertJsonFragment(['reisinger.pictures'])
            ->assertJsonFragment(['all-the.rest']);
    }

    public function test_summary_is_cached(): void
    {
        $token = $this->login();

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/cached',
            'title' => 'Cached',
            'session_hash' => 'hash-cached',
            'created_at' => now(),
        ]);

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');
        $url = "/api/stats/summary?site=reisinger.pictures&from={$from}&to={$to}";

        $first = $this->getJson($url, $this->authedHeaders($token))
            ->assertOk()
            ->json('totals.pageviews');
        $this->assertSame(1, $first);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/cached-2',
            'title' => 'Cached 2',
            'session_hash' => 'hash-cached-2',
            'created_at' => now(),
        ]);

        $second = $this->getJson($url, $this->authedHeaders($token))
            ->assertOk()
            ->json('totals.pageviews');
        $this->assertSame(1, $second);

        Cache::flush();

        $third = $this->getJson($url, $this->authedHeaders($token))
            ->assertOk()
            ->json('totals.pageviews');
        $this->assertSame(2, $third);
    }
}
