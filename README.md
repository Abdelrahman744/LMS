# 📚 Library Management System (LMS) API

> **Live Demo:** [https://lms-two-alpha.vercel.app/api/books](https://lms-two-alpha.vercel.app/api/books)  
> **API Documentation:** [View on Postman](https://documenter.getpostman.com/view/49732434/2sBXcAJ32R)

A secure, RESTful API built with **Node.js, Express, and MongoDB** to manage library operations. It handles user authentication, book inventory, borrowing systems, and user history tracking.

---

## 🚀 Features

* **🔐 Authentication & Security:**
    * JWT-based Sign Up, Login, and Password Reset.
    * Protected routes (Middleware) to prevent unauthorized access.
    * Password encryption using bcrypt.
* **📖 Book Management:**
    * CRUD operations for books (Create, Read, Update, Delete).
    * Search functionality.
* **🔄 Borrowing System:**
    * Borrow books with due dates.
    * Auto-check for stock availability.
    * Return books and update inventory automatically.
* **📜 History Tracking:**
    * View borrowing history for specific users or books.
* **☁️ Deployment:**
    * Deployed on **Vercel** (Serverless).
    * Database hosted on **MongoDB Atlas**.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Security:** JWT, Bcrypt, Helmet, Express-Rate-Limit
* **Deployment:** Vercel

---

## 🔌 API Endpoints

### 👤 Users (Auth)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/users/register` | Create a new account |
| `POST` | `/api/users/login` | Login and get Token |
| `POST` | `/api/users/forgotPassword` | Request password reset email |
| `PATCH` | `/api/users/resetPassword/:token` | Reset password |
| `PATCH` | `/api/users/updateMe` | Update profile details (Protected) |

### 📚 Books
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/books` | Get all books |
| `GET` | `/api/books/:id` | Get single book details |
| `POST` | `/api/books` | Add a new book (Admin) |
| `PATCH` | `/api/books/:id` | Update book details |
| `DELETE` | `/api/books/:id` | Delete a book |

### 🔄 Borrowing & History
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/borrow/:id` | Borrow a book (Requires Due Date) |
| `POST` | `/api/books/:id/return` | Return a borrowed book |
| `GET` | `/api/history/users/:id` | View a user's borrowing history |
| `GET` | `/api/history/books/:id` | View a book's borrowing history |

---

## ⚙️ Local Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Abdelrahman744/LMS.git](https://github.com/Abdelrahman744/LMS.git)
    cd lms
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add:
    ```env
    NODE_ENV=development
    PORT=3000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRES_IN=90d
    ```

4.  **Run the server:**
    ```bash
    npm start
    ```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is open source.