<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = [
        'site',
        'name',
        'url',
        'payload',
        'session_hash',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
