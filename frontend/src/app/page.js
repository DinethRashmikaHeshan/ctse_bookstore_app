import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="font-serif text-5xl font-bold text-stone-800 mb-4">
        Welcome to BookStore
      </h1>
      <p className="text-stone-500 text-lg font-sans mb-10 max-w-xl mx-auto">
        A cloud-native microservices application. Browse books, place orders, and get notifications.
      </p>

      <div className="flex justify-center gap-4">
        <Link href="/books" className="btn-primary text-base px-6 py-3">
          Browse Books
        </Link>
        <Link href="/auth/register" className="btn-secondary text-base px-6 py-3">
          Create Account
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
        {[
          { icon: '👤', title: 'User Service', desc: 'Authentication, JWT tokens, user profiles. Calls Order Service.' },
          { icon: '📖', title: 'Book Service',  desc: 'Book catalog, stock management. Calls User Service.' },
          { icon: '🛒', title: 'Order Service', desc: 'Place and track orders. Calls Book & Notification Services.' },
          { icon: '🔔', title: 'Notification Service', desc: 'In-app order alerts. Calls User Service.' },
        ].map((s) => (
          <div key={s.title} className="card text-center">
            <div className="text-4xl mb-3">{s.icon}</div>
            <h3 className="font-sans font-semibold text-stone-800 mb-2">{s.title}</h3>
            <p className="text-stone-500 text-sm font-sans">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
