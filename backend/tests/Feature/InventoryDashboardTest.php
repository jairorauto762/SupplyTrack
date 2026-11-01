<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\RequestItem;
use App\Models\SupplyRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summary_counts_inventory_stock_levels(): void
    {
        $category = Category::create([
            'name' => 'Office Supplies',
            'slug' => 'office-supplies',
        ]);

        Item::create([
            'category_id' => $category->id,
            'item_code' => 'OFF-001',
            'name' => 'Pens',
            'stock_quantity' => 20,
            'min_threshold' => 5,
        ]);
        Item::create([
            'category_id' => $category->id,
            'item_code' => 'OFF-002',
            'name' => 'Paper',
            'stock_quantity' => 3,
            'min_threshold' => 5,
        ]);
        Item::create([
            'category_id' => $category->id,
            'item_code' => 'OFF-003',
            'name' => 'Folders',
            'stock_quantity' => 0,
            'min_threshold' => 5,
        ]);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertExactJson([
                'total_items' => 3,
                'in_stock' => 1,
                'low_stock' => 1,
                'out_of_stock' => 1,
                'requests_count' => 0,
                'low_stock_items' => [[
                    'id' => Item::where('name', 'Paper')->value('id'),
                    'is_low_stock' => true,
                    'category_id' => $category->id,
                    'item_code' => 'OFF-002',
                    'name' => 'Paper',
                    'stock_quantity' => 3,
                    'min_threshold' => 5,
                    'category' => [
                        'id' => $category->id,
                        'name' => 'Office Supplies',
                    ],
                ]],
                'top_requested_items' => [],
            ]);
    }

    public function test_dashboard_lists_low_stock_and_most_requested_items(): void
    {
        $category = Category::create([
            'name' => 'Office Supplies',
            'slug' => 'office-supplies',
        ]);
        $lowStockItem = Item::create([
            'category_id' => $category->id,
            'item_code' => 'OFF-LOW',
            'name' => 'Low stock paper',
            'stock_quantity' => 2,
            'min_threshold' => 5,
        ]);
        $requestedItem = Item::create([
            'category_id' => $category->id,
            'item_code' => 'OFF-POPULAR',
            'name' => 'Popular pens',
            'stock_quantity' => 20,
            'min_threshold' => 5,
        ]);

        $firstStudent = User::factory()->create(['role' => 'student']);
        $secondStudent = User::factory()->create(['role' => 'student']);
        $firstRequest = SupplyRequest::create([
            'user_id' => $firstStudent->id,
            'purpose' => 'Classwork',
            'status' => 'pending',
        ]);
        $secondRequest = SupplyRequest::create([
            'user_id' => $secondStudent->id,
            'purpose' => 'Classwork',
            'status' => 'released',
        ]);
        $cancelledRequest = SupplyRequest::create([
            'user_id' => $secondStudent->id,
            'purpose' => 'Cancelled need',
            'status' => 'cancelled',
        ]);

        RequestItem::create(['request_id' => $firstRequest->id, 'item_id' => $requestedItem->id, 'quantity' => 3]);
        RequestItem::create(['request_id' => $secondRequest->id, 'item_id' => $requestedItem->id, 'quantity' => 2]);
        RequestItem::create(['request_id' => $cancelledRequest->id, 'item_id' => $lowStockItem->id, 'quantity' => 50]);

        $this->actingAs(User::factory()->create(['role' => 'custodian']), 'sanctum')
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('low_stock_items.0.id', $lowStockItem->id)
            ->assertJsonPath('requests_count', 3)
            ->assertJsonPath('top_requested_items.0.item_id', $requestedItem->id)
            ->assertJsonPath('top_requested_items.0.request_count', 2)
            ->assertJsonPath('top_requested_items.0.quantity_requested', 5);
    }

    public function test_student_request_history_only_returns_the_signed_in_students_requests(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $ownRequest = SupplyRequest::create([
            'user_id' => $student->id,
            'purpose' => 'My supplies',
            'status' => 'pending',
        ]);
        SupplyRequest::create([
            'user_id' => $otherStudent->id,
            'purpose' => 'Someone else supplies',
            'status' => 'pending',
        ]);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/requests')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $ownRequest->id)
            ->assertJsonPath('0.purpose', 'My supplies');
    }

    public function test_inventory_endpoints_require_authentication(): void
    {
        $this->getJson('/api/dashboard/summary')->assertUnauthorized();
        $this->getJson('/api/items')->assertUnauthorized();
        $this->getJson('/api/categories')->assertUnauthorized();
    }

    public function test_inventory_list_returns_database_items_with_category_data(): void
    {
        $category = Category::create([
            'name' => 'Office Supplies',
            'slug' => 'office-supplies',
        ]);

        Item::create([
            'category_id' => $category->id,
            'item_code' => 'OFF-001',
            'name' => 'Blue Pens',
            'stock_quantity' => 20,
            'min_threshold' => 5,
        ]);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/items?search=OFF-001&category='.$category->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', 'Blue Pens')
            ->assertJsonPath('0.category.name', 'Office Supplies');
    }
}
