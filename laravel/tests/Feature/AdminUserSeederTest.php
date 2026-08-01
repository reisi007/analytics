<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class AdminUserSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        $this->clearEnv('ANALYTICS_ADMIN_EMAIL');
        $this->clearEnv('ANALYTICS_ADMIN_PASSWORD');
        parent::tearDown();
    }

    public function test_seeder_throws_when_env_missing(): void
    {
        $this->clearEnv('ANALYTICS_ADMIN_EMAIL');
        $this->clearEnv('ANALYTICS_ADMIN_PASSWORD');

        $this->expectException(RuntimeException::class);

        (new AdminUserSeeder)->run();
    }

    public function test_seeder_creates_admin_user_from_env(): void
    {
        $this->setEnv('ANALYTICS_ADMIN_EMAIL', 'admin@analytics.local');
        $this->setEnv('ANALYTICS_ADMIN_PASSWORD', 'super-secret');

        (new AdminUserSeeder)->run();

        $this->assertDatabaseHas('users', ['email' => 'admin@analytics.local']);
        $this->assertTrue(Hash::check('super-secret', User::where('email', 'admin@analytics.local')->first()->password));
    }

    public function test_seeder_does_not_reset_password_for_existing_user(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('original-password'),
        ]);

        $this->setEnv('ANALYTICS_ADMIN_EMAIL', 'admin@analytics.local');
        $this->setEnv('ANALYTICS_ADMIN_PASSWORD', 'new-password');

        (new AdminUserSeeder)->run();

        $this->assertSame(1, User::query()->count());
        $this->assertTrue(Hash::check('original-password', User::first()->password));
    }

    private function setEnv(string $key, string $value): void
    {
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        putenv("{$key}={$value}");
    }

    private function clearEnv(string $key): void
    {
        unset($_ENV[$key], $_SERVER[$key]);
        putenv($key);
    }
}
