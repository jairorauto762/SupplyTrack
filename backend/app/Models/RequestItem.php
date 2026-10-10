<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestItem extends Model
{
    protected $fillable = ['request_id', 'item_id', 'quantity'];

    public function supplyRequest()
    {
        return $this->belongsTo(SupplyRequest::class, 'request_id');
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}