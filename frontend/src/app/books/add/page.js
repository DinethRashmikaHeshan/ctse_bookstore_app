'use client';
import { useState } from 'react';
import { booksAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function AddBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    price: '',
    stock: '',
    category: '',
    description: ''
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // If not admin, you shouldn't be here, but we'll protect the API call anyway.
  if (user && user.role !== 'admin') {
    return <div className="text-center py-20 text-red-500">Access Denied: Admin only</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      await booksAPI.create({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10)
      });
      setMsg('✅ Book created successfully!');
      setTimeout(() => router.push('/books'), 1500);
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.error || 'Failed to create book'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-serif font-bold text-stone-800 mb-6">Add New Book</h1>
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded text-sm font-sans border ${msg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-stone-600 mb-1">Title</label>
          <input className="input w-full" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-stone-600 mb-1">Author</label>
          <input className="input w-full" required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-stone-600 mb-1">ISBN</label>
            <input className="input w-full" required value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">Category</label>
            <input className="input w-full" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-stone-600 mb-1">Price ($)</label>
            <input type="number" step="0.01" min="0" className="input w-full" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">Stock</label>
            <input type="number" min="0" className="input w-full" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-stone-600 mb-1">Description</label>
          <textarea className="input w-full" rows="3" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? 'Adding...' : 'Add Book'}
        </button>
      </form>
    </div>
  );
}
