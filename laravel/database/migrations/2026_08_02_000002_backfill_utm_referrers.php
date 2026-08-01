<?php

use App\Models\PageView;
use App\Support\Url;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        PageView::query()
            ->orderBy('id')
            ->chunk(500, function ($pageviews) {
                foreach ($pageviews as $pv) {
                    $utmSource = Url::utmSource($pv->url);

                    if ($utmSource === null) {
                        continue;
                    }

                    if ($pv->referrer === $utmSource) {
                        continue;
                    }

                    $pv->referrer = $utmSource;
                    $pv->save();
                }
            });
    }

    public function down(): void {}
};
