<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageView extends Model
{
    public const CREATED_AT = 'created_at';

    public const UPDATED_AT = null;

    protected $table = 'pageviews';

    protected $fillable = [
        'site',
        'url',
        'title',
        'referrer',
        'screen_width',
        'screen_height',
        'language',
        'session_hash',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'screen_width' => 'integer',
            'screen_height' => 'integer',
        ];
    }
}
