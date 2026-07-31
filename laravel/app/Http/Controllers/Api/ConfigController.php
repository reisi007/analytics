<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    public function sites(): JsonResponse
    {
        return response()->json(
            Site::all()->pluck('aliases', 'site')->map(fn ($aliases) => $aliases ?? []),
        );
    }
}
