'use client';
import { useState, useEffect } from 'react';
import { ordersAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) { router.push('/auth/login'); return; }
    if (user) loadOrders();
  }, [user, authLoading]);

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getMyOrders();
      setOrders(res.data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="text-center py-20 text-stone-400 font-sans">Loading…</div>;
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-stone-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card text-center py-12 text-stone-400 font-sans">
          No orders yet. <a href="/books" className="underline text-stone-600">Browse books →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-sans text-xs text-stone-400 mb-1">Order #{order.id.slice(0, 8)}…</p>
                  <h2 className="font-serif text-lg font-bold text-stone-800">{order.bookTitle}</h2>
                  <p className="text-stone-500 text-sm font-sans">by {order.bookAuthor}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-600'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex gap-6 text-sm font-sans text-stone-600 border-t border-stone-100 pt-3 mt-3">
                <span>Qty: <strong>{order.quantity}</strong></span>
                <span>Unit: <strong>${order.unitPrice}</strong></span>
                <span>Total: <strong className="text-stone-800">${order.totalPrice}</strong></span>
                <span className="ml-auto text-stone-400 text-xs">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
