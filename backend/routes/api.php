<?php

use Illuminate\Support\Facades\Route;


use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\SupplyRequestController;
use App\Http\Controllers\LedgerController;
use App\Http\Controllers\DashboardController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Authenticated Routes (Laravel Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/profile', [AuthController::class, 'profile']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);

    // Inventory Browse & Search (Features 2-7, 24, 30, 31)
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/items/{id}', [ItemController::class, 'show']);
    Route::post('/items/{id}/report', [ItemController::class, 'reportIssue']);

    // Requester Actions (Features 8-12, 19, 29, 36, 39)
    Route::get('/requests/my-requests', [SupplyRequestController::class, 'myRequests']);
    Route::post('/requests', [SupplyRequestController::class, 'store']);
    Route::post('/requests/{id}/cancel', [SupplyRequestController::class, 'cancel']);

    // Custodian / Admin Middleware Restricted Routes
    Route::middleware('can:custodian-only')->group(function () {
        // Inventory Management (Features 20-23, 35)
        Route::post('/items', [ItemController::class, 'store']);
        Route::put('/items/{id}', [ItemController::class, 'update']);
        Route::post('/items/{id}/restock', [ItemController::class, 'restock']);
        Route::post('/items/{id}/return', [ItemController::class, 'returnItem']);

        // Request Approvals & Releases (Features 15-18, 40)
        Route::get('/custodian/requests', [SupplyRequestController::class, 'custodianIndex']);
        Route::post('/requests/{id}/approve', [SupplyRequestController::class, 'approve']);
        Route::post('/requests/{id}/decline', [SupplyRequestController::class, 'decline']);
        Route::post('/requests/{id}/release', [SupplyRequestController::class, 'release']);

        // Ledger & Analytics (Features 25-28, 34)
        Route::get('/ledger', [LedgerController::class, 'index']);
        Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
    });
});







Route::get('/hello', function () {
    return response()->json(['message' => 'Hello from Laravel API']);
});



   