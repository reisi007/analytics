<?php

namespace Tests\Feature;

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_config_sites_returns_aliases(): void
    {
        Site::create([
            'site' => 'reisinger.pictures',
            'aliases' => ['reisinger.pictures', 'www.reisinger.pictures', 'stats.reisinger.pictures'],
        ]);

        Site::create([
            'site' => 'all-the.rest',
            'aliases' => ['all-the.rest', 'www.all-the.rest', 'stats.all-the.rest'],
        ]);

        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        $token = $this->postJson('/ingest/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertOk()->json('token');

        $this->getJson('/ingest/config/sites', ['Authorization' => "Bearer {$token}"])
            ->assertOk()
            ->assertExactJson([
                'reisinger.pictures' => [
                    'reisinger.pictures',
                    'www.reisinger.pictures',
                    'stats.reisinger.pictures',
                ],
                'all-the.rest' => [
                    'all-the.rest',
                    'www.all-the.rest',
                    'stats.all-the.rest',
                ],
            ]);
    }

    public function test_config_sites_requires_authentication(): void
    {
        $this->getJson('/ingest/config/sites')
            ->assertUnauthorized();
    }

    public function test_welcome_route_removed(): void
    {
        $this->get('/')->assertNotFound();
    }
}
