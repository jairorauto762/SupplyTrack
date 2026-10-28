<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use App\Models\LedgerMovement;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class ItemController extends Controller
{
    public function __construct(private PushNotificationService $pushNotifications) {}

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

    public function show(Item $item)
    {
        return response()->json($item->load('category'));
    }

    public function custodianIndex()
    {
        return response()->json(Item::with('category')->orderBy('name')->get());
    }

    public function update(Request $request, Item $item)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'item_code' => ['required', 'string', 'max:255', Rule::unique('items', 'item_code')->ignore($item->id)],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'specs' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0|max:2147483647',
            'min_threshold' => 'required|integer|min:0',
            'status' => ['required', Rule::in(['available', 'unavailable', 'discontinued'])],
        ]);

        $becameOutOfStock = false;
        $updatedItem = DB::transaction(function () use ($data, $item, $request, &$becameOutOfStock) {
            $lockedItem = Item::query()->lockForUpdate()->findOrFail($item->id);
            $becameOutOfStock = $lockedItem->stock_quantity > 0 && (int) $data['stock_quantity'] === 0;
            $stockChange = $data['stock_quantity'] - $lockedItem->stock_quantity;
            $attributes = $data;
            unset($attributes['stock_quantity']);

            $lockedItem->fill($attributes);
            $lockedItem->stock_quantity = $data['stock_quantity'];
            $lockedItem->save();

            if ($stockChange !== 0) {
                LedgerMovement::create([
                    'item_id' => $lockedItem->id,
                    'user_id' => $request->user()->id,
                    'type' => 'adjustment',
                    'quantity' => $stockChange,
                    'balance_after' => $lockedItem->stock_quantity,
                    'notes' => 'Manual stock level adjustment',
                ]);
            }

            return $lockedItem->load('category');
        });

        if ($becameOutOfStock) {
            $this->pushNotifications->sendToRole(
                'custodian',
                'Out of stock alert',
                "{$updatedItem->name} is now out of stock.",
                '/custodian?section=items',
            );
        }

        return response()->json(['data' => $updatedItem]);
    }

    public function restock(Request $request, Item $item)
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1|max:2147483647',
            'notes' => 'nullable|string|max:255',
        ]);

        $updatedItem = DB::transaction(function () use ($data, $item, $request) {
            $lockedItem = Item::query()->lockForUpdate()->findOrFail($item->id);

            if ($lockedItem->stock_quantity > 2147483647 - $data['quantity']) {
                abort(response()->json(['message' => 'This stock addition exceeds the maximum inventory quantity.'], 422));
            }

            $lockedItem->stock_quantity += $data['quantity'];
            $lockedItem->save();

            LedgerMovement::create([
                'item_id' => $lockedItem->id,
                'user_id' => $request->user()->id,
                'type' => 'stock_in',
                'quantity' => $data['quantity'],
                'balance_after' => $lockedItem->stock_quantity,
                'notes' => $data['notes'] ?? 'Additional stock received',
            ]);

            return $lockedItem->load('category');
        });

        return response()->json(['data' => $updatedItem]);
    }

    public function movements(Item $item)
    {
        return response()->json(
            $item->ledgerMovements()
                ->with('user:id,name')
                ->latest('id')
                ->paginate(50)
        );
    }

    public function ledger()
    {
        return response()->json(
            LedgerMovement::with(['item:id,name,item_code', 'user:id,name'])
                ->latest('id')
                ->paginate(50)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'item_code' => ['required', 'string', 'max:255', 'unique:items,item_code'],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'specs' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_threshold' => 'required|integer|min:0',
            'status' => ['required', Rule::in(['available', 'unavailable', 'discontinued'])],
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $photoPath = $request->file('photo')?->store('items', 'public');

        if ($request->hasFile('photo') && ! $photoPath) {
            throw new RuntimeException('The item photo could not be saved.');
        }

        if ($photoPath) {
            $data['photo_url'] = Storage::disk('public')->url($photoPath);
        }

        try {
            $item = DB::transaction(function () use ($data, $request) {
                $item = Item::create($data);

                if ($item->stock_quantity > 0) {
                    LedgerMovement::create([
                        'item_id' => $item->id,
                        'user_id' => $request->user()->id,
                        'type' => 'stock_in',
                        'quantity' => $item->stock_quantity,
                        'balance_after' => $item->stock_quantity,
                        'notes' => 'Initial stock on item creation',
                    ]);
                }

                return $item->load('category');
            });
        } catch (Throwable $exception) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            throw $exception;
        }

        if ($item->stock_quantity === 0) {
            $this->pushNotifications->sendToRole(
                'custodian',
                'Out of stock alert',
                "{$item->name} was added with no stock available.",
                '/custodian?section=items',
            );
        }

        return response()->json(['data' => $item], 201);
    }
}
