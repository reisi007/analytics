<?php

namespace Tests\Feature;

use App\Models\PageView;
use App\Models\Site;
use App\Support\SiteDetector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        SiteDetector::flush();

        Site::create([
            'site' => 'reisinger.pictures',
            'aliases' => ['reisinger.pictures', 'www.reisinger.pictures'],
        ]);

        Site::create([
            'site' => 'all-the.rest',
            'aliases' => ['all-the.rest'],
        ]);
    }

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

    public function test_allowed_referrer_returns_origin_cors_header(): void
    {
        $this->postJson('/api/track', [
            'type' => 'pageview',
            'url' => '/foo',
        ], ['Referer' => 'https://reisinger.pictures/'])
            ->assertStatus(204)
            ->assertHeader('Access-Control-Allow-Origin', 'https://reisinger.pictures');

        $this->assertDatabaseHas('pageviews', [
            'site' => 'reisinger.pictures',
            'url' => '/foo',
        ]);
    }

    public function test_www_alias_maps_to_canonical(): void
    {
        $this->postJson('/api/track', [
            'type' => 'pageview',
            'url' => '/x',
        ], ['Referer' => 'https://www.reisinger.pictures/x'])
            ->assertStatus(204);

        $this->assertDatabaseHas('pageviews', [
            'site' => 'reisinger.pictures',
            'url' => '/x',
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

    public function test_unknown_referrer_host_is_blocked(): void
    {
        $this->postJson('/api/track', [
            'type' => 'pageview',
            'url' => '/x',
        ], ['Referer' => 'https://evil.example/'])
            ->assertStatus(403)
            ->assertHeaderMissing('Access-Control-Allow-Origin');

        $this->assertDatabaseCount('pageviews', 0);
    }
}
