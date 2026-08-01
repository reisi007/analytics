<?php

namespace Tests\Feature;

use App\Models\PageView;
use App\Models\Site;
use App\Support\SiteDetector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
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
        $this->postJson('/ingest/track', [
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
        $this->postJson('/ingest/track', [
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
        $this->postJson('/ingest/track', [
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
        $this->postJson('/ingest/track', [
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
        $this->postJson('/ingest/track', [
            'url' => '/foo',
        ], ['Referer' => 'https://reisinger.pictures/'])
            ->assertStatus(422);
    }

    public function test_session_hash_stable_within_same_day(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/foo',
        ], ['Referer' => 'https://reisinger.pictures/', 'User-Agent' => 'TestAgent']);

        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/bar',
        ], ['Referer' => 'https://reisinger.pictures/', 'User-Agent' => 'TestAgent']);

        $this->assertSame(1, PageView::all()->pluck('session_hash')->unique()->count());
    }

    public function test_unknown_referrer_host_is_blocked(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/x',
        ], ['Referer' => 'https://evil.example/'])
            ->assertStatus(403)
            ->assertHeaderMissing('Access-Control-Allow-Origin');

        $this->assertDatabaseCount('pageviews', 0);
    }

    public function test_text_plain_body_is_parsed(): void
    {
        $this->call('POST', '/ingest/track', [], [], [], [
            'HTTP_REFERER' => 'https://reisinger.pictures/',
            'CONTENT_TYPE' => 'text/plain',
        ], json_encode([
            'type' => 'pageview',
            'url' => '/plain',
            'title' => 'Plain',
        ]))->assertStatus(204);

        $this->assertDatabaseHas('pageviews', [
            'site' => 'reisinger.pictures',
            'url' => '/plain',
        ]);
    }

    public function test_missing_referrer_is_blocked(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/x',
        ])->assertStatus(403);

        $this->assertDatabaseCount('pageviews', 0);
    }

    public function test_empty_referrer_is_blocked(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/x',
        ], ['Referer' => ''])->assertStatus(403);

        $this->assertDatabaseCount('pageviews', 0);
    }

    public function test_cors_header_includes_port(): void
    {
        Site::create([
            'site' => 'localhost',
            'aliases' => ['localhost'],
        ]);
        SiteDetector::flush();

        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/foo',
        ], ['Referer' => 'http://localhost:5173/'])
            ->assertStatus(204)
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_payload_too_deep_returns_422(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'event',
            'name' => 'click',
            'url' => '/foo',
            'payload' => ['a' => ['b' => ['c' => ['d' => ['e' => ['f' => 1]]]]]],
        ], ['Referer' => 'https://all-the.rest/'])
            ->assertStatus(422)
            ->assertHeader('Access-Control-Allow-Origin', 'https://all-the.rest');
    }

    public function test_payload_too_large_returns_422(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'event',
            'name' => 'click',
            'url' => '/foo',
            'payload' => ['data' => str_repeat('x', 70000)],
        ], ['Referer' => 'https://all-the.rest/'])
            ->assertStatus(422)
            ->assertHeader('Access-Control-Allow-Origin', 'https://all-the.rest');
    }

    public function test_schema_has_no_ip_column(): void
    {
        $this->assertFalse(Schema::hasColumn('pageviews', 'ip'));
        $this->assertFalse(Schema::hasColumn('events', 'ip'));
    }

    public function test_session_hash_differs_across_days(): void
    {
        $this->travelTo(Carbon::parse('2026-07-01 10:00:00'));

        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/a',
        ], ['Referer' => 'https://reisinger.pictures/', 'User-Agent' => 'TestAgent']);

        $this->travelTo(Carbon::parse('2026-07-02 10:00:00'));

        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/b',
        ], ['Referer' => 'https://reisinger.pictures/', 'User-Agent' => 'TestAgent']);

        $this->assertSame(2, PageView::query()->orderBy('id')->pluck('session_hash')->unique()->count());
    }

    public function test_utm_source_becomes_referrer_overriding_client_referrer(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/shootings/akt/?utm_source=newsletter&subject_prefix=AKT',
            'title' => 'AKT',
            'referrer' => 'https://example.com/',
        ], ['Referer' => 'https://reisinger.pictures/'])
            ->assertStatus(204);

        $this->assertDatabaseHas('pageviews', [
            'site' => 'reisinger.pictures',
            'url' => '/shootings/akt/?utm_source=newsletter&subject_prefix=AKT',
            'referrer' => 'newsletter',
        ]);
    }

    public function test_client_referrer_used_when_no_utm_source(): void
    {
        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/shootings/akt/',
            'title' => 'AKT',
            'referrer' => 'https://example.com/',
        ], ['Referer' => 'https://reisinger.pictures/'])
            ->assertStatus(204);

        $this->assertDatabaseHas('pageviews', [
            'site' => 'reisinger.pictures',
            'url' => '/shootings/akt/',
            'referrer' => 'https://example.com/',
        ]);
    }

    public function test_token_not_leaked_in_error_response(): void
    {
        $token = 'secrettokenvalue123';

        $this->getJson("/ingest/stats/summary?token={$token}")
            ->assertStatus(401)
            ->assertDontSee($token);
    }
}
