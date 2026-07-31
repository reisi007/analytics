@component('mail::message')
# Weekly Analytics Report: {{ $site }}

Zeitraum: **{{ $reportFrom->format('d.m.Y') }}** – **{{ $reportTo->format('d.m.Y') }}**

## Überblick
- Pageviews: **{{ number_format($stats['totals']['pageviews']) }}**
- Unique Visitors: **{{ number_format($stats['totals']['unique']) }}**
- Events: **{{ number_format($stats['totals']['events']) }}**

@if(count($stats['top_pages']))
## Top-Seiten
@foreach($stats['top_pages'] as $page)
- `{{ $page['url'] }}` — {{ number_format($page['pageviews']) }} Pageviews
@endforeach
@endif

@if(count($stats['top_referrers']))
## Top-Referrer
@foreach($stats['top_referrers'] as $ref)
- {{ $ref['referrer'] }} — {{ number_format($ref['pageviews']) }} Pageviews
@endforeach
@endif

@endcomponent
