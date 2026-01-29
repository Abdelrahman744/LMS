import express from "express";
const router = express.Router();
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//  reload users

const getUsers = () => {
  return JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/users.json`));
};

const signUp = (req, res) => {
  let users = getUsers();

  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Name, email, and password are required",
    });
  }

  // Validate name

  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({
      status: "fail",
      message: "Name must be at least 2 characters long",
    });
  }

  if (name.trim().length > 50) {
    return res.status(400).json({
      status: "fail",
      message: "Name cannot exceed 50 characters",
    });
  }

  // Validate email format

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid email format",
    });
  }

  // Check for duplicate email

  const existingUser = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );
  if (existingUser) {
    return res.status(409).json({
      status: "fail",
      message: "This email is already registered",
    });
  }

  // Validate password strength

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      status: "fail",
      message: "Password must be at least 6 characters long",
    });
  }

  if (password.length > 100) {
    return res.status(400).json({
      status: "fail",
      message: "Password cannot exceed 100 characters",
    });
  }

  const newId = users.length
    ? Math.max(...users.map((u) => Number(u.id)).filter((id) => !isNaN(id))) + 1
    : 1;

  // Always set role to member
  const newUser = {
    id: newId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password,
    role: "member",
  };

  users.push(newUser);

  // 8. Save to file
  fs.writeFile(
    `${__dirname}/../dev-data/users.json`,
    JSON.stringify(users, null, 2),
    (err) => {
      if (err) {
        console.error("User save failed:", err);
        // Rollback
        users.pop();
        return res.status(500).json({
          status: "error",
          message: "Could not save user. Please try again",
        });
      }

      // Don't send password in response

      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        data: { user: userWithoutPassword },
      });
    }
  );
};

const signIn = (req, res) => {
  const users = getUsers();
  // The frontend sends the input in the 'email' variable, but it might be a username
  const { email: loginInput, password } = req.body;

  // 1. Check if fields exist
  if (!loginInput || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Username/Email and password are required",
    });
  }

  // 2. Validate types (BUT REMOVE THE EMAIL REGEX CHECK HERE)
  if (typeof loginInput !== "string" || typeof password !== "string") {
    return res.status(400).json({
      status: "fail",
      message: "Invalid credentials format",
    });
  }

  // 3. Find user by checking BOTH Name AND Email
  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === loginInput.toLowerCase().trim() ||
        u.name.toLowerCase() === loginInput.toLowerCase().trim()) &&
      u.password === password.trim()
  );

  // 4. Handle invalid login
  if (!user) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid email/username or password",
    });
  }

  // 5. Success
  res.status(200).json({
    status: "success",
    message: `Welcome ${user.name}!`,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const getAllUsers = (req, res) => {
  try {
    const users = getUsers();

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.status(200).json({
      status: "success",
      results: usersWithoutPasswords.length,
      data: usersWithoutPasswords,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      status: "error",
      message: "Error fetching users",
    });
  }
};

export { signUp, signIn, getAllUsers };
