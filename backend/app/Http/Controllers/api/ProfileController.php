<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'course' => 'nullable|string|max:255',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $user = $request->user();
        $newPhotoPath = $request->file('photo')?->store('profiles', 'public');

        if ($request->hasFile('photo') && ! $newPhotoPath) {
            throw new RuntimeException('The profile photo could not be saved.');
        }

        $oldPhotoPath = $user->profile_photo_path;
        $user->update([
            'name' => $data['name'],
            'course' => $data['course'] ?? null,
            'profile_photo_path' => $newPhotoPath ?? $oldPhotoPath,
        ]);

        if ($newPhotoPath && $oldPhotoPath) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return response()->json(['user' => $user->refresh()]);
    }
}
