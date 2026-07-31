<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class WeeklyReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $site,
        public array $stats,
        public Carbon $reportFrom,
        public Carbon $reportTo,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Weekly Analytics Report: {$this->site} ({$this->reportFrom->format('d.m.Y')} - {$this->reportTo->format('d.m.Y')})");
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.weekly-report');
    }
}
