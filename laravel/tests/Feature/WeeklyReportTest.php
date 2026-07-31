<?php

namespace Tests\Feature;

use App\Models\PageView;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MailpitAssertions;
use Tests\TestCase;

class WeeklyReportTest extends TestCase
{
    use RefreshDatabase, MailpitAssertions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->deleteMailpitMessages();
    }

    public function test_weekly_report_command_sends_email(): void
    {
        config([
            'analytics.report.email' => 'report@example.com',
            'analytics.sites' => [
                'reisinger.pictures' => [
                    'reisinger.pictures',
                    'www.reisinger.pictures',
                    'stats.reisinger.pictures',
                ],
            ],
        ]);

        PageView::create([
            'site' => 'reisinger.pictures',
            'url' => '/foo',
            'title' => 'Foo',
            'session_hash' => 'hash-a',
            'created_at' => now()->startOfWeek()->subWeek()->addDay(),
        ]);

        $this->artisan('report:weekly')->assertExitCode(0);

        $this->assertMailpitSentTo('report@example.com');
        $this->assertMailpitContainsHtml('report@example.com', 'reisinger.pictures');
        $this->assertMailpitContainsHtml('report@example.com', '/foo');
        $this->assertMailpitContainsHtml('report@example.com', '1 Pageviews');
    }

    public function test_weekly_report_includes_subdomain_sites(): void
    {
        config([
            'analytics.report.email' => 'report@example.com',
            'analytics.sites' => [],
        ]);

        PageView::create([
            'site' => 'dev.reisinger.pictures',
            'url' => '/subdomain-page',
            'title' => 'Subdomain',
            'session_hash' => 'hash-b',
            'created_at' => now()->startOfWeek()->subWeek()->addDay(),
        ]);

        $this->artisan('report:weekly')->assertExitCode(0);

        $this->assertMailpitSentTo('report@example.com');
        $this->assertMailpitContainsHtml('report@example.com', 'dev.reisinger.pictures');
        $this->assertMailpitContainsHtml('report@example.com', '/subdomain-page');
    }
}
