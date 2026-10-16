<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplyRequest extends Model
{
    protected $fillable = [
        'user_id', 'status', 'purpose', 'approved_by',
        'declined_reason', 'approved_at', 'released_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function requestItems()
    {
        return $this->hasMany(RequestItem::class, 'request_id');
    }

    public function items()
    {
        return $this->hasMany(RequestItem::class, 'request_id');
    }
}
