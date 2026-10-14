<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustodianSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguard();

        User::updateOrCreate(
            ['email' => 'custodian@spc.test'],
            [
                'name' => 'Custodian',
                'password' => Hash::make('custodian123'),
                'role' => 'custodian',
            ]
        );

        Model::reguard();
    }
}