<?php

use App\Http\Controllers\api\AuthController;
use App\Http\Controllers\api\DashboardController;
use App\Http\Controllers\api\ItemController;
use App\Http\Controllers\SupplyRequestController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/categories', [ItemController::class, 'categories']);
});

Route::middleware(['auth:sanctum', 'role:student'])->group(function () {
    Route::get('/requests', [SupplyRequestController::class, 'index']);
    Route::post('/requests', [SupplyRequestController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'role:custodian'])->prefix('custodian')->group(function () {
    Route::get('/requests', [SupplyRequestController::class, 'custodianIndex']);
    Route::get('/pick-list', [SupplyRequestController::class, 'pickList']);
    Route::post('/requests/{supplyRequest}/approve', [SupplyRequestController::class, 'approve']);
    Route::post('/requests/{supplyRequest}/decline', [SupplyRequestController::class, 'decline']);
    Route::post('/requests/{supplyRequest}/ready', [SupplyRequestController::class, 'markReady']);
    Route::post('/requests/{supplyRequest}/release', [SupplyRequestController::class, 'release']);
    Route::post('/items', [ItemController::class, 'store']);
});
