<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedIfEmptyCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_when_database_is_empty(): void
    {
        $this->setEnv('ANALYTICS_ADMIN_EMAIL', 'admin@analytics.local');
        $this->setEnv('ANALYTICS_ADMIN_PASSWORD', 'super-secret');

        $this->artisan('seed:if-empty')
            ->expectsOutputToContain('Seeding')
            ->assertExitCode(0);

        $this->assertDatabaseHas('users', ['email' => 'admin@analytics.local']);
        $this->assertDatabaseHas('sites', ['site' => 'Reisinger Pictures']);
    }

    public function test_skips_when_database_has_users(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'existing@analytics.local',
            'password' => 'secret',
        ]);

        $this->artisan('seed:if-empty')
            ->expectsOutputToContain('already seeded')
            ->assertExitCode(0);

        $this->assertSame(1, User::query()->count());
        $this->assertDatabaseMissing('sites', ['site' => 'Reisinger Pictures']);
    }

    private function setEnv(string $key, string $value): void
    {
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        putenv("{$key}={$value}");
    }
}
