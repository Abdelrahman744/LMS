import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, LogOut, Book, Search, Filter } from "lucide-react";
import { AdminPanel } from "./AdminPanel";
import Auth from "./Auth";
import ThemeToggle from "./ThemeToggle";
import "./admin.css";
import "./user.css";

const API = "http://localhost:3000/api";

export default function App() {
  const [page, setPage] = useState("auth");
  const [authPage, setAuthPage] = useState("login");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Auth state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Books state
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("browse"); // browse, borrows, history

  // Wrap functions with useCallback to fix dependencies
  const fetchBooks = useCallback(async () => {
    try {
      let url = `${API}/books`;
      if (searchQuery) {
        url = `${API}/books/search?q=${searchQuery}`;
      } else if (filterCategory) {
        url = `${API}/books/filter?category=${filterCategory}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.data.books) {
        setBooks(data.data.books);
      } else {
        setBooks(data.data || []);
      }

      const allBooks = data.data.books || data.data || [];
      const cats = [...new Set(allBooks.map((b) => b.category))];
      setCategories(cats);
    } catch (err) {
      setMessage("Error loading books");
    }
  }, [searchQuery, filterCategory]);

  const fetchMyBorrows = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Fetching borrows for user:", user.id);
      const res = await fetch(`${API}/history/users/${user.id}`, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Borrows response status:", res.status);
      const data = await res.json();
      console.log("Borrows data:", data);
      console.log("Total history records:", data.data?.history?.length);

      if (data.data?.history) {
        const active = data.data.history.filter((h) => !h.returned);
        const returned = data.data.history.filter((h) => h.returned);
        console.log("Active borrows (not returned):", active);
        console.log("Active borrows count:", active.length);
        console.log("Returned books:", returned);

        setMyBorrows(active);
        setBorrowHistory(returned);
      } else {
        console.log("No history found");
        setMyBorrows([]);
        setBorrowHistory([]);
      }
    } catch (err) {
      console.error("Error fetching borrows:", err);
      setMyBorrows([]);
      setBorrowHistory([]);
    }
  }, [user]);

  useEffect(() => {
    if (page === "books") {
      fetchBooks();
    }
  }, [page, fetchBooks]);

  useEffect(() => {
    if (user) {
      fetchMyBorrows();
    }
  }, [user, fetchMyBorrows]);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setMessage("Email and password required");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.data);
        // Check if admin or member
        if (data.data.role === "admin") {
          setPage("admin");
        } else {
          setPage("books");
        }
        setLoginData({ email: "", password: "" });
      } else {
        setMessage(data.message || "Login failed");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Connection error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      setMessage("All fields required");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (registerData.password !== registerData.confirm) {
      setMessage("Passwords do not match");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful! Please login.");
        setTimeout(() => setMessage(""), 3000);
        setAuthPage("login");
        setRegisterData({ name: "", email: "", password: "", confirm: "" });
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (err) {
      setMessage("Connection error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (bookId) => {
    console.log("Attempting to borrow book:", bookId, "for user:", user.id);
    try {
      const res = await fetch(`${API}/borrow/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await res.json();
      console.log("Borrow response:", data);

      if (res.ok) {
        setMessage("Book borrowed successfully!");
        setTimeout(() => setMessage(""), 3000);

        // 1. Manually update the books list to mark this book as unavailable
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === bookId ? { ...book, available: false } : book
          )
        );

        // 2. Fetch fresh data to ensure everything is synced
        fetchBooks();
        fetchMyBorrows();
      } else {
        const errorMsg = data.message || data.error || "Failed to borrow";
        setMessage(errorMsg);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Borrow error:", err);
      setMessage("Error borrowing book");
      setTimeout(() => setMessage(""), 3000);
    }
  };
  const handleReturn = async (bookId) => {
    console.log("Attempting to return book:", bookId, "for user:", user.id);
    try {
      const res = await fetch(`${API}/books/${bookId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await res.json();
      console.log("Return response:", data);

      if (res.ok) {
        setMessage("✓ Book returned successfully!");

        await fetchBooks();
        await fetchMyBorrows();

        // Clear message after 3 seconds without switching tabs
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage(data.message || "Failed to return");
        console.error("Return failed:", data);
        // Auto-dismiss error message
        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
    } catch (err) {
      console.error("Return error:", err);
      setMessage("Error returning book");
      // Auto-dismiss error message
      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPage("auth");
    setAuthPage("login");
    setBooks([]);
    setMyBorrows([]);
    setBorrowHistory([]);
    setActiveTab("browse");
  };

  // ADMIN PAGE
  if (page === "admin" && user) {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  // AUTH PAGE
  if (page === "auth") {
    return (
      <Auth
        authPage={authPage}
        setAuthPage={setAuthPage}
        loginData={loginData}
        setLoginData={setLoginData}
        registerData={registerData}
        setRegisterData={setRegisterData}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        loading={loading}
        message={message}
      />
    );
  }

  // MEMBER BOOKS PAGE
  return (
    <div className="user-page">
      <header className="user-header">
        <div className="user-header-content">
          <div className="user-logo-brand">
            <span className="user-logo-text">LMS</span>
            <Book size={24} className="user-logo-svg" aria-hidden />
          </div>
          <div className="user-info-section">
            <ThemeToggle />
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-welcome">
              Welcome, <strong>{user.name}</strong>
            </div>
            <button onClick={handleLogout} className="user-logout-btn">
              <span>↪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="user-main">
          <div
            className={`user-message ${message.includes("Error") || message.includes("failed") ? "error" : ""}`}
          >
            {message}
          </div>
        </div>
      )}

      <div className="user-main">
        {/* Tab Navigation */}
        <div className="user-tabs">
          <button
            className={`user-tab ${activeTab === "browse" ? "active" : ""}`}
            onClick={() => setActiveTab("browse")}
          >
            📖 Browse Books
          </button>
          <button
            className={`user-tab ${activeTab === "borrows" ? "active" : ""}`}
            onClick={() => setActiveTab("borrows")}
          >
            📚 My Active Borrows
            {myBorrows.length > 0 && (
              <span className="user-tab-badge">{myBorrows.length}/5</span>
            )}
          </button>
          <button
            className={`user-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📜 History ({borrowHistory.length})
          </button>
        </div>

        {/* Browse Books Tab */}
        {activeTab === "browse" && (
          <div className="books-section">
            <h2 className="books-header">📖 Browse and Manage Books</h2>

            <div className="books-filters">
              <div className="filter-input-wrapper">
                <Search className="filter-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-input-wrapper">
                <Filter className="filter-icon" size={20} />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="books-grid">
              {books.map((book) => {
                const isBorrowed = myBorrows.some((b) => b.bookId === book.id);
                return (
                  <div key={book.id} className="book-card">
                    <h3 className="book-card-title">{book.title}</h3>
                    <p className="book-card-author">{book.author}</p>
                    <span className="book-card-category">{book.category}</span>
                    <p className="book-card-isbn">ISBN: {book.isbn}</p>

                    <button
                      onClick={() => handleBorrow(book.id)}
                      disabled={
                        !book.available || isBorrowed || myBorrows.length >= 5
                      }
                      className="book-borrow-btn"
                    >
                      {!book.available
                        ? "Unavailable"
                        : isBorrowed
                          ? "Already Borrowed"
                          : myBorrows.length >= 5
                            ? "Max Limit Reached"
                            : "Borrow"}
                    </button>
                  </div>
                );
              })}
            </div>

            {books.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p className="empty-state-text">
                  No books found. Try adjusting your search or filter.
                </p>
              </div>
            )}
            <button
              className="scroll-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              title="Scroll to top"
            >
              ↑
            </button>
          </div>
        )}

        {/* My Active Borrows Tab */}
        {activeTab === "borrows" && (
          <div className="borrows-section">
            <div className="borrows-header">
              <h2 className="borrows-title">
                📚 My Active Borrows
                <span className="borrows-count">{myBorrows.length}/5</span>
              </h2>
            </div>

            {myBorrows.length > 0 ? (
              <div className="borrows-grid">
                {myBorrows.map((borrow) => (
                  <div key={borrow.bookId} className="borrow-card">
                    <h3 className="borrow-card-title">{borrow.title}</h3>
                    <p className="borrow-card-author">{borrow.author}</p>

                    <div className="borrow-card-meta">
                      <div className="borrow-card-meta-item">
                        <span className="borrow-card-meta-label">
                          Borrowed Date:
                        </span>
                        <span className="borrow-card-meta-value">
                          {borrow.borrowedOn.split("T")[0]}
                        </span>
                      </div>
                      <div className="borrow-card-meta-item">
                        <span className="borrow-card-meta-label">
                          Due Date:
                        </span>
                        <span className="borrow-card-meta-value">
                          {borrow.dueDate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturn(borrow.bookId)}
                      className="borrow-return-btn"
                    >
                      ↩ Return Book
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p className="empty-state-text">You have no active borrows.</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="history-section">
            <h2 className="history-title">📜 Borrowing History</h2>

            {borrowHistory.length > 0 ? (
              <div className="history-list">
                {borrowHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-item-info">
                      <h3 className="history-item-title">{item.title}</h3>
                      <p className="history-item-author">{item.author}</p>
                      <div className="history-item-dates">
                        <span>Borrowed: {item.borrowedOn}</span>
                        <span>
                          Returned: {item.returnedOn ? item.returnedOn : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="history-item-badge">✓ Returned</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📜</div>
                <p className="empty-state-text">No borrowing history yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
