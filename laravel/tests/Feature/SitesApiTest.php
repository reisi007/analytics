<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\PageView;
use App\Models\Site;
use App\Models\User;
use App\Support\SiteDetector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SitesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sites_index_requires_authentication(): void
    {
        $this->getJson('/ingest/sites')
            ->assertUnauthorized();
    }

    public function test_sites_index_returns_sites_with_aliases(): void
    {
        Site::create([
            'site' => 'reisinger.pictures',
            'aliases' => ['www.reisinger.pictures', 'stats.reisinger.pictures'],
        ]);

        Site::create([
            'site' => 'all-the.rest',
            'aliases' => ['www.all-the.rest', 'stats.all-the.rest'],
        ]);

        $this->getJson('/ingest/sites', ['Authorization' => "Bearer {$this->login()}"])
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonStructure([
                '*' => ['id', 'site', 'aliases', 'created_at'],
            ])
            ->assertJson([
                ['site' => 'all-the.rest', 'aliases' => ['www.all-the.rest', 'stats.all-the.rest']],
                ['site' => 'reisinger.pictures', 'aliases' => ['www.reisinger.pictures', 'stats.reisinger.pictures']],
            ]);
    }

    public function test_sites_store_creates_site(): void
    {
        $token = $this->login();

        $this->postJson('/ingest/sites', [
            'site' => 'new.test',
            'aliases' => ['new.test', 'www.new.test'],
        ], ['Authorization' => "Bearer {$token}"])
            ->assertStatus(201)
            ->assertJson([
                'site' => 'new.test',
                'aliases' => ['new.test', 'www.new.test'],
            ]);

        $this->assertDatabaseHas('sites', ['site' => 'new.test']);
        $this->assertSame(['new.test', 'www.new.test'], Site::where('site', 'new.test')->first()->aliases);

        SiteDetector::flush();
        $this->assertSame('new.test', SiteDetector::fromHost('new.test'));
    }

    public function test_sites_store_validates(): void
    {
        $token = $this->login();

        $this->postJson('/ingest/sites', [], ['Authorization' => "Bearer {$token}"])
            ->assertStatus(422)
            ->assertJsonValidationErrors('site');

        $this->postJson('/ingest/sites', ['site' => ''], ['Authorization' => "Bearer {$token}"])
            ->assertStatus(422)
            ->assertJsonValidationErrors('site');

        Site::create(['site' => 'dup.test', 'aliases' => []]);

        $this->postJson('/ingest/sites', ['site' => 'dup.test'], ['Authorization' => "Bearer {$token}"])
            ->assertStatus(422)
            ->assertJsonValidationErrors('site');
    }

    public function test_sites_store_normalizes_aliases(): void
    {
        $this->postJson('/ingest/sites', [
            'site' => 'norm.test',
            'aliases' => [' new.test ', ' ', 'www.new.test'],
        ], ['Authorization' => "Bearer {$this->login()}"])
            ->assertStatus(201);

        $this->assertSame(['new.test', 'www.new.test'], Site::where('site', 'norm.test')->first()->aliases);
    }

    public function test_sites_update_changes_only_aliases(): void
    {
        $site = Site::create([
            'site' => 'a.test',
            'aliases' => ['a.test', 'old.test'],
        ]);

        $this->putJson("/ingest/sites/{$site->id}", [
            'aliases' => ['a.test', 'www.a.test'],
        ], ['Authorization' => "Bearer {$this->login()}"])
            ->assertOk()
            ->assertJson([
                'site' => 'a.test',
                'aliases' => ['a.test', 'www.a.test'],
            ]);

        $site->refresh();
        $this->assertSame('a.test', $site->site);
        $this->assertSame(['a.test', 'www.a.test'], $site->aliases);

        SiteDetector::flush();
        $this->assertSame('a.test', SiteDetector::fromHost('www.a.test'));
    }

    public function test_sites_destroy_keeps_data_without_delete_data(): void
    {
        $site = Site::create(['site' => 'bye.test', 'aliases' => ['www.bye.test']]);

        PageView::create([
            'site' => 'bye.test',
            'url' => 'https://bye.test/',
            'title' => 'Bye',
            'session_hash' => 'hash',
        ]);
        Event::create([
            'site' => 'bye.test',
            'name' => 'click',
            'url' => 'https://bye.test/',
            'session_hash' => 'hash',
        ]);

        $this->deleteJson("/ingest/sites/{$site->id}", [], ['Authorization' => "Bearer {$this->login()}"])
            ->assertStatus(204);

        $this->assertDatabaseMissing('sites', ['site' => 'bye.test']);
        $this->assertDatabaseHas('pageviews', ['site' => 'bye.test']);
        $this->assertDatabaseHas('events', ['site' => 'bye.test']);

        SiteDetector::flush();
        $this->assertNull(SiteDetector::fromHost('bye.test'));
    }

    public function test_sites_destroy_with_delete_data_removes_data(): void
    {
        $site = Site::create(['site' => 'bye2.test', 'aliases' => []]);

        PageView::create([
            'site' => 'bye2.test',
            'url' => 'https://bye2.test/',
            'title' => 'Bye',
            'session_hash' => 'hash',
        ]);
        Event::create([
            'site' => 'bye2.test',
            'name' => 'click',
            'url' => 'https://bye2.test/',
            'session_hash' => 'hash',
        ]);

        $this->deleteJson("/ingest/sites/{$site->id}?delete_data=1", [], ['Authorization' => "Bearer {$this->login()}"])
            ->assertStatus(204);

        $this->assertDatabaseMissing('sites', ['site' => 'bye2.test']);
        $this->assertDatabaseMissing('pageviews', ['site' => 'bye2.test']);
        $this->assertDatabaseMissing('events', ['site' => 'bye2.test']);
    }

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
}
