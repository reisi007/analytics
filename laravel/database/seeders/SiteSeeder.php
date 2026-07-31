<?php

namespace Database\Seeders;

use App\Models\Site;
use Illuminate\Database\Seeder;

class SiteSeeder extends Seeder
{
    public function run(): void
    {
        $sites = [
            'reisinger.pictures' => [
                'reisinger.pictures',
                'www.reisinger.pictures',
                'stats.reisinger.pictures',
            ],
            'all-the.rest' => [
                'all-the.rest',
                'www.all-the.rest',
                'stats.all-the.rest',
            ],
        ];

        if (! app()->isProduction()) {
            $sites['localhost'] = ['localhost'];
        }

        foreach ($sites as $site => $aliases) {
            Site::updateOrCreate(
                ['site' => $site],
                ['aliases' => $aliases],
            );
        }
    }
}
