<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\ItemReport;
use App\Models\SupplyRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplyTrackFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_report_incorrect_item_information_and_custodians_can_review_it(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'REPORT-001',
            'name' => 'Copy paper',
            'stock_quantity' => 12,
            'min_threshold' => 3,
        ]);
        $student = User::factory()->create(['role' => 'student', 'department' => 'Library']);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $this->actingAs($student, 'sanctum')
            ->postJson("/api/items/{$item->id}/reports", [
                'issue_description' => 'The item description lists the wrong paper size.',
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'Your item information report was sent to the supply custodian.')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('item_reports', [
            'item_id' => $item->id,
            'user_id' => $student->id,
            'issue_description' => 'The item description lists the wrong paper size.',
            'status' => 'pending',
        ]);

        $this->actingAs($custodian, 'sanctum')
            ->getJson('/api/custodian/item-reports')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.item.name', 'Copy paper')
            ->assertJsonPath('0.user.department', 'Library');
    }

    public function test_only_students_can_submit_item_reports_and_only_custodians_can_review_them(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'REPORT-002',
            'name' => 'Folders',
            'stock_quantity' => 5,
            'min_threshold' => 2,
        ]);
        $student = User::factory()->create(['role' => 'student']);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $this->actingAs($custodian, 'sanctum')
            ->postJson("/api/items/{$item->id}/reports", ['issue_description' => 'The name is incorrect.'])
            ->assertForbidden();

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/custodian/item-reports')
            ->assertForbidden();

        $this->actingAs($custodian, 'sanctum')
            ->getJson('/api/my-reports')
            ->assertForbidden();
    }

    public function test_custodian_can_resolve_or_dismiss_reports_with_a_note_and_students_cannot_review_them(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'REPORT-003',
            'name' => 'Desk organizer',
            'stock_quantity' => 4,
            'min_threshold' => 1,
        ]);
        $student = User::factory()->create(['role' => 'student']);
        $custodian = User::factory()->create(['role' => 'custodian']);
        $report = ItemReport::create([
            'item_id' => $item->id,
            'user_id' => $student->id,
            'issue_description' => 'The listed dimensions are incorrect.',
            'status' => 'pending',
        ]);

        $this->actingAs($custodian, 'sanctum')
            ->patchJson("/api/custodian/item-reports/{$report->id}", [
                'status' => 'resolved',
                'custodian_note' => 'Updated the item dimensions.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved')
            ->assertJsonPath('data.custodian_note', 'Updated the item dimensions.')
            ->assertJsonPath('data.reviewed_at', fn ($value) => $value !== null);

        $this->assertDatabaseHas('item_reports', [
            'id' => $report->id,
            'status' => 'resolved',
            'custodian_note' => 'Updated the item dimensions.',
        ]);

        $this->actingAs($student, 'sanctum')
            ->patchJson("/api/custodian/item-reports/{$report->id}", ['status' => 'dismissed'])
            ->assertForbidden();

        $this->actingAs($custodian, 'sanctum')
            ->patchJson("/api/custodian/item-reports/{$report->id}", ['status' => 'dismissed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'dismissed');
    }

    public function test_students_only_see_their_own_item_reports_and_notes(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'REPORT-004',
            'name' => 'Desk tray',
            'stock_quantity' => 3,
            'min_threshold' => 1,
        ]);
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $ownReport = ItemReport::create([
            'item_id' => $item->id,
            'user_id' => $student->id,
            'issue_description' => 'The listed color is incorrect.',
            'status' => 'resolved',
            'custodian_note' => 'Color information corrected.',
            'reviewed_at' => now(),
        ]);
        $otherReport = ItemReport::create([
            'item_id' => $item->id,
            'user_id' => $otherStudent->id,
            'issue_description' => 'The listed dimensions are incorrect.',
            'status' => 'pending',
        ]);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/my-reports')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $ownReport->id)
            ->assertJsonPath('0.item.name', 'Desk tray')
            ->assertJsonPath('0.status', 'resolved')
            ->assertJsonPath('0.custodian_note', 'Color information corrected.')
            ->assertJsonMissing(['id' => $otherReport->id]);
    }

    public function test_custodian_request_summary_groups_counts_by_department(): void
    {
        $math = User::factory()->create(['role' => 'student', 'department' => 'Mathematics']);
        $science = User::factory()->create(['role' => 'student', 'department' => 'Science']);

        SupplyRequest::create(['user_id' => $math->id, 'purpose' => 'Classwork', 'status' => 'pending']);
        SupplyRequest::create(['user_id' => $math->id, 'purpose' => 'Classwork', 'status' => 'released']);
        SupplyRequest::create(['user_id' => $math->id, 'purpose' => 'Classwork', 'status' => 'done']);
        SupplyRequest::create(['user_id' => $math->id, 'purpose' => 'Classwork', 'status' => 'declined']);
        SupplyRequest::create(['user_id' => $math->id, 'purpose' => 'Classwork', 'status' => 'cancelled']);
        SupplyRequest::create(['user_id' => $science->id, 'purpose' => 'Lab work', 'status' => 'ready']);

        $this->actingAs(User::factory()->create(['role' => 'custodian']), 'sanctum')
            ->getJson('/api/custodian/request-summary')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.department', 'Mathematics')
            ->assertJsonPath('0.total_requests', 5)
            ->assertJsonPath('0.pending_requests', 1)
            ->assertJsonPath('0.released_requests', 1)
            ->assertJsonPath('0.done_requests', 1)
            ->assertJsonPath('0.declined_requests', 1)
            ->assertJsonPath('0.cancelled_requests', 1)
            ->assertJsonPath('1.department', 'Science')
            ->assertJsonPath('1.ready_requests', 1);
    }

    public function test_custodian_can_record_returns_and_filter_the_ledger_to_show_them(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'RETURN-001',
            'name' => 'Stapler',
            'stock_quantity' => 4,
            'min_threshold' => 2,
        ]);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $this->actingAs($custodian, 'sanctum')
            ->postJson("/api/custodian/items/{$item->id}/returns", [
                'quantity' => 3,
                'notes' => 'Returned after event',
            ])
            ->assertOk()
            ->assertJsonPath('data.stock_quantity', 7);

        $this->assertDatabaseHas('ledger_movements', [
            'item_id' => $item->id,
            'user_id' => $custodian->id,
            'type' => 'return',
            'quantity' => 3,
            'balance_after' => 7,
            'notes' => 'Returned after event',
        ]);

        $this->getJson('/api/custodian/ledger?type=return')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'return')
            ->assertJsonPath('data.0.item.name', 'Stapler');
    }

    public function test_return_quantities_must_be_positive_and_not_overflow_the_inventory_column(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'RETURN-002',
            'name' => 'Markers',
            'stock_quantity' => 2147483647,
            'min_threshold' => 2,
        ]);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $this->actingAs($custodian, 'sanctum')
            ->postJson("/api/custodian/items/{$item->id}/returns", ['quantity' => 0])
            ->assertUnprocessable();

        $this->postJson("/api/custodian/items/{$item->id}/returns", ['quantity' => 1])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This return exceeds the maximum inventory quantity.');
    }
}
