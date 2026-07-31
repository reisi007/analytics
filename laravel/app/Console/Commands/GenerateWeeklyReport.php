<?php

namespace App\Console\Commands;

use App\Mail\WeeklyReportMail;
use App\Services\StatsAggregator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class GenerateWeeklyReport extends Command
{
    protected $signature = 'report:weekly';

    protected $description = 'Send the weekly analytics report';

    public function handle(StatsAggregator $aggregator): int
    {
        $from = now()->startOfWeek()->subWeek();
        $to = now()->startOfWeek();
        $recipient = config('analytics.report.email');

        if ($recipient === null || $recipient === '') {
            $this->error('No report recipient configured (REPORT_EMAIL).');

            return self::FAILURE;
        }

        foreach (array_keys(config('analytics.sites', [])) as $site) {
            $stats = $aggregator->summary($site, $from, $to);
            Mail::to($recipient)->send(new WeeklyReportMail($site, $stats, $from, $to));
            $this->info("Weekly report for {$site} sent to {$recipient}.");
        }

        return self::SUCCESS;
    }
}
