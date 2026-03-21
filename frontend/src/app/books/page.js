'use client';
import { useState, useEffect } from 'react';
import { booksAPI, ordersAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BooksPage() {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [ordering, setOrdering] = useState(null);
  const [msg, setMsg]           = useState('');
  const { user } = useAuth();
  const router   = useRouter();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async (query = {}) => {
    setLoading(true);
    try {
      const res = await booksAPI.getAll(query);
      setBooks(res.data.books);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadBooks({ search });
  };

  const handleOrder = async (book) => {
    if (!user) { router.push('/auth/login'); return; }
    setOrdering(book.id);
    setMsg('');
    try {
      await ordersAPI.placeOrder({ bookId: book.id, quantity: 1 });
      setMsg(`✅ Order placed for "${book.title}"! Check your notifications.`);
      loadBooks({ search }); // refresh stock
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.error || 'Failed to place order'}`);
    } finally {
      setOrdering(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-800">Books</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          {user?.role === 'admin' && (
            <Link href="/books/add" className="btn-primary mr-4 whitespace-nowrap pt-2">
              + Add Book
            </Link>
          )}
          <input
            className="input w-64"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary">Search</button>
          {search && (
            <button type="button" className="btn-secondary" onClick={() => { setSearch(''); loadBooks(); }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded text-sm font-sans border ${msg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-stone-400 font-sans">Loading books…</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-stone-400 font-sans">No books found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="card flex flex-col justify-between gap-4">
              <div>
                <span className="badge bg-stone-100 text-stone-600 mb-3">{book.category}</span>
                <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">{book.title}</h2>
                <p className="text-stone-500 text-sm font-sans mb-2">by {book.author}</p>
                <p className="text-stone-600 text-sm font-sans">{book.description}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-2xl font-serif font-bold text-stone-800">${book.price}</span>
                  <span className="ml-2 text-xs font-sans text-stone-400">{book.stock} in stock</span>
                </div>
                <button
                  onClick={() => handleOrder(book)}
                  disabled={ordering === book.id || book.stock === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ordering === book.id ? 'Ordering…' : book.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
