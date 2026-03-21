'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-stone-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold tracking-tight">
          📚 BookStore
        </Link>

        <div className="flex items-center gap-6 text-sm font-sans">
          <Link href="/books" className="hover:text-stone-300 transition-colors">Books</Link>

          {user ? (
            <>
              <Link href="/orders" className="hover:text-stone-300 transition-colors">My Orders</Link>
              <Link href="/notifications" className="hover:text-stone-300 transition-colors">Notifications</Link>
              <span className="text-stone-400">|</span>
              <span className="text-stone-300 text-xs">{user.email}</span>
              {user.role === 'admin' && (
                <span className="badge bg-amber-500 text-white">admin</span>
              )}
              <button onClick={handleLogout} className="hover:text-stone-300 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-stone-300 transition-colors">Login</Link>
              <Link href="/auth/register" className="btn-primary text-xs">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
