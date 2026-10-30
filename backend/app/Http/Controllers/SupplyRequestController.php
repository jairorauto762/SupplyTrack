<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\LedgerMovement;
use App\Models\SupplyRequest;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplyRequestController extends Controller
{
    public function __construct(private PushNotificationService $pushNotifications) {}

    public function index(Request $request)
    {
        return response()->json(
            SupplyRequest::with(['user:id,name,email', 'requestItems.item.category'])
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $activeCount = SupplyRequest::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved', 'ready'])
            ->count();

        if ($activeCount >= 3) {
            return response()->json([
                'message' => 'Active request limit reached. You can only have 3 active requests at once.',
            ], 422);
        }

        $validated = $request->validate([
            'purpose' => 'required|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|distinct|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $supplyRequest = DB::transaction(function () use ($user, $validated) {
            $items = Item::query()
                ->whereIn('id', collect($validated['items'])->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($validated['items'] as $requestedItem) {
                $item = $items->get($requestedItem['item_id']);

                if (! $item || $item->status !== 'available' || $item->stock_quantity < $requestedItem['quantity']) {
                    $available = $item?->stock_quantity ?? 0;

                    abort(response()->json([
                        'message' => 'Not enough stock for '.($item?->name ?? 'the selected item').". Available: {$available}",
                    ], 422));
                }
            }

            $req = SupplyRequest::create([
                'user_id' => $user->id,
                'purpose' => $validated['purpose'],
                'status' => 'pending',
            ]);

            foreach ($validated['items'] as $reqItem) {
                $req->items()->create([
                    'item_id' => $reqItem['item_id'],
                    'quantity' => $reqItem['quantity'],
                ]);
            }

            return $req->load(['user:id,name,email', 'requestItems.item.category']);
        });

        $this->pushNotifications->sendToRole(
            'custodian',
            'New supply request',
            "{$user->name} submitted request #{$supplyRequest->id}.",
            '/custodian',
        );

        return response()->json(['message' => 'Request submitted successfully!', 'data' => $supplyRequest], 201);
    }

    public function cancel(Request $request, SupplyRequest $supplyRequest)
    {
        $cancelledRequest = DB::transaction(function () use ($request, $supplyRequest) {
            $lockedRequest = SupplyRequest::query()
                ->whereKey($supplyRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($lockedRequest->user_id === $request->user()->id, 404);

            if ($lockedRequest->status !== 'pending') {
                abort(response()->json(['message' => 'Only pending requests can be cancelled.'], 422));
            }

            $lockedRequest->update(['status' => 'cancelled']);

            return $lockedRequest->load(['user:id,name,email', 'requestItems.item.category']);
        });

        return response()->json([
            'message' => 'Request cancelled successfully.',
            'data' => $cancelledRequest,
        ]);
    }

    public function custodianIndex()
    {
        return response()->json(
            SupplyRequest::with(['user:id,name,email', 'requestItems.item.category'])
                ->whereIn('status', ['pending', 'approved', 'ready'])
                ->latest()
                ->get()
        );
    }

    public function pickList()
    {
        return response()->json(
            SupplyRequest::with(['user:id,name,email', 'requestItems.item.category'])
                ->whereIn('status', ['approved', 'ready'])
                ->oldest()
                ->get()
        );
    }

    public function approve(Request $request, SupplyRequest $supplyRequest)
    {
        if ($supplyRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        $supplyRequest->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json(['data' => $supplyRequest->load(['user:id,name,email', 'requestItems.item.category'])]);
    }

    public function decline(Request $request, SupplyRequest $supplyRequest)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:500']);

        if ($supplyRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be declined.'], 422);
        }

        $supplyRequest->update([
            'status' => 'declined',
            'declined_reason' => $data['reason'] ?? null,
        ]);

        return response()->json(['data' => $supplyRequest->load(['user:id,name,email', 'requestItems.item.category'])]);
    }

    public function markReady(SupplyRequest $supplyRequest)
    {
        if ($supplyRequest->status !== 'approved') {
            return response()->json(['message' => 'Only approved requests can be marked ready.'], 422);
        }

        $supplyRequest->update(['status' => 'ready']);

        $this->pushNotifications->sendToUser(
            $supplyRequest->user_id,
            'Request ready for pickup',
            "Your supply request #{$supplyRequest->id} is ready for pickup.",
            '/inventory',
        );

        return response()->json(['data' => $supplyRequest->load(['user:id,name,email', 'requestItems.item.category'])]);
    }

    public function release(Request $request, SupplyRequest $supplyRequest)
    {
        $outOfStockItems = [];
        $releasedRequest = DB::transaction(function () use ($supplyRequest, $request, &$outOfStockItems) {
            $lockedRequest = SupplyRequest::query()
                ->whereKey($supplyRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedRequest->status !== 'ready') {
                abort(response()->json(['message' => 'Only requests ready for pickup can be released.'], 422));
            }

            $requestItems = $lockedRequest->requestItems()->with('item')->get();
            $items = Item::query()
                ->whereIn('id', $requestItems->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($requestItems as $requestItem) {
                $item = $items->get($requestItem->item_id);

                if (! $item || $item->stock_quantity < $requestItem->quantity) {
                    abort(response()->json([
                        'message' => 'Not enough stock to release '.$item?->name.'. Available: '.($item?->stock_quantity ?? 0),
                    ], 422));
                }
            }

            foreach ($requestItems as $requestItem) {
                $item = $items->get($requestItem->item_id);
                $item->stock_quantity -= $requestItem->quantity;
                $item->save();

                if ($item->stock_quantity <= 0) {
                    $outOfStockItems[] = $item->name;
                }

                LedgerMovement::create([
                    'item_id' => $item->id,
                    'user_id' => $request->user()->id,
                    'type' => 'release',
                    'quantity' => -$requestItem->quantity,
                    'balance_after' => $item->stock_quantity,
                    'notes' => "Released for Request #{$lockedRequest->id} ({$lockedRequest->user->name})",
                ]);
            }

            $lockedRequest->update([
                'status' => 'released',
                'released_at' => now(),
            ]);

            return $lockedRequest->load(['user:id,name,email', 'requestItems.item.category']);
        });

        foreach (array_unique($outOfStockItems) as $itemName) {
            $this->pushNotifications->sendToRole(
                'custodian',
                'Out of stock alert',
                "{$itemName} is now out of stock.",
                '/custodian?section=items',
            );
        }

        return response()->json([
            'message' => 'Items released and ledger updated successfully.',
            'data' => $releasedRequest,
        ]);
    }
}
