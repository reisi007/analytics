<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Weekly Analytics Report: {{ $site }}</title>
</head>
<body>
<table role="presentation" width="100%" cellpadding="10" cellspacing="0" bgcolor="#f2f2f2" style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr>
<td bgcolor="#1f2937" style="padding:24px 32px;font-family:Arial,Helvetica,sans-serif;">
<span style="font-size:20px;color:#ffffff;">Weekly Analytics Report</span><br>
<span style="font-size:14px;color:#9ca3af;">{{ $site }}</span>
</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="24" cellspacing="0">
<tr>
<td>
<span style="font-size:16px;color:#111111;">Zeitraum</span><br>
<span style="font-size:14px;color:#333333;">{{ $reportFrom->format('d.m.Y') }} &ndash; {{ $reportTo->format('d.m.Y') }}</span>
<br><br>
<span style="font-size:16px;color:#111111;">&Uuml;berblick</span>
<table role="presentation" width="100%" cellpadding="8" cellspacing="0">
<tr>
<td style="font-size:14px;color:#555555;">Pageviews</td>
<td align="right"><strong style="font-size:14px;color:#111111;">{{ number_format($stats['totals']['pageviews']) }}</strong></td>
</tr>
<tr>
<td style="font-size:14px;color:#555555;">Unique Visitors</td>
<td align="right"><strong style="font-size:14px;color:#111111;">{{ number_format($stats['totals']['unique']) }}</strong></td>
</tr>
<tr>
<td style="font-size:14px;color:#555555;">Events</td>
<td align="right"><strong style="font-size:14px;color:#111111;">{{ number_format($stats['totals']['events']) }}</strong></td>
</tr>
</table>
@if(count($stats['top_pages']))
<br><br>
<span style="font-size:16px;color:#111111;">Top-Seiten</span>
<table role="presentation" width="100%" cellpadding="8" cellspacing="0">
@foreach($stats['top_pages'] as $page)
<tr>
<td style="font-size:14px;color:#333333;">{{ $page['url'] }}</td>
<td align="right"><span style="font-size:14px;color:#111111;">{{ number_format($page['pageviews']) }} Pageviews</span></td>
</tr>
@endforeach
</table>
@endif
@if(count($stats['top_referrers']))
<br><br>
<span style="font-size:16px;color:#111111;">Top-Referrer</span>
<table role="presentation" width="100%" cellpadding="8" cellspacing="0">
@foreach($stats['top_referrers'] as $ref)
<tr>
<td style="font-size:14px;color:#333333;">{{ $ref['referrer'] }}</td>
<td align="right"><span style="font-size:14px;color:#111111;">{{ number_format($ref['pageviews']) }} Pageviews</span></td>
</tr>
@endforeach
</table>
@endif
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</html>
