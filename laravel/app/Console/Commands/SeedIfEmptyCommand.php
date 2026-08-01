<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class SeedIfEmptyCommand extends Command
{
    protected $signature = 'seed:if-empty';

    protected $description = 'Run the database seeder only when the database is empty';

    public function handle(): int
    {
        if (User::query()->exists()) {
            $this->info('Database already seeded, skipping.');

            return self::SUCCESS;
        }

        $this->call('db:seed', ['--force' => true]);

        return self::SUCCESS;
    }
}
