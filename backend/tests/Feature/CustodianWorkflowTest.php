<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\LedgerMovement;
use App\Models\SupplyRequest;
use App\Models\User;
use App\Services\PushNotificationService;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CustodianWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_registration_always_creates_a_student_account(): void
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

    public function test_custodian_registration_creates_a_custodian_account(): void
    {
        $this->postJson('/api/custodian/register', [
            'name' => 'New Custodian',
            'email' => 'new-custodian@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'student',
        ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'custodian');
    }

    public function test_login_endpoints_only_accept_their_own_role(): void
    {
        $student = User::factory()->create(['name' => 'Test Student', 'role' => 'student']);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $this->postJson('/api/custodian/login', [
            'email' => $custodian->email,
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'custodian');

        $this->postJson('/api/login', [
            'email' => $student->email,
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'student');

        $this->postJson('/api/custodian/login', [
            'email' => $student->email,
            'password' => 'password',
        ])->assertUnprocessable();

        $this->postJson('/api/login', [
            'email' => $custodian->email,
            'password' => 'password',
        ])->assertUnprocessable();
    }

    public function test_push_subscriptions_are_saved_and_deleted_for_the_current_user(): void
    {
        config()->set('services.webpush.public_key', 'test-public-key');
        $student = User::factory()->create(['role' => 'student']);
        $subscription = [
            'endpoint' => 'https://fcm.googleapis.com/device/123',
            'keys' => [
                'p256dh' => 'browser-public-key',
                'auth' => 'browser-auth-token',
            ],
        ];

        $this->getJson('/api/push/vapid-public-key')->assertUnauthorized();

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/push/vapid-public-key')
            ->assertOk()
            ->assertJsonPath('publicKey', 'test-public-key');

        $this->postJson('/api/push-subscriptions', $subscription)->assertNoContent();

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $student->id,
            'endpoint' => $subscription['endpoint'],
            'public_key' => 'browser-public-key',
            'auth_token' => 'browser-auth-token',
            'content_encoding' => 'aes128gcm',
        ]);

        $this->postJson('/api/push-subscriptions', [
            ...$subscription,
            'endpoint' => 'https://attacker.example.test/metadata',
        ])->assertUnprocessable();

        $this->deleteJson('/api/push-subscriptions', [
            'endpoint' => $subscription['endpoint'],
        ])->assertNoContent();

        $this->assertDatabaseMissing('push_subscriptions', [
            'endpoint' => $subscription['endpoint'],
        ]);
    }

    public function test_push_alerts_are_sent_for_new_requests_pickup_and_out_of_stock(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'PAPER-PUSH-001',
            'name' => 'A4 paper',
            'stock_quantity' => 3,
            'min_threshold' => 1,
        ]);
        $student = User::factory()->create(['name' => 'Test Student', 'role' => 'student']);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $pushNotifications = \Mockery::mock(PushNotificationService::class);
        $pushNotifications->shouldReceive('sendToRole')
            ->once()
            ->withArgs(fn ($role, $title, $body, $url) => $role === 'custodian'
                && $title === 'New supply request'
                && preg_match('/^Test Student submitted request #\d+\.$/', $body) === 1
                && $url === '/custodian')
            ->ordered();
        $pushNotifications->shouldReceive('sendToUser')
            ->once()
            ->withArgs(fn ($userId, $title, $body, $url) => $userId === $student->id
                && $title === 'Request ready for pickup'
                && preg_match('/^Your supply request #\d+ is ready for pickup\.$/', $body) === 1
                && $url === '/inventory')
            ->ordered();
        $pushNotifications->shouldReceive('sendToRole')
            ->once()
            ->with('custodian', 'Out of stock alert', 'A4 paper is now out of stock.', '/custodian?section=items')
            ->ordered();
        $this->app->instance(PushNotificationService::class, $pushNotifications);

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/requests', [
                'purpose' => 'Classroom supplies',
                'items' => [['item_id' => $item->id, 'quantity' => 3]],
            ])
            ->assertCreated();

        $request = SupplyRequest::firstOrFail();

        $this->actingAs($custodian, 'sanctum')
            ->postJson("/api/custodian/requests/{$request->id}/approve")
            ->assertOk();

        $this->postJson("/api/custodian/requests/{$request->id}/ready")
            ->assertOk();

        $this->postJson("/api/custodian/requests/{$request->id}/release")
            ->assertOk();
    }

    public function test_manual_stock_adjustment_sends_out_of_stock_alert_only_when_stock_reaches_zero(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'PAPER-ADJUST-001',
            'name' => 'Copy paper',
            'stock_quantity' => 4,
            'min_threshold' => 1,
        ]);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $pushNotifications = \Mockery::mock(PushNotificationService::class);
        $pushNotifications->shouldReceive('sendToRole')
            ->once()
            ->with('custodian', 'Out of stock alert', 'Copy paper is now out of stock.', '/custodian?section=items');
        $this->app->instance(PushNotificationService::class, $pushNotifications);

        $itemData = [
            'category_id' => $category->id,
            'item_code' => $item->item_code,
            'name' => $item->name,
            'price' => 0,
            'stock_quantity' => '0',
            'min_threshold' => $item->min_threshold,
            'status' => 'unavailable',
        ];

        $this->actingAs($custodian, 'sanctum')
            ->putJson("/api/custodian/items/{$item->id}", $itemData)
            ->assertOk()
            ->assertJsonPath('data.stock_quantity', '0');

        $this->putJson("/api/custodian/items/{$item->id}", $itemData)
            ->assertOk();
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

        $this->actingAs($custodian, 'sanctum')
            ->getJson('/api/custodian/ledger')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'release')
            ->assertJsonPath('data.0.quantity', -3)
            ->assertJsonPath('data.0.item.name', 'Blue pens');
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

    public function test_custodian_can_edit_restock_and_review_item_stock_movements(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $custodian = User::factory()->create(['role' => 'custodian']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'PAPER-EDIT-001',
            'name' => 'Copy paper',
            'price' => 12.50,
            'stock_quantity' => 20,
            'min_threshold' => 5,
            'status' => 'available',
        ]);

        $this->actingAs($custodian, 'sanctum')
            ->putJson("/api/custodian/items/{$item->id}", [
                'category_id' => $category->id,
                'item_code' => 'PAPER-EDIT-001',
                'name' => 'Recycled copy paper',
                'description' => 'Updated description',
                'specs' => 'A4',
                'price' => 15.75,
                'stock_quantity' => 18,
                'min_threshold' => 4,
                'status' => 'discontinued',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Recycled copy paper')
            ->assertJsonPath('data.price', 15.75)
            ->assertJsonPath('data.stock_quantity', 18)
            ->assertJsonPath('data.status', 'discontinued');

        $this->postJson("/api/custodian/items/{$item->id}/restock", [
            'quantity' => 7,
            'notes' => 'Supplier delivery',
        ])
            ->assertOk()
            ->assertJsonPath('data.stock_quantity', 25);

        $this->assertDatabaseHas('ledger_movements', [
            'item_id' => $item->id,
            'user_id' => $custodian->id,
            'type' => 'adjustment',
            'quantity' => -2,
            'balance_after' => 18,
        ]);
        $this->assertDatabaseHas('ledger_movements', [
            'item_id' => $item->id,
            'user_id' => $custodian->id,
            'type' => 'stock_in',
            'quantity' => 7,
            'balance_after' => 25,
            'notes' => 'Supplier delivery',
        ]);

        $this->getJson("/api/custodian/items/{$item->id}/movements")
            ->assertOk()
            ->assertJsonPath('data.0.type', 'stock_in')
            ->assertJsonPath('data.0.user.name', $custodian->name)
            ->assertJsonPath('data.1.type', 'adjustment');

        $this->getJson('/api/custodian/ledger')
            ->assertOk()
            ->assertJsonPath('data.0.item.name', 'Recycled copy paper')
            ->assertJsonPath('data.0.quantity', 7);
    }

    public function test_custodian_can_filter_the_ledger_and_prepare_all_matching_rows_for_printing(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'LEDGER-FILTER-001',
            'name' => 'Ledger filter paper',
            'stock_quantity' => 10,
        ]);
        $custodian = User::factory()->create(['name' => 'First Custodian', 'role' => 'custodian']);
        $otherCustodian = User::factory()->create(['name' => 'Other Custodian', 'role' => 'custodian']);

        $matchingMovement = LedgerMovement::create([
            'item_id' => $item->id,
            'user_id' => $custodian->id,
            'type' => 'stock_in',
            'quantity' => 5,
            'balance_after' => 10,
        ]);
        $olderMovement = LedgerMovement::create([
            'item_id' => $item->id,
            'user_id' => $otherCustodian->id,
            'type' => 'adjustment',
            'quantity' => -1,
            'balance_after' => 9,
        ]);
        $olderMovement->created_at = now()->subDays(2);
        $olderMovement->save();

        $filters = [
            'date_from' => now()->toDateString(),
            'date_to' => now()->toDateString(),
            'item_id' => $item->id,
            'user_id' => $custodian->id,
        ];

        $this->actingAs($custodian, 'sanctum')
            ->getJson('/api/custodian/ledger/filters')
            ->assertOk()
            ->assertJsonPath('items.0.id', $item->id)
            ->assertJsonPath('people.0.id', $custodian->id);

        $this->getJson('/api/custodian/ledger?'.http_build_query($filters))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matchingMovement->id);

        $this->getJson('/api/custodian/ledger/print?'.http_build_query($filters))
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $matchingMovement->id);

        $this->getJson('/api/custodian/ledger?date_to='.now()->toDateString())
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.1.id', $matchingMovement->id);

        $this->getJson('/api/custodian/ledger?date_from=2026-10-31&date_to=2026-10-30')
            ->assertUnprocessable();
    }

    public function test_student_cannot_edit_restock_or_view_the_stock_ledger(): void
    {
        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'PAPER-SECURE-001',
            'name' => 'Copy paper',
            'stock_quantity' => 5,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'student']), 'sanctum')
            ->putJson("/api/custodian/items/{$item->id}", [])
            ->assertForbidden();

        $this->postJson("/api/custodian/items/{$item->id}/restock", ['quantity' => 10])
            ->assertForbidden();

        $this->getJson("/api/custodian/items/{$item->id}/movements")
            ->assertForbidden();

        $this->getJson('/api/custodian/ledger')
            ->assertForbidden();
    }

    public function test_inventory_categories_can_be_seeded_repeatedly(): void
    {
        Artisan::call('db:seed', ['--class' => CategorySeeder::class]);
        Artisan::call('db:seed', ['--class' => CategorySeeder::class]);

        $this->assertDatabaseCount('categories', 3);
        $this->assertDatabaseHas('categories', [
            'name' => 'Office Supplies',
            'slug' => 'office-supplies',
        ]);
    }

    public function test_custodian_can_upload_an_item_photo_for_students_to_view(): void
    {
        Storage::fake('public');

        $category = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $custodian = User::factory()->create(['role' => 'custodian']);

        $response = $this->actingAs($custodian, 'sanctum')
            ->post('/api/custodian/items', [
                'category_id' => $category->id,
                'item_code' => 'PAPER-PHOTO-001',
                'name' => 'Presentation paper',
                'description' => 'Heavyweight paper',
                'specs' => 'A4, 200 gsm',
                'price' => 20,
                'stock_quantity' => 10,
                'min_threshold' => 2,
                'status' => 'available',
                'photo' => UploadedFile::fake()->createWithContent(
                    'paper.png',
                    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8ioAAAAASUVORK5CYII=')
                ),
            ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Presentation paper');

        $photoUrl = $response->json('data.photo_url');
        $photoPath = 'items/'.basename(parse_url($photoUrl, PHP_URL_PATH));
        Storage::disk('public')->assertExists($photoPath);

        $this->actingAs(User::factory()->create(['role' => 'student']), 'sanctum')
            ->getJson('/api/items/'.$response->json('data.id'))
            ->assertOk()
            ->assertJsonPath('photo_url', $photoUrl)
            ->assertJsonPath('specs', 'A4, 200 gsm');

        $this->actingAs($custodian, 'sanctum')
            ->getJson('/api/custodian/items')
            ->assertOk()
            ->assertJsonPath('0.photo_url', $photoUrl);
    }

    public function test_custodian_item_listing_is_not_available_to_students(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'student']), 'sanctum')
            ->getJson('/api/custodian/items')
            ->assertForbidden();
    }

    public function test_student_can_cancel_their_own_pending_request(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $request = SupplyRequest::create([
            'user_id' => $student->id,
            'purpose' => 'Classroom supplies',
            'status' => 'pending',
        ]);

        $this->actingAs($student, 'sanctum')
            ->postJson("/api/requests/{$request->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('supply_requests', [
            'id' => $request->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_student_cannot_cancel_another_students_request(): void
    {
        $owner = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $request = SupplyRequest::create([
            'user_id' => $owner->id,
            'purpose' => 'Classroom supplies',
            'status' => 'pending',
        ]);

        $this->actingAs($otherStudent, 'sanctum')
            ->postJson("/api/requests/{$request->id}/cancel")
            ->assertNotFound();

        $this->assertDatabaseHas('supply_requests', [
            'id' => $request->id,
            'status' => 'pending',
        ]);
    }

    public function test_student_cannot_cancel_a_request_after_it_is_approved(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $request = SupplyRequest::create([
            'user_id' => $student->id,
            'purpose' => 'Classroom supplies',
            'status' => 'approved',
        ]);

        $this->actingAs($student, 'sanctum')
            ->postJson("/api/requests/{$request->id}/cancel")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Only pending requests can be cancelled.');

        $this->assertDatabaseHas('supply_requests', [
            'id' => $request->id,
            'status' => 'approved',
        ]);
    }

    public function test_student_can_load_item_details_with_photo_specs_and_stock(): void
    {
        $category = Category::create(['name' => 'Laboratory', 'slug' => 'laboratory']);
        $item = Item::create([
            'category_id' => $category->id,
            'item_code' => 'LAB-010',
            'name' => 'Safety goggles',
            'photo_url' => 'https://example.test/goggles.jpg',
            'specs' => 'Anti-fog, adjustable strap',
            'stock_quantity' => 12,
            'min_threshold' => 3,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'student']), 'sanctum')
            ->getJson("/api/items/{$item->id}")
            ->assertOk()
            ->assertJsonPath('name', 'Safety goggles')
            ->assertJsonPath('photo_url', 'https://example.test/goggles.jpg')
            ->assertJsonPath('specs', 'Anti-fog, adjustable strap')
            ->assertJsonPath('stock_quantity', 12)
            ->assertJsonPath('category.name', 'Laboratory');
    }
}
