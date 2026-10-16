<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\LedgerMovement;
use App\Models\SupplyRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustodianWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_always_creates_a_student_account(): void
    {
        $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'new-user@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'custodian',
        ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'student');
    }

    public function test_students_and_custodians_are_limited_to_their_own_workflows(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/custodian/requests')
            ->assertForbidden();

        $this->actingAs($custodian, 'sanctum')
            ->getJson('/api/requests')
            ->assertForbidden();
    }

    public function test_custodian_can_approve_prepare_and_release_a_student_request(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'PEN-001',
            'name' => 'Blue pens',
            'stock_quantity' => 10,
            'min_threshold' => 2,
        ]);
        $student = User::factory()->create(['role' => 'student']);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/requests', [
                'purpose' => 'Classroom supplies',
                'items' => [['item_id' => $item->id, 'quantity' => 3]],
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $request = SupplyRequest::firstOrFail();

        $this->actingAs($custodian, 'sanctum')
            ->postJson("/api/custodian/requests/{$request->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->postJson("/api/custodian/requests/{$request->id}/ready")
            ->assertOk()
            ->assertJsonPath('data.status', 'ready');

        $this->postJson("/api/custodian/requests/{$request->id}/release")
            ->assertOk()
            ->assertJsonPath('data.status', 'released');

        $this->assertSame(7, $item->fresh()->stock_quantity);
        $this->assertSame(-3, LedgerMovement::where('type', 'release')->value('quantity'));

        $this->postJson("/api/custodian/requests/{$request->id}/release")
            ->assertUnprocessable();

        $this->assertSame(7, $item->fresh()->stock_quantity);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/requests')
            ->assertOk()
            ->assertJsonPath('0.status', 'released')
            ->assertJsonPath('0.request_items.0.item.name', 'Blue pens');
    }

    public function test_students_receive_an_insufficient_stock_error_before_a_request_is_created(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'PEN-002',
            'name' => 'Red pens',
            'stock_quantity' => 2,
            'min_threshold' => 1,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'student']), 'sanctum')
            ->postJson('/api/requests', [
                'purpose' => 'Classroom supplies',
                'items' => [['item_id' => $item->id, 'quantity' => 3]],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Not enough stock for Red pens. Available: 2');

        $this->assertDatabaseCount('supply_requests', 0);
    }

    public function test_custodian_can_add_inventory_and_student_cannot(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $itemData = [
            'category_id' => $category->id,
            'item_code' => 'PAPER-001',
            'name' => 'A4 paper',
            'price' => 10.50,
            'stock_quantity' => 25,
            'min_threshold' => 5,
            'status' => 'available',
        ];

        $this->actingAs(User::factory()->create(['role' => 'student']), 'sanctum')
            ->postJson('/api/custodian/items', $itemData)
            ->assertForbidden();

        $this->actingAs(User::factory()->create(['role' => 'custodian']), 'sanctum')
            ->postJson('/api/custodian/items', $itemData)
            ->assertCreated()
            ->assertJsonPath('data.name', 'A4 paper');

        $this->assertDatabaseHas('ledger_movements', [
            'type' => 'stock_in',
            'quantity' => 25,
            'balance_after' => 25,
        ]);
    }
}
