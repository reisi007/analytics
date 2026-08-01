<?php

namespace Tests\Feature;

use App\Models\Site;
use Database\Seeders\SiteSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_site_seeder_creates_production_sites(): void
    {
        $this->artisan('db:seed', ['--class' => SiteSeeder::class])->assertExitCode(0);

        $this->assertDatabaseHas('sites', ['site' => 'Reisinger Pictures']);
        $this->assertDatabaseHas('sites', ['site' => 'All The Rest']);

        $this->assertSame(
            ['reisinger.pictures', 'www.reisinger.pictures', 'stats.reisinger.pictures'],
            Site::where('site', 'Reisinger Pictures')->first()->aliases,
        );

        $this->assertSame(
            ['all-the.rest', 'www.all-the.rest', 'stats.all-the.rest'],
            Site::where('site', 'All The Rest')->first()->aliases,
        );
    }

    public function test_site_seeder_creates_localhost_in_non_production(): void
    {
        $this->artisan('db:seed', ['--class' => SiteSeeder::class])->assertExitCode(0);

        $this->assertDatabaseHas('sites', ['site' => 'localhost']);
        $this->assertSame(['localhost'], Site::where('site', 'localhost')->first()->aliases);
    }

    public function test_site_seeder_is_idempotent(): void
    {
        $this->artisan('db:seed', ['--class' => SiteSeeder::class])->assertExitCode(0);
        $this->artisan('db:seed', ['--class' => SiteSeeder::class])->assertExitCode(0);

        $this->assertSame(3, Site::query()->count());
    }
}
