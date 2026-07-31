<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Weekly Analytics Report: {{ $site }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f2f2;padding:20px 0;">
<tr>
<td align="center" style="padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-collapse:collapse;border:1px solid #dddddd;">
<tr>
<td style="background-color:#1f2937;padding:24px 32px;">
<h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:bold;">Weekly Analytics Report</h1>
<p style="margin:6px 0 0 0;font-size:14px;color:#9ca3af;">{{ $site }}</p>
</td>
</tr>
<tr>
<td style="padding:24px 32px;border-bottom:1px solid #eeeeee;">
<h2 style="margin:0;font-size:16px;color:#111111;">Zeitraum</h2>
<p style="margin:8px 0 0 0;font-size:14px;color:#333333;">{{ $reportFrom->format('d.m.Y') }} &ndash; {{ $reportTo->format('d.m.Y') }}</p>
</td>
</tr>
<tr>
<td style="padding:24px 32px;border-bottom:1px solid #eeeeee;">
<h2 style="margin:0;font-size:16px;color:#111111;">&Uuml;berblick</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
<tr>
<td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#555555;">Pageviews</td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111111;font-weight:bold;">{{ number_format($stats['totals']['pageviews']) }}</td>
</tr>
<tr>
<td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#555555;">Unique Visitors</td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111111;font-weight:bold;">{{ number_format($stats['totals']['unique']) }}</td>
</tr>
<tr>
<td style="padding:8px 0;font-size:14px;color:#555555;">Events</td>
<td align="right" style="padding:8px 0;font-size:14px;color:#111111;font-weight:bold;">{{ number_format($stats['totals']['events']) }}</td>
</tr>
</table>
</td>
</tr>
@if(count($stats['top_pages']))
<tr>
<td style="padding:24px 32px;border-bottom:1px solid #eeeeee;">
<h2 style="margin:0;font-size:16px;color:#111111;">Top-Seiten</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
@foreach($stats['top_pages'] as $page)
<tr>
<td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333333;">{{ $page['url'] }}</td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111111;">{{ number_format($page['pageviews']) }} Pageviews</td>
</tr>
@endforeach
</table>
</td>
</tr>
@endif
@if(count($stats['top_referrers']))
<tr>
<td style="padding:24px 32px;">
<h2 style="margin:0;font-size:16px;color:#111111;">Top-Referrer</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
@foreach($stats['top_referrers'] as $ref)
<tr>
<td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333333;">{{ $ref['referrer'] }}</td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111111;">{{ number_format($ref['pageviews']) }} Pageviews</td>
</tr>
@endforeach
</table>
</td>
</tr>
@endif
</table>
</td>
</tr>
</table>
</body>
</html>
