<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ANALYTICS_ADMIN_EMAIL');
        $password = env('ANALYTICS_ADMIN_PASSWORD');

        if ($email === null || $email === '' || $password === null || $password === '') {
            throw new RuntimeException('ANALYTICS_ADMIN_EMAIL/ANALYTICS_ADMIN_PASSWORD must be set');
        }

        User::firstOrCreate(
            ['email' => $email],
            ['name' => 'Admin', 'password' => Hash::make($password)],
        );
    }
}
