<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemReport;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ItemReportController extends Controller
{
    public function store(Request $request, Item $item)
    {
        $data = $request->validate([
            'issue_description' => 'required|string|min:5|max:2000',
        ]);

        $report = ItemReport::create([
            'item_id' => $item->id,
            'user_id' => $request->user()->id,
            'issue_description' => trim($data['issue_description']),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Your item information report was sent to the supply custodian.',
            'data' => $report->load(['item:id,name,item_code', 'user:id,name,email']),
        ], 201);
    }

    public function index()
    {
        return response()->json(
            ItemReport::with(['item:id,name,item_code', 'user:id,name,department'])
                ->latest('id')
                ->get()
        );
    }

    public function myReports(Request $request)
    {
        return response()->json(
            ItemReport::with('item:id,name,item_code')
                ->where('user_id', $request->user()->id)
                ->latest('id')
                ->get()
        );
    }

    public function review(Request $request, ItemReport $itemReport)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['resolved', 'dismissed'])],
            'custodian_note' => 'nullable|string|max:1000',
        ]);

        $itemReport->update([
            'status' => $data['status'],
            'custodian_note' => $data['custodian_note'] ?? null,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Item report review saved.',
            'data' => $itemReport->load(['item:id,name,item_code', 'user:id,name,department']),
        ]);
    }
}
