<?php

namespace Tests\Feature;

use App\Models\PageView;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackTest extends TestCase
{
    use RefreshDatabase;

    public function test_pageview_ingested_with_site_from_referer(): void
    {
        $this->postJson('/api/track', [
            'type' => 'pageview',
            'url' => '/foo',
            'title' => 'Foo',
        ], ['Referer' => 'https://reisinger.pictures/'])
            ->assertStatus(204);

        $this->assertDatabaseHas('pageviews', [
            'site' => 'reisinger.pictures',
            'url' => '/foo',
        ]);
    }

    public function test_event_ingested(): void
    {
        $this->postJson('/api/track', [
            'type' => 'event',
            'name' => 'click',
            'url' => '/foo',
            'payload' => ['x' => 1],
        ], ['Referer' => 'https://all-the.rest/'])
            ->assertStatus(204);

        $this->assertDatabaseHas('events', [
            'site' => 'all-the.rest',
            'name' => 'click',
        ]);
    }

    public function test_invalid_payload_returns_422(): void
    {
        $this->postJson('/api/track', [
            'url' => '/foo',
        ], ['Referer' => 'https://reisinger.pictures/'])
            ->assertStatus(422);
    }

    public function test_session_hash_stable_within_same_day(): void
    {
        $this->postJson('/api/track', [
            'type' => 'pageview',
            'url' => '/foo',
        ], ['Referer' => 'https://reisinger.pictures/', 'User-Agent' => 'TestAgent']);

        $this->postJson('/api/track', [
            'type' => 'pageview',
            'url' => '/bar',
        ], ['Referer' => 'https://reisinger.pictures/', 'User-Agent' => 'TestAgent']);

        $this->assertSame(1, PageView::all()->pluck('session_hash')->unique()->count());
    }

    public function test_unknown_referer_host_is_kept(): void
    {
        $this->postJson('/api/track', [
            'type' => 'pageview',
            'url' => '/x',
        ], ['Referer' => 'https://localhost:8081/x'])
            ->assertStatus(204);

        $this->assertDatabaseHas('pageviews', [
            'site' => 'localhost',
            'url' => '/x',
        ]);
    }
}
