<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    // Features 2-5: browse, search, filter, sort
    public function index(Request $request)
    {
        $query = Item::with('category');

        // Feature 3: search by name, code, or category
        if ($search = trim($request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('item_code', 'like', "%{$search}%")
                  ->orWhereHas('category', function ($c) use ($search) {
                      $c->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Feature 4: filter by category
        if ($category = $request->query('category')) {
            $query->where('category_id', $category);
        }

        // Feature 4: filter by stock level
        switch ($request->query('stock')) {
            case 'out':
                $query->where('stock_quantity', 0);
                break;
            case 'low':
                $query->where('stock_quantity', '>', 0)
                      ->whereColumn('stock_quantity', '<=', 'min_threshold');
                break;
            case 'in':
                $query->whereColumn('stock_quantity', '>', 'min_threshold');
                break;
        }

        // Feature 4: filter by status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Feature 5: sort
        switch ($request->query('sort')) {
            case 'stock_asc':
                $query->orderBy('stock_quantity', 'asc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc')->orderBy('id', 'desc');
                break;
            default: // name
                $query->orderBy('name', 'asc');
        }

        return response()->json($query->get());
    }

    // For the category dropdown
    public function categories()
    {
        return response()->json(Category::orderBy('name')->get());
    }
}