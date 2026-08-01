<?php

namespace Tests\Unit\Support;

use App\Support\Url;
use PHPUnit\Framework\TestCase;

class UrlTest extends TestCase
{
    public function test_path_strips_query_string(): void
    {
        $this->assertSame('/foo', Url::path('/foo?a=1&b=2'));
        $this->assertSame('/shootings/akt/', Url::path('/shootings/akt/?utm_source=newsletter&a=1'));
        $this->assertSame('/foo', Url::path('https://example.com/foo?x=1'));
    }

    public function test_path_returns_url_unchanged_without_query_string(): void
    {
        $this->assertSame('/foo', Url::path('/foo'));
        $this->assertSame('/foo', Url::path('https://example.com/foo'));
    }

    public function test_utm_source_extracts_and_decodes(): void
    {
        $this->assertSame('newsletter', Url::utmSource('/foo?utm_source=newsletter&a=1'));
        $this->assertSame('newsletter', Url::utmSource('https://example.com/foo?utm_source=newsletter'));
        $this->assertSame('n ews', Url::utmSource('/foo?utm_source=n%20ews'));
    }

    public function test_utm_source_returns_null_when_absent_or_empty(): void
    {
        $this->assertNull(Url::utmSource('/foo'));
        $this->assertNull(Url::utmSource('/foo?a=1'));
        $this->assertNull(Url::utmSource('/foo?utm_source='));
    }
}
