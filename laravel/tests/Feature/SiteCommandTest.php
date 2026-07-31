<?php

namespace Tests\Feature;

use App\Models\Site;
use App\Support\SiteDetector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_sites_add_creates_site_with_aliases(): void
    {
        $this->artisan('sites:add', [
            'site' => 'blog.reisinger.pictures',
            '--aliases' => 'blog.reisinger.pictures,www.blog.reisinger.pictures',
        ])->assertExitCode(0);

        $this->assertDatabaseHas('sites', ['site' => 'blog.reisinger.pictures']);

        $this->assertSame(
            ['blog.reisinger.pictures', 'www.blog.reisinger.pictures'],
            Site::where('site', 'blog.reisinger.pictures')->first()->aliases,
        );
    }

    public function test_sites_add_updates_existing_site(): void
    {
        Site::create(['site' => 'old.test', 'aliases' => ['old.test']]);

        $this->artisan('sites:add', [
            'site' => 'old.test',
            '--aliases' => 'old.test,www.old.test',
        ])->assertExitCode(0);

        $this->assertSame(
            ['old.test', 'www.old.test'],
            Site::where('site', 'old.test')->first()->aliases,
        );
    }

    public function test_sites_add_rejects_empty_site(): void
    {
        $this->artisan('sites:add', ['site' => ' '])->assertExitCode(1);

        $this->assertSame(0, Site::query()->count());
    }

    public function test_sites_add_updates_detector_whitelist(): void
    {
        SiteDetector::flush();

        $this->artisan('sites:add', [
            'site' => 'new.test',
            '--aliases' => 'new.test',
        ])->assertExitCode(0);

        $this->assertSame('new.test', SiteDetector::fromHost('new.test'));
    }

    public function test_sites_list_outputs_table(): void
    {
        Site::create(['site' => 'a.test', 'aliases' => ['a.test']]);
        Site::create(['site' => 'b.test', 'aliases' => ['b.test', 'www.b.test']]);

        $this->artisan('sites:list')
            ->expectsOutputToContain('a.test')
            ->expectsOutputToContain('b.test')
            ->assertExitCode(0);
    }
}
