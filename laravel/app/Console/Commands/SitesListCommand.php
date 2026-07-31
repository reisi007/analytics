<?php

namespace App\Console\Commands;

use App\Models\Site;
use Illuminate\Console\Command;

class SitesListCommand extends Command
{
    protected $signature = 'sites:list';

    protected $description = 'List all tracked sites';

    public function handle(): int
    {
        $rows = Site::query()
            ->orderBy('site')
            ->get()
            ->map(fn (Site $site) => [
                'site' => $site->site,
                'aliases' => implode(', ', $site->aliases ?? []),
            ])
            ->all();

        $this->table(['Site', 'Aliases'], $rows);

        return self::SUCCESS;
    }
}
