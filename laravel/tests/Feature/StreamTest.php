<?php

namespace Tests\Feature;

use App\Models\PageView;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StreamTest extends TestCase
{
    use RefreshDatabase;

    public function test_stream_emits_snapshot_and_pageview(): void
    {
        config(['analytics.stream.max_runtime' => 0.2]);
        config(['analytics.stream.poll_seconds' => 0.1]);

        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        $token = $this->postJson('/ingest/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertOk()->json('token');

        $streamToken = $this->postJson('/ingest/auth/stream-token', [], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk()->json('token');

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/stream-me',
            'title' => 'Stream',
            'session_hash' => 'hash-stream',
            'created_at' => now(),
        ]);

        $response = $this->get("/ingest/stream?token={$streamToken}&site=reisinger.pictures");

        $response->assertStatus(200);
        $this->assertStringStartsWith('text/event-stream', (string) $response->headers->get('content-type'));

        $content = $response->streamedContent();

        $this->assertStringContainsString('snapshot', $content);
        $this->assertStringContainsString('/stream-me', $content);
    }

    public function test_stream_resumes_from_last_ids(): void
    {
        config(['analytics.stream.max_runtime' => 0.2]);
        config(['analytics.stream.poll_seconds' => 0.1]);

        User::create([
            'name' => 'Admin',
            'email' => 'admin@analytics.local',
            'password' => Hash::make('password'),
        ]);

        $token = $this->postJson('/ingest/auth/login', [
            'email' => 'admin@analytics.local',
            'password' => 'password',
        ])->assertOk()->json('token');

        $streamToken = $this->postJson('/ingest/auth/stream-token', [], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk()->json('token');

        $older = PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/older',
            'title' => 'Older',
            'session_hash' => 'hash-old',
            'created_at' => now()->subMinutes(40),
        ]);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/stream-me',
            'title' => 'Stream',
            'session_hash' => 'hash-stream',
            'created_at' => now(),
        ]);

        $response = $this->get("/ingest/stream?token={$streamToken}&site=reisinger.pictures&last_pv_id={$older->id}");

        $response->assertStatus(200);

        $content = $response->streamedContent();

        $this->assertStringNotContainsString('/older', $content);
        $this->assertStringContainsString('/stream-me', $content);
        $this->assertStringContainsString('snapshot', $content);
    }
}
