<?php

namespace App\Http\Controllers;

use App\Models\SupplyRequest;
use App\Models\Item;
use App\Models\LedgerMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplyRequestController extends Controller
{
    // Active Request Limit Check & Stock Validation (Features 8, 12, 36)
    public function store(Request $request)
    {
        $user = $request->user();

        // Feature 36: Limit active requests
        $activeCount = SupplyRequest::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved', 'ready'])
            ->count();

        if ($activeCount >= 3) {
            return response()->json([
                'message' => 'Active request limit reached. You can only have 3 active requests at once.'
            ], 422);
        }

        $validated = $request->validate([
            'purpose' => 'required|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        // Feature 12: Stock Availability Check before creation
        foreach ($validated['items'] as $reqItem) {
            $item = Item::find($reqItem['item_id']);
            if ($item->stock_quantity < $reqItem['quantity']) {
                return response()->json([
                    'message' => "Not enough stock for {$item->name}. Available: {$item->stock_quantity}"
                ], 422);
            }
        }

        $supplyRequest = DB::transaction(function () use ($user, $validated) {
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

            return $req;
        });

        return response()->json(['message' => 'Request submitted successfully!', 'data' => $supplyRequest], 201);
    }

    // Custodian: Release Items & Update Ledger (Features 16, 25)
    public function release(Request $request, $id)
    {
        $supplyRequest = SupplyRequest::with('items.item')->findOrFail($id);

        if ($supplyRequest->status !== 'approved' && $supplyRequest->status !== 'ready') {
            return response()->json(['message' => 'Request is not ready for release.'], 400);
        }

        DB::transaction(function () use ($supplyRequest, $request) {
            foreach ($supplyRequest->items as $reqItem) {
                $item = $reqItem->item;
                $item->stock_quantity -= $reqItem->quantity;
                $item->save();

                // Feature 25: Ledger Entry
                LedgerMovement::create([
                    'item_id' => $item->id,
                    'user_id' => $request->user()->id,
                    'type' => 'release',
                    'quantity' => -$reqItem->quantity,
                    'balance_after' => $item->stock_quantity,
                    'notes' => "Released for Request #{$supplyRequest->id} ({$supplyRequest->user->name})",
                ]);
            }

            $supplyRequest->update([
                'status' => 'released',
                'released_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Items released and ledger updated successfully.']);
    }
}