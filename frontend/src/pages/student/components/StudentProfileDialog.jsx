import { useEffect, useState } from 'react';
import api from '../../../api/axios';

export default function StudentProfileDialog({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name || '');
  const [course, setCourse] = useState(user.course || '');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user.photo_url || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => () => {
    if (photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
  }, [photoPreview]);

  const submitProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('course', course.trim());
    if (photo) formData.append('photo', photo);

    try {
      const response = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved(response.data.user);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-profile-title"
        className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Student account</p>
            <h2 id="student-profile-title" className="mt-1 text-lg font-bold text-slate-950">Edit profile</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            Close
          </button>
        </div>

        <form onSubmit={submitProfile} className="space-y-4">
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Course
            <input maxLength={255} value={course} onChange={(event) => setCourse(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Profile photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setPhoto(file);
                setPhotoPreview(file ? URL.createObjectURL(file) : user.photo_url || '');
              }}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-800"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">Optional. JPEG, PNG, or WebP, up to 5 MB.</span>
          </label>
          {photoPreview && <img src={photoPreview} alt="Profile preview" className="h-20 w-20 rounded-full border border-slate-200 object-cover" />}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
