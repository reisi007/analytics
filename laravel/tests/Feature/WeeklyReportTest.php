<?php

namespace Tests\Feature;

use App\Models\PageView;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MailpitAssertions;
use Tests\TestCase;

class WeeklyReportTest extends TestCase
{
    use RefreshDatabase, MailpitAssertions;

    public function test_weekly_report_command_sends_email(): void
    {
        config(['analytics.report.email' => 'report@example.com']);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
            'created_at' => now()->subDay(),
        ]);

        $this->artisan('report:weekly')->assertExitCode(0);

        $this->assertMailpitSentTo('report@example.com');
        $this->assertMailpitContainsHtml('report@example.com', 'reisinger.pictures');
    }
}
