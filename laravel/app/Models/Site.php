<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    protected $fillable = [
        'site',
        'aliases',
    ];

    protected function casts(): array
    {
        return [
            'aliases' => 'array',
        ];
    }
}
