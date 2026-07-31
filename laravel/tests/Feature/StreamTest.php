<?php

namespace Tests\Feature;

use App\Models\PageView;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StreamTest extends TestCase
{
    use RefreshDatabase;

    public function test_stream_emits_snapshot_and_pageview(): void
    {
        config(['analytics.stream.max_runtime' => 0.2]);
        config(['analytics.stream.poll_seconds' => 0.1]);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/stream-me',
            'title' => 'Stream',
            'session_hash' => 'hash-stream',
            'created_at' => now(),
        ]);

        $response = $this->get('/api/stream?site=reisinger.pictures');

        $response->assertStatus(200);
        $this->assertStringStartsWith('text/event-stream', (string) $response->headers->get('content-type'));

        $content = $response->streamedContent();

        $this->assertStringContainsString('snapshot', $content);
        $this->assertStringContainsString('/stream-me', $content);
    }
}
