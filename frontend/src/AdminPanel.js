import { useState, useEffect } from "react";
import {
  Trash2,
  Edit2,
  Plus,
  Download,
  Users,
  BarChart3,
  LogOut,
  Book,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

import "./admin.css";

const API = "http://localhost:3000/api";

export function AdminPanel({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
  });

  useEffect(() => {
    if (activeTab === "books") fetchBooks();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "stats") fetchStats();
  }, [activeTab]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/books`);
      const data = await res.json();
      setBooks(data.data.books || data.data || []);
    } catch (err) {
      setMessage("Error loading books");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Users API response:", data);

      // Handle the response structure
      if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("Unexpected users data structure:", data);
        setMessage("Unexpected data format from server");
        setMessageType("error");
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setMessage(
        "Error loading users. Make sure GET /api/users endpoint exists."
      );
      setMessageType("error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch books and history for stats
      const booksRes = await fetch(`${API}/books`);
      const booksData = await booksRes.json();
      const allBooks = booksData.data.books || booksData.data || [];
      setBooks(allBooks);
    } catch (err) {
      setMessage("Error loading stats");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (
      !formData.title ||
      !formData.author ||
      !formData.category ||
      !formData.isbn
    ) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }

    try {
      const res = await fetch(`${API}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: user.id,
        }),
      });

      if (res.ok) {
        setMessage("Book added successfully!");
        setMessageType("success");
        setFormData({ title: "", author: "", category: "", isbn: "" });
        setShowAddForm(false);
        fetchBooks();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error adding book");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error adding book");
      setMessageType("error");
    }
  };

  const handleEditBook = async () => {
    try {
      const res = await fetch(`${API}/books/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Note: ISBN is intentionally excluded here as it's typically immutable.
          title: formData.title,
          author: formData.author,
          category: formData.category,
          available: formData.available,
          id: user.id, // User ID for authentication
        }),
      });

      if (res.ok) {
        setMessage("Book updated successfully!");
        setMessageType("success");
        // Ensure all fields are reset
        setFormData({
          title: "",
          author: "",
          category: "",
          isbn: "",
          available: true,
        });
        setEditingId(null);
        fetchBooks();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error updating book");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error updating book (Network/Connection issue)");
      setMessageType("error");
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      const res = await fetch(`${API}/books/${bookId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });

      if (res.ok) {
        setMessage("Book deleted successfully!");
        setMessageType("success");
        fetchBooks();
      } else {
        setMessage("Error deleting book");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error deleting book");
      setMessageType("error");
    }
  };

  const handleExport = async (type) => {
    console.log("=== EXPORT FUNCTION CALLED ===");
    console.log("Type:", type);
    console.log("User object:", user);
    console.log("User ID:", user?.id);

    try {
      if (!user || !user.id) {
        console.error("NO USER ID FOUND!");
        setMessage("User session invalid. Please login again.");
        setMessageType("error");
        return;
      }

      const endpoint =
        type === "books" ? "books/export/books" : "books/export/history";
      const exportUrl = `${API}/${endpoint}?userId=${user.id}`;

      console.log("Full export URL:", exportUrl);
      console.log("About to fetch...");

      const res = await fetch(exportUrl, {
        method: "GET",
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      if (res.ok) {
        console.log("SUCCESS - Creating download...");
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${type}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        setMessage(`${type} exported successfully!`);
        setMessageType("success");
      } else {
        const errorData = await res.json();
        console.error("Export error response:", errorData);
        setMessage(`Error: ${errorData.message || "Export failed"}`);
        setMessageType("error");
      }
    } catch (err) {
      console.error("Export exception:", err);
      setMessage("Error exporting data: " + err.message);
      setMessageType("error");
    }
  };
  const startEdit = (book) => {
    setEditingId(book.id);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      available: book.available,
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: "", author: "", category: "", isbn: "" });
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="logo-brand">
              <span className="logo-text">LMS</span>
              <Book size={24} className="logo-svg" aria-hidden />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="admin-user">
              <div className="avatar">AD</div>
              <div className="admin-info">
                <div className="admin-name">{user.name}</div>
                <div className="admin-role">Admin</div>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn">
              <span className="logout-icon">↪</span>
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div
          className={`m-4 p-4 rounded-lg ${messageType === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="admin-tabs">
            <button
              onClick={() => setActiveTab("books")}
              className={`admin-tab ${activeTab === "books" ? "tab-active" : ""}`}
            >
              <Book size={18} className="inline mr-2" /> Books
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`admin-tab ${activeTab === "users" ? "tab-active" : ""}`}
            >
              <Users size={18} className="inline mr-2" /> Users
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`admin-tab ${activeTab === "stats" ? "tab-active" : ""}`}
            >
              <BarChart3 size={18} className="inline mr-2" /> Stats & Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* BOOKS TAB */}
        {activeTab === "books" && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingId(null);
                  setFormData({
                    title: "",
                    author: "",
                    category: "",
                    isbn: "",
                  });
                }}
                className="admin-top-cta"
              >
                <Plus size={18} /> Add New Book
              </button>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingId) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border-l-4 border-blue-600 dark:border-blue-500 transition-colors duration-200">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  {editingId ? "Edit Book" : "Add New Book"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="Book title"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Author
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="Author name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="Category"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) =>
                        setFormData({ ...formData, isbn: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 dark:text-white"
                      placeholder="ISBN"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Availability Status
                    </label>
                    <div className="flex items-center space-x-3 h-[42px]">
                      <input
                        type="checkbox"
                        id="available-switch"
                        checked={formData.available} // 🎯 BIND CHECKED STATE
                        onChange={
                          (e) =>
                            setFormData({
                              ...formData,
                              available: e.target.checked,
                            }) // 🎯 UPDATE ON CHANGE
                        }
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="available-switch"
                        className="text-gray-700"
                      >
                        {formData.available ? (
                          <span className="font-semibold text-green-600">
                            Available
                          </span>
                        ) : (
                          <span className="font-semibold text-red-600">
                            Borrowed/Unavailable
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={editingId ? handleEditBook : handleAddBook}
                    className="gradient-btn"
                  >
                    {editingId ? "Update Book" : "Add Book"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Books Table */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading books...
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600 transition-colors duration-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        ISBN
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr
                        key={book.id}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <td className="px-6 py-3 text-gray-900 dark:text-gray-100">
                          {book.title}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {book.author}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {book.category}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {book.isbn}
                        </td>
                        <td className="px-6 py-3 flex gap-2">
                          <button
                            onClick={() => startEdit(book)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {books.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No books found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading users...
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600 transition-colors duration-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900 dark:text-gray-100 font-semibold">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200"
                      >
                        <td className="px-6 py-3 text-gray-900 dark:text-gray-100 font-semibold">
                          {u.id}
                        </td>
                        <td className="px-6 py-3 text-gray-900 dark:text-gray-100">
                          {u.name}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {u.email}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              u.role === "admin"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STATS & EXPORT TAB */}
        {activeTab === "stats" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  📚 Books Statistics
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    Total Books:{" "}
                    <strong className="text-2xl text-blue-600 dark:text-blue-400">
                      {books.length}
                    </strong>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Available:{" "}
                    <strong className="text-xl text-green-600 dark:text-green-400">
                      {books.filter((b) => b.available).length}
                    </strong>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Borrowed:{" "}
                    <strong className="text-xl text-orange-600 dark:text-orange-400">
                      {books.filter((b) => !b.available).length}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  📥 Export Data
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExport("books")}
                    className="gradient-btn"
                  >
                    <Download size={18} /> Export Books (CSV)
                  </button>
                  <button
                    onClick={() => handleExport("history")}
                    className="gradient-btn"
                    style={{
                      background: "linear-gradient(90deg,#10b981,#06b6d4)",
                    }}
                  >
                    <Download size={18} /> Export History (CSV)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
