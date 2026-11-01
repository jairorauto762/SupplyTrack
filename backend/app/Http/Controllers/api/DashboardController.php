<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\RequestItem;
use App\Models\SupplyRequest;

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

        $lowStockItems = Item::query()
            ->with('category:id,name')
            ->where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'min_threshold')
            ->orderBy('stock_quantity')
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'category_id', 'item_code', 'name', 'stock_quantity', 'min_threshold']);

        $topRequestedItems = RequestItem::query()
            ->selectRaw('item_id, COUNT(DISTINCT request_id) as request_count, SUM(quantity) as quantity_requested')
            ->whereHas('supplyRequest', fn ($query) => $query->whereNotIn('status', ['cancelled', 'declined']))
            ->with('item:id,item_code,name,stock_quantity,min_threshold')
            ->groupBy('item_id')
            ->orderByDesc('request_count')
            ->orderByDesc('quantity_requested')
            ->limit(5)
            ->get();

        return response()->json([
            'total_items' => (int) $summary->total_items,
            'in_stock' => (int) $summary->in_stock,
            'low_stock' => (int) $summary->low_stock,
            'out_of_stock' => (int) $summary->out_of_stock,
            'requests_count' => SupplyRequest::query()->count(),
            'low_stock_items' => $lowStockItems,
            'top_requested_items' => $topRequestedItems,
        ]);
    }
}
