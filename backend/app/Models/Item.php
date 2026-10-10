<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'category_id', 'item_code', 'name', 'description', 'specs',
        'photo_url', 'price', 'stock_quantity', 'min_threshold', 'status',
    ];

    protected $appends = ['is_low_stock'];

    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_quantity <= $this->min_threshold;
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function ledgerMovements()
    {
        return $this->hasMany(LedgerMovement::class);
    }
}