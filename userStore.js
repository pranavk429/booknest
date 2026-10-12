// User storage for BookNest.
// Users are kept in users.json and passwords are stored only as bcrypt hashes.

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const USERS_FILE = path.join(__dirname, "users.json");

// Read all users from disk. Returns an empty list if the file does not exist yet.
function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

// Write the user list back to disk.
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Find one user by email (email is always compared in lowercase).
function findByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  return loadUsers().find((user) => user.email === normalized) || null;
}

// Create a new user with a hashed password.
function createUser({ name, email, password }) {
  const users = loadUsers();
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  return { id: user.id, name: user.name, email: user.email };
}

// Check a plain-text password against the stored hash.
function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.passwordHash);
}

// Make sure the demo account exists (used for the practical demo).
function ensureDemoUser() {
  if (!findByEmail("demo@booknest.com")) {
    createUser({ name: "Demo User", email: "demo@booknest.com", password: "demo123" });
    console.log("Seeded demo account: demo@booknest.com / demo123");
  }
}

module.exports = { findByEmail, createUser, verifyPassword, ensureDemoUser };
