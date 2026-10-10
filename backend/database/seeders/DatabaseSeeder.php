<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // The two users (this is the part from your screenshot)
        User::create([
            'name' => 'Custodian',
            'email' => 'custodian@supplytrack.test',
            'password' => Hash::make('password'),
            'role' => 'custodian',
        ]);

        User::create([
            'name' => 'Test Student',
            'email' => 'student@supplytrack.test',
            'password' => Hash::make('password'),
            'role' => 'student',
        ]);

        // Categories and items
        $office = Category::create(['name' => 'Office Supplies', 'slug' => 'office-supplies']);
        $clean  = Category::create(['name' => 'Cleaning', 'slug' => 'cleaning']);
        $lab    = Category::create(['name' => 'Laboratory', 'slug' => 'laboratory']);

        Item::create(['category_id' => $office->id, 'item_code' => 'OFF-001', 'name' => 'Ballpen (Blue)', 'specs' => '0.7mm, box of 12', 'price' => 95.00, 'stock_quantity' => 80, 'min_threshold' => 20]);
        Item::create(['category_id' => $office->id, 'item_code' => 'OFF-002', 'name' => 'Bond Paper A4', 'specs' => '80gsm, 500 sheets', 'price' => 260.00, 'stock_quantity' => 8, 'min_threshold' => 10]);
        Item::create(['category_id' => $office->id, 'item_code' => 'OFF-003', 'name' => 'Stapler', 'specs' => 'Standard size', 'price' => 150.00, 'stock_quantity' => 0, 'min_threshold' => 5, 'status' => 'unavailable']);
        Item::create(['category_id' => $clean->id, 'item_code' => 'CLN-001', 'name' => 'Floor Mop', 'specs' => 'Cotton head', 'price' => 180.00, 'stock_quantity' => 15, 'min_threshold' => 5]);
        Item::create(['category_id' => $clean->id, 'item_code' => 'CLN-002', 'name' => 'Disinfectant 1L', 'specs' => 'Lemon scent', 'price' => 120.00, 'stock_quantity' => 4, 'min_threshold' => 10]);
        Item::create(['category_id' => $lab->id, 'item_code' => 'LAB-001', 'name' => 'Test Tube Set', 'specs' => 'Glass, 10 pcs', 'price' => 350.00, 'stock_quantity' => 30, 'min_threshold' => 8]);
    }
}