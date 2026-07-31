<?php

namespace Tests\Support;

use Illuminate\Support\Facades\Http;

trait MailpitAssertions
{
    private function mailpitApi(): string
    {
        return env('MAILPIT_API', 'http://127.0.0.1:8028/api/v1');
    }

    protected function getMailpitMessages(): array
    {
        return Http::get($this->mailpitApi().'/messages')->json('messages', []);
    }

    protected function getMailpitMessageByEmail(string $email): ?array
    {
        foreach ($this->getMailpitMessages() as $msg) {
            foreach ($msg['To'] ?? [] as $recipient) {
                if (($recipient['Address'] ?? '') === $email) {
                    return Http::get($this->mailpitApi()."/message/{$msg['ID']}")->json();
                }
            }
        }

        return null;
    }

    protected function deleteMailpitMessages(): void
    {
        Http::delete($this->mailpitApi().'/messages');
    }

    protected function assertMailpitSentTo(string $email, int $expectedCount = 1): void
    {
        $matched = array_filter(
            $this->getMailpitMessages(),
            fn ($m) => collect($m['To'] ?? [])->pluck('Address')->contains($email)
        );

        $this->assertGreaterThanOrEqual(
            $expectedCount,
            count($matched),
            "Expected at least {$expectedCount} mail(s) to {$email} in Mailpit, found ".count($matched)
        );
    }

    protected function assertMailpitContainsHtml(string $email, string $needle): void
    {
        $message = $this->getMailpitMessageByEmail($email);
        $this->assertNotNull($message, "No mail found for {$email} in Mailpit");
        $this->assertStringContainsString($needle, $message['HTML'] ?? '');
    }
}
