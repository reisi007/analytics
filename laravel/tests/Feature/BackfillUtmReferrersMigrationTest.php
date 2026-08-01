<?php

namespace Tests\Feature;

use App\Models\PageView;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackfillUtmReferrersMigrationTest extends TestCase
{
    use RefreshDatabase;

    private function migration(): object
    {
        return require database_path('migrations/2026_08_02_000002_backfill_utm_referrers.php');
    }

    public function test_backfill_sets_referrer_from_utm_source(): void
    {
        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo/?utm_source=newsletter&a=1',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
        ]);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/bar',
            'title' => 'Bar',
            'session_hash' => 'hash-b',
        ]);

        $this->migration()->up();

        $this->assertDatabaseHas('pageviews', [
            'url' => '/foo/?utm_source=newsletter&a=1',
            'referrer' => 'newsletter',
        ]);
        $this->assertDatabaseHas('pageviews', [
            'url' => '/bar',
            'referrer' => null,
        ]);
    }

    public function test_backfill_overwrites_existing_referrer(): void
    {
        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo/?utm_source=newsletter&a=1',
            'title' => 'Foo',
            'referrer' => 'https://example.com/',
            'session_hash' => 'hash-a',
        ]);

        $this->migration()->up();

        $this->assertDatabaseHas('pageviews', [
            'url' => '/foo/?utm_source=newsletter&a=1',
            'referrer' => 'newsletter',
        ]);
    }

    public function test_backfill_is_idempotent(): void
    {
        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo/?utm_source=newsletter&a=1',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
        ]);

        $this->migration()->up();
        $this->migration()->up();

        $this->assertDatabaseHas('pageviews', [
            'url' => '/foo/?utm_source=newsletter&a=1',
            'referrer' => 'newsletter',
        ]);
    }
}
