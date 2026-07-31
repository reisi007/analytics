<?php

namespace Tests\Feature;

use App\Models\PageView;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private string $token = '';

    private function login(): string
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertOk();

        $this->token = $response->json('token');

        return $this->token;
    }

    public function test_login_returns_token(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'token_type',
                'expires_in',
                'user' => ['email'],
            ])
            ->assertJsonPath('token_type', 'bearer')
            ->assertJsonPath('expires_in', config('jwt.ttl') * 60)
            ->assertJsonPath('user.email', 'admin@analytics.local');

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_login_with_wrong_password_returns_401(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'wrong-password',
        ])->assertStatus(401)
            ->assertJson(['message' => 'Unauthorized']);
    }

    public function test_stats_requires_token(): void
    {
        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/summary?site=reisinger.pictures&from={$from}&to={$to}")
            ->assertStatus(401);
    }

    public function test_stats_with_token_returns_200(): void
    {
        $this->login();

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
            'created_at' => now(),
        ]);

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/summary?site=reisinger.pictures&from={$from}&to={$to}", [
            'Authorization' => "Bearer {$this->token}",
        ])->assertOk()
            ->assertJsonPath('totals.pageviews', 1);
    }

    public function test_stream_with_token_query_parameter_works(): void
    {
        $this->login();

        config(['analytics.stream.max_runtime' => 0.2]);
        config(['analytics.stream.poll_seconds' => 0.1]);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/stream-me',
            'title' => 'Stream',
            'session_hash' => 'hash-stream',
            'created_at' => now(),
        ]);

        $response = $this->get("/api/stream?token={$this->token}&site=reisinger.pictures");

        $response->assertStatus(200);
        $this->assertStringStartsWith('text/event-stream', (string) $response->headers->get('content-type'));

        $content = $response->streamedContent();

        $this->assertStringContainsString('snapshot', $content);
    }

    public function test_logout_invalidates_token(): void
    {
        $this->login();

        $this->postJson('/api/auth/logout', [], [
            'Authorization' => "Bearer {$this->token}",
        ])->assertStatus(204);

        $from = now()->subDays(2)->format('Y-m-d');
        $to = now()->format('Y-m-d');

        $this->getJson("/api/stats/summary?site=reisinger.pictures&from={$from}&to={$to}", [
            'Authorization' => "Bearer {$this->token}",
        ])->assertStatus(401);
    }
}
