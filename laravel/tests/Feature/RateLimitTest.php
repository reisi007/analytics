<?php

namespace Tests\Feature;

use App\Models\Site;
use App\Models\User;
use App\Support\SiteDetector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);
    }

    public function test_login_is_throttled_after_five_attempts(): void
    {
        config(['analytics.rate_limit.login' => 5]);
        $this->createUser();

        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/ingest/auth/login', [
                'email' => 'admin@analytics.local',
                'password' => 'wrong-password',
            ])->assertStatus(401);
        }

        $this->postJson('/ingest/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertOk();

        $this->postJson('/ingest/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertStatus(429);
    }

    public function test_track_is_throttled(): void
    {
        config(['analytics.rate_limit.track' => 3]);

        Site::create([
            'site' => 'reisinger.pictures',
            'aliases' => ['reisinger.pictures'],
        ]);
        SiteDetector::flush();

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/ingest/track', [
                'type' => 'pageview',
                'url' => '/x',
            ], ['Referer' => 'https://reisinger.pictures/'])->assertStatus(204);
        }

        $this->postJson('/ingest/track', [
            'type' => 'pageview',
            'url' => '/x',
        ], ['Referer' => 'https://reisinger.pictures/'])->assertStatus(429);
    }
}
