<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;

class DashboardController extends Controller
{
    public function summary()
    {
        $summary = Item::query()
            ->selectRaw('COUNT(*) as total_items')
            ->selectRaw('COALESCE(SUM(CASE WHEN stock_quantity > min_threshold THEN 1 ELSE 0 END), 0) as in_stock')
            ->selectRaw('COALESCE(SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= min_threshold THEN 1 ELSE 0 END), 0) as low_stock')
            ->selectRaw('COALESCE(SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock')
            ->first();

        return response()->json([
            'total_items' => (int) $summary->total_items,
            'in_stock' => (int) $summary->in_stock,
            'low_stock' => (int) $summary->low_stock,
            'out_of_stock' => (int) $summary->out_of_stock,
        ]);
    }
}
