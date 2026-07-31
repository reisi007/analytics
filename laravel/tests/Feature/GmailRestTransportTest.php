<?php

namespace Tests\Feature;

use App\Mail\Transports\GmailRestTransport;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Transport\TransportInterface;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class GmailRestTransportTest extends TestCase
{
    public function test_send_refreshes_token_and_uploads_via_multipart_related(): void
    {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'test-token'], 200),
            'gmail.googleapis.com/*' => Http::response(['id' => 'msg1'], 200),
        ]);

        $transport = new GmailRestTransport('client-id', 'client-secret', 'refresh-token');
        $this->assertInstanceOf(TransportInterface::class, $transport);

        $email = (new Email())
            ->from('florian@reisinger.pictures')
            ->to('test@example.com')
            ->subject('SMTP Test')
            ->text('Hello world');

        $transport->send($email);

        // Token-Refresh-Request enthält den Refresh-Token.
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'oauth2.googleapis.com/token')
                && str_contains((string) $request->body(), '"refresh_token":"refresh-token"');
        });

        // Upload-Request läuft mit dem frischen Access-Token.
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'gmail.googleapis.com')
                && ($request->header('Authorization')[0] ?? '') === 'Bearer test-token';
        });
    }

    public function test_send_uses_multipart_related_with_rfc822_part(): void
    {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'test-access-token'], 200),
            'gmail.googleapis.com/*' => Http::response(['id' => 'msg-123'], 200),
        ]);

        $transport = new GmailRestTransport('client-id', 'client-secret', 'refresh-token');
        $email = (new Email())
            ->from('florian@reisinger.pictures')
            ->to('test@example.com')
            ->subject('SMTP Test')
            ->text('Hello world');

        $transport->send($email);

        // Verify the Gmail send request used multipart/related (not raw JSON).
        Http::assertSent(function ($request) {
            if (!str_contains($request->url(), 'gmail.googleapis.com')) {
                return false;
            }

            $contentType = $request->header('Content-Type')[0] ?? '';
            $body = (string) $request->body();

            return str_contains($contentType, 'multipart/related')
                && str_contains($body, 'Content-Type: message/rfc822')
                && str_contains($body, '"raw"');
        });
    }

    public function test_send_throws_when_token_refresh_fails_and_fires_make_webhook(): void
    {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['error' => 'invalid_grant'], 401),
            'https://hook.make.com/*' => Http::response([], 200),
        ]);

        putenv('MAKE_WEBHOOK_URL=https://hook.make.com/analytics');
        putenv('MAKE_API_KEY=secret-key');

        try {
            $transport = new GmailRestTransport('client-id', 'client-secret', 'refresh-token');
            $email = (new Email())
                ->from('florian@reisinger.pictures')
                ->to('test@example.com')
                ->subject('SMTP Test')
                ->text('Hello world');

            try {
                $transport->send($email);
                $this->fail('Expected an exception when the token refresh fails.');
            } catch (\Exception $e) {
                $this->assertStringContainsString('Token Refresh failed', $e->getMessage());
            }
        } finally {
            putenv('MAKE_WEBHOOK_URL');
            putenv('MAKE_API_KEY');
        }

        Http::assertSent(function ($request) {
            return $request->url() === 'https://hook.make.com/analytics'
                && ($request->header('x-make-apikey')[0] ?? '') === 'secret-key';
        });
    }

    public function test_send_throws_on_gmail_api_error(): void
    {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'test-access-token'], 200),
            'gmail.googleapis.com/*' => Http::response(
                ['error' => ['code' => 400, 'message' => "Media type 'application/json' is not supported."]],
                400
            ),
        ]);

        $transport = new GmailRestTransport('client-id', 'client-secret', 'refresh-token');

        $email = (new Email())
            ->from('florian@reisinger.pictures')
            ->to('test@example.com')
            ->subject('SMTP Test')
            ->text('Hello world');

        $this->expectException(\Exception::class);
        $transport->send($email);
    }
}
