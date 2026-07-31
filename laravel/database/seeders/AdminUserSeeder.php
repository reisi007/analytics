<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => env('ANALYTICS_ADMIN_EMAIL', 'admin@analytics.local')],
            [
                'name' => 'Admin',
                'password' => Hash::make(env('ANALYTICS_ADMIN_PASSWORD', 'password')),
            ],
        );
    }
}
