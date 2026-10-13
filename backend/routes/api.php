<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ItemController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Any logged-in user (student or custodian)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/categories', [ItemController::class, 'categories']);
});

// Custodian only. Students get a 403 here.
Route::middleware(['auth:sanctum', 'role:custodian'])->prefix('custodian')->group(function () {
    Route::get('/ping', fn () => response()->json(['message' => 'Hello custodian']));
});