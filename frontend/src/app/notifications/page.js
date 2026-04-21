'use client';
import { useState, useEffect } from 'react';
import { notificationsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) { router.push('/auth/login'); return; }
    if (user) loadNotifications();
  }, [user, authLoading]);

  const loadNotifications = async () => {
    try {
      const res = await notificationsAPI.getMy();
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => (n._id || n.id) === id ? { ...n, read: true } : n));
    } catch { }
  };

  if (authLoading || loading) {
    return <div className="text-center py-20 text-stone-400 font-sans">Loading…</div>;
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-800">Notifications</h1>
        {unread > 0 && (
          <span className="badge bg-red-100 text-red-700">{unread} unread</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12 text-stone-400 font-sans">
          No notifications yet. Place an order to receive one!
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n._id || n.id} className={`card flex items-start justify-between gap-4 ${!n.read ? 'border-l-4 border-l-stone-800' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{n.type === 'order-placed' ? '🛒' : '👋'}</span>
                  <h3 className="font-sans font-semibold text-stone-800 text-sm">{n.title}</h3>
                  {!n.read && <span className="badge bg-stone-800 text-white">New</span>}
                </div>
                <p className="text-stone-600 text-sm font-sans">{n.message}</p>
                <p className="text-stone-400 text-xs font-sans mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n._id || n.id)}
                  className="btn-secondary text-xs whitespace-nowrap"
                >
                  Mark read test
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
