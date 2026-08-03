<?php

use App\Models\Event;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Event::query()->where('name', 'pageview')->delete();
    }

    public function down(): void {}
};
