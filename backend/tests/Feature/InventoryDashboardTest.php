<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
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
            ]);
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
