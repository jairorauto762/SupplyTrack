<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_reports', function (Blueprint $table) {
            $table->enum('status', ['pending', 'resolved', 'dismissed'])->default('pending')->change();
            $table->text('custodian_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
        });
    }

    public function down(): void
    {
        DB::table('item_reports')->where('status', 'dismissed')->update(['status' => 'pending']);

        Schema::table('item_reports', function (Blueprint $table) {
            $table->enum('status', ['pending', 'resolved'])->default('pending')->change();
        });

        Schema::table('item_reports', function (Blueprint $table) {
            $table->dropColumn(['custodian_note', 'reviewed_at']);
        });
    }
};
