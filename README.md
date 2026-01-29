# Library Management System – Full Stack Application

A complete **Library Management System** featuring a **Node.js + Express** backend (using JSON files for storage) and a **React + Tailwind CSS** frontend.

Live: `http://localhost:3000` (for API) and `http://localhost:5173` (for Frontend)  
Author: Abdelrahman Ashraf  
Tech Stack: Node.js, Express.js, React, Tailwind CSS

---

### Features

| Feature                                | Status |
| :------------------------------------- | :----- |
| User Registration & Login              | Done   |
| Role-based Access (Admin / Member)     | Done   |
| Add / Edit / Delete Books (Admin)      | Done   |
| **Admin can update Book Availability** | Done   |
| Borrow & Return Books                  | Done   |
| Max 5 active borrows per user          | Done   |
| Search & Filter Books                  | Done   |
| User & Book Borrowing History          | Done   |
| Export Books & History as CSV          | Done   |
| Full input validation & error handling | Done   |
| **Modern React Frontend Interface**    | Done   |

---

### API Endpoints

The API is served on `http://localhost:3000/api`.

#### Public Routes

| Method | Endpoint                         | Description            |
| :----- | :------------------------------- | :--------------------- |
| POST   | `/api/users/register`            | Register new user      |
| POST   | `/api/users/login`               | Login (simple check)   |
| GET    | `/api/books`                     | Get all books          |
| GET    | `/api/books/search?q=keyword`    | Search by title/author |
| GET    | `/api/books/filter?category=...` | Filter by category     |
| GET    | `/api/books/:id`                 | Get single book        |

#### Authenticated Routes (Requires **User ID in Request Body**)

These endpoints require the user to send their unique `id` in the JSON request body for authentication via the `restrictTo` middleware.

| Method | Endpoint                     | Body Example        | Description                            |
| :----- | :--------------------------- | :------------------ | :------------------------------------- |
| POST   | `/api/borrow/:bookId`        | `{ "id": 2 }`       | Borrow a book                          |
| POST   | `/api/books/:bookId/return`  | `{ "id": 2 }`       | Return a book                          |
| GET    | `/api/history/users/:userId` | **N/A** (ID in URL) | View own or any user's history (admin) |

#### Admin Only Routes

These routes are restricted to users with the `"admin"` role, verified by their `id` in the request body (for POST/PATCH/DELETE) or query (for GET exports).

| Method | Endpoint                     | Body Example                                                                | Description                      |
| :----- | :--------------------------- | :-------------------------------------------------------------------------- | :------------------------------- |
| POST   | `/api/books`                 | `{ "id":1, "title":"...", "author":"...", "category":"...", "isbn":"..." }` | Add book                         |
| PATCH  | `/api/books/:id`             | `{ "id":1, "title":"New Title", "available": false }`                       | Edit book details & availability |
| DELETE | `/api/books/:id`             | `{ "id": 1 }`                                                               | Delete book                      |
| GET    | `/api/history/books/:bookId` | **N/A** (ID in URL)                                                         | View book borrow history         |

#### Admin Export Routes (Requires **User ID in Query Parameter**)

These endpoints require the admin to pass their ID as a query parameter for authentication.

| Method | Endpoint                    | Query Example | Description          |
| :----- | :-------------------------- | :------------ | :------------------- |
| GET    | `/api/books/export/books`   | `?userId=1`   | Download books.csv   |
| GET    | `/api/books/export/history` | `?userId=1`   | Download history.csv |

---

### How to Run (Full-Stack Setup)

This project requires two separate terminals: one for the backend API and one for the React frontend.

#### 1. Backend Setup

The API is located in the root of the cloned repository.

```bash
# Clone the repository (if not already done)
# git clone [https://github.com/abd66lrahman/lms-project.git](https://github.com/abd66lrahman/lms-project.git)
cd lms-project

# Install dependencies for the backend
npm install

# Start the API server on port 3000
npm run dev
# Server running on port 3000 .........
```
