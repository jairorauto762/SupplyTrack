<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Office Supplies', 'slug' => 'office-supplies'],
            ['name' => 'Cleaning', 'slug' => 'cleaning'],
            ['name' => 'Laboratory', 'slug' => 'laboratory'],
        ] as $category) {
            Category::firstOrCreate(
                ['slug' => $category['slug']],
                ['name' => $category['name']]
            );
        }
    }
}
