<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\PageView;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

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
        $this->seedData();

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/summary?site=reisinger.pictures&from={$from}&to={$to}")
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
        $this->seedData();

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/events?site=reisinger.pictures&name=click&from={$from}&to={$to}")
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
        $this->seedData();

        $this->getJson('/api/stats/realtime?site=reisinger.pictures&minutes=60')
            ->assertOk()
            ->assertJsonPath('window_minutes', 60)
            ->assertJsonPath('pageviews', 1)
            ->assertJsonPath('unique', 1)
            ->assertJsonPath('events', 1);
    }
}
