import { useEffect, useRef, useState } from 'react';
import api from '../../../api/axios';

const emptyItem = {
  category_id: '',
  item_code: '',
  name: '',
  description: '',
  specs: '',
  price: '0',
  stock_quantity: '0',
  min_threshold: '5',
  status: 'available',
};

function errorMessage(error) {
  const errors = error.response?.data?.errors;
  return errors
    ? Object.values(errors).flat().join(' ')
    : error.response?.data?.message || 'Could not add this inventory item.';
}

export default function AddItemForm({ categories, categoriesError, onAdded }) {
  const [form, setForm] = useState(emptyItem);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const previewUrl = useRef(null);

  useEffect(() => () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
    }
  }, []);

  const changeForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'stock_quantity' && value === '0' && current.status === 'available' ? { status: 'unavailable' } : {}),
      ...(name === 'stock_quantity' && current.stock_quantity === '0' && value !== '0' && current.status === 'unavailable' ? { status: 'available' } : {}),
    }));
  };

  const changePhoto = (event) => {
    const file = event.target.files?.[0] || null;
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
    }
    previewUrl.current = file ? URL.createObjectURL(file) : null;
    setPhoto(file);
    setPhotoPreview(previewUrl.current || '');
  };

  const addItem = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries({
        ...form,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        min_threshold: Number(form.min_threshold),
      }).forEach(([name, value]) => formData.append(name, String(value)));
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await api.post('/custodian/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(`${response.data.data.name} was added to inventory.`);
      setForm({ ...emptyItem, category_id: categories[0]?.id ? String(categories[0].id) : '' });
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = null;
      }
      setPhoto(null);
      setPhotoPreview('');
      await onAdded();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={addItem} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Inventory management</p><h2 className="mt-1 text-xl font-bold text-slate-950">Add a new item</h2><p className="mt-1 text-sm text-slate-500">New stock will be recorded in the inventory ledger.</p></div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Item name<input required name="name" value={form.name} onChange={changeForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
        <label className="text-sm font-medium text-slate-700">Item code<input required name="item_code" value={form.item_code} onChange={changeForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
        <label className="text-sm font-medium text-slate-700">Category<select required name="category_id" value={form.category_id} onChange={changeForm} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5"><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Unit price<input required type="number" min="0" step="0.01" name="price" value={form.price} onChange={changeForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
        <label className="text-sm font-medium text-slate-700">Starting stock<input required type="number" min="0" step="1" name="stock_quantity" value={form.stock_quantity} onChange={changeForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
        <label className="text-sm font-medium text-slate-700">Low-stock threshold<input required type="number" min="0" step="1" name="min_threshold" value={form.min_threshold} onChange={changeForm} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Specifications<input name="specs" value={form.specs} onChange={changeForm} placeholder="Size, color, packaging, or other details" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description<textarea name="description" value={form.description} onChange={changeForm} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5" /></label>
        <label className="text-sm font-medium text-slate-700">Item status<select name="status" value={form.status} onChange={changeForm} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5"><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="discontinued">Discontinued</option></select></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Item photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} className="mt-1.5 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-800" /><span className="mt-1 block text-xs font-normal text-slate-500">Optional. JPEG, PNG, or WebP, up to 5 MB. Students will see this photo on the item details page.</span></label>
        {photoPreview && <div className="sm:col-span-2"><img src={photoPreview} alt="Selected item preview" className="h-48 max-w-full rounded-xl border border-slate-200 object-contain" /></div>}
      </div>
      {categories.length === 0 && !categoriesError && <p role="status" className="text-sm text-amber-800">Inventory categories are not set up yet. Contact your administrator before adding items.</p>}
      <button type="submit" disabled={loading || categories.length === 0} className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Adding item…' : 'Add item to inventory'}</button>
    </form>
  );
}
