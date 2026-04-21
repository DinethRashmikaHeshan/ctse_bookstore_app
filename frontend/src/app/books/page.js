"use client";
import { useState, useEffect } from "react";
import { booksAPI, ordersAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

const categoryColors = {
  programming: "badge-programming",
  devops: "badge-devops",
  cloud: "badge-cloud",
  architecture: "badge-architecture",
  novel: "badge-novel",
};

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState(null);
  const [msg, setMsg] = useState("");
  const { user } = useAuth();
  const router = useRouter();

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
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const bookId = book._id || book.id;
    setOrdering(bookId);
    setMsg("");
    try {
      await ordersAPI.placeOrder({ bookId, quantity: 1 });
      setMsg(`✅ Order placed for "${book.title}"! Check your notifications.`);
      loadBooks({ search });
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.error || "Failed to place order"}`);
    } finally {
      setOrdering(null);
    }
  };

  const bookId = (book) => book._id || book.id;

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1
            style={{
              fontFamily: "Lora, serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            Book Catalog
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.9rem",
              marginTop: "2px",
            }}
          >
            {books.length} books available
          </p>
        </div>
        <form
          onSubmit={handleSearch}
          className="flex gap-2 flex-wrap items-center"
        >
          {user?.role === "admin" && (
            <Link
              href="/books/add"
              className="btn-primary"
              style={{ marginRight: "8px" }}
            >
              + Add Book
            </Link>
          )}
          <input
            className="input"
            style={{ width: "220px" }}
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearch("");
                loadBooks();
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Message banner */}
      {msg && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "0.875rem",
            fontFamily: "DM Sans, sans-serif",
            border: "1.5px solid",
            borderColor: msg.startsWith("✅") ? "#a9dfbf" : "#f1948a",
            background: msg.startsWith("✅") ? "#eafaf1" : "#fdf2f2",
            color: msg.startsWith("✅") ? "#1e8449" : "#c0392b",
          }}
        >
          {msg}
        </div>
      )}

      {/* States */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "5rem 0",
            color: "var(--muted)",
          }}
        >
          Loading books…
        </div>
      ) : books.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "5rem 0",
            color: "var(--muted)",
          }}
        >
          No books found.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {books.map((book) => (
            <div
              key={bookId(book)}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              {/* Top section */}
              <div>
                <span
                  className={`badge ${categoryColors[book.category?.toLowerCase()] || ""}`}
                >
                  {book.category}
                </span>
                <h2
                  style={{
                    fontFamily: "Lora, serif",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    margin: "10px 0 4px",
                    lineHeight: 1.3,
                  }}
                >
                  {book.title}
                </h2>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.82rem",
                    marginBottom: "10px",
                  }}
                >
                  by {book.author}
                </p>
                {book.description && (
                  <p
                    style={{
                      color: "#57534e",
                      fontSize: "0.85rem",
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {book.description}
                  </p>
                )}
              </div>

              {/* Bottom section */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1.5px solid var(--border)",
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "Lora, serif",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    ${Number(book.price).toFixed(2)}
                  </span>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "0.75rem",
                      color:
                        book.stock > 5
                          ? "#1e8449"
                          : book.stock > 0
                            ? "#d35400"
                            : "#c0392b",
                      fontWeight: 500,
                    }}
                  >
                    {book.stock > 0 ? `${book.stock} in stock` : "Out of stock"}
                  </span>
                </div>
                <button
                  onClick={() => handleOrder(book)}
                  disabled={ordering === bookId(book) || book.stock === 0}
                  className="btn-primary"
                  style={{ padding: "8px 18px", fontSize: "0.875rem" }}
                >
                  {ordering === bookId(book)
                    ? "Ordering…"
                    : book.stock === 0
                      ? "Out of Stock"
                      : "Buy Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
