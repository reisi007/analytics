<?php

namespace App\Console\Commands;

use App\Models\Site;
use App\Support\SiteDetector;
use Illuminate\Console\Command;

class SitesAddCommand extends Command
{
    protected $signature = 'sites:add {site} {--aliases=}';

    protected $description = 'Create or update a tracked site (--aliases = comma-separated list of host aliases)';

    public function handle(): int
    {
        $site = trim((string) $this->argument('site'));

        if ($site === '') {
            $this->error('The site must not be empty.');

            return self::FAILURE;
        }

        $aliases = collect(explode(',', (string) $this->option('aliases')))
            ->map(fn (string $alias) => trim($alias))
            ->filter()
            ->values()
            ->all();

        Site::updateOrCreate(
            ['site' => $site],
            ['aliases' => $aliases],
        );

        SiteDetector::flush();

        $this->info(
            "Site {$site} saved with aliases: ".($aliases === [] ? '(none)' : implode(', ', $aliases))
        );

        return self::SUCCESS;
    }
}
