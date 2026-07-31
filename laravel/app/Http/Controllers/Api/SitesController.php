<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\PageView;
use App\Models\Site;
use App\Support\SiteDetector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SitesController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Site::orderBy('site')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'site' => ['required', 'string', 'max:255', 'unique:sites,site'],
            'aliases' => ['nullable', 'array'],
            'aliases.*' => ['nullable', 'string', 'max:255'],
        ]);

        $site = Site::create([
            'site' => $data['site'],
            'aliases' => $this->normalizeAliases($data['aliases'] ?? []),
        ]);

        SiteDetector::flush();

        return response()->json($site, 201);
    }

    public function update(Request $request, Site $site): JsonResponse
    {
        $data = $request->validate([
            'aliases' => ['nullable', 'array'],
            'aliases.*' => ['nullable', 'string', 'max:255'],
        ]);

        $site->update(['aliases' => $this->normalizeAliases($data['aliases'] ?? [])]);

        SiteDetector::flush();

        return response()->json($site);
    }

    public function destroy(Request $request, Site $site): JsonResponse
    {
        if (filter_var($request->query('delete_data'), FILTER_VALIDATE_BOOL)) {
            PageView::where('site', $site->site)->delete();
            Event::where('site', $site->site)->delete();
        }

        $site->delete();
        SiteDetector::flush();

        return response()->json(null, 204);
    }

    private function normalizeAliases(array $aliases): array
    {
        return array_values(array_filter(
            array_map(fn ($alias) => trim((string) $alias), $aliases),
            fn ($alias) => $alias !== '',
        ));
    }
}
