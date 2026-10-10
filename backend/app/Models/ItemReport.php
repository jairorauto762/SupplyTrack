<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemReport extends Model
{
    protected $fillable = ['item_id', 'user_id', 'issue_description', 'status'];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}