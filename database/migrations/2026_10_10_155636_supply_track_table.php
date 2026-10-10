<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained();
            $table->string('item_code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('specs')->nullable();
            $table->string('photo_url')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_threshold')->default(5);
            $table->enum('status', ['available', 'unavailable', 'discontinued'])->default('available');
            $table->timestamps();
        });

        Schema::create('supply_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->enum('status', ['pending', 'approved', 'ready', 'released', 'done', 'declined'])->default('pending');
            $table->text('purpose');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->text('declined_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
        });

        Schema::create('request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('supply_requests')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained();
            $table->integer('quantity');
            $table->timestamps();
        });

        Schema::create('ledger_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained();
            $table->foreignId('user_id')->constrained(); // Who triggered it
            $table->enum('type', ['stock_in', 'release', 'return', 'adjustment']);
            $table->integer('quantity');
            $table->integer('balance_after');
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('item_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->text('issue_description');
            $table->enum('status', ['pending', 'resolved'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('item_reports');
        Schema::dropIfExists('ledger_movements');
        Schema::dropIfExists('request_items');
        Schema::dropIfExists('supply_requests');
        Schema::dropIfExists('items');
        Schema::dropIfExists('categories');
    }
};

    