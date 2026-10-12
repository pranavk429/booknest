// BookNest server.
// Serves the bookstore pages and provides the login / register / logout API.
// The bookstore itself is only reachable when logged in.

const path = require("path");
const express = require("express");
const session = require("express-session");
const userStore = require("./userStore");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

// ---------- Middleware ----------
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "booknest-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // JavaScript on the page cannot read the session cookie
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Auth API ----------

// Create a new account
app.post("/api/register", (req, res) => {
  const { name = "", email = "", password = "" } = req.body || {};
  const errors = {};

  if (String(name).trim().length < 2) {
    errors.name = "Please enter your name (at least 2 characters).";
  }
  if (!EMAIL_REGEX.test(String(email).trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (String(password).length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  if (userStore.findByEmail(email)) {
    return res.status(409).json({ errors: { email: "An account with this email already exists." } });
  }

  const user = userStore.createUser({ name, email, password });
  return res.status(201).json({ message: "Account created successfully.", user });
});

// Log in with email + password
app.post("/api/login", (req, res) => {
  const { email = "", password = "" } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = userStore.findByEmail(email);
  if (!user || !userStore.verifyPassword(user, password)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  return res.json({ user: req.session.user });
});

// Log out (destroy the session)
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out." });
  });
});

// Who is currently logged in?
app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in." });
  }
  return res.json({ user: req.session.user });
});

// ---------- Page protection ----------
function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.redirect("/login.html");
}

function redirectIfAuth(req, res, next) {
  if (req.session.user) {
    return res.redirect("/");
  }
  return next();
}

// The bookstore is private; the login and register pages are for visitors only.
app.get(["/", "/index.html"], requireAuth, (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});
app.get(["/login.html", "/register.html"], redirectIfAuth);

// ---------- Static files + fallbacks ----------
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found." });
});
app.use(express.static(PUBLIC_DIR, {
  setHeaders: function (res) {
    // Always revalidate, so file updates show up immediately (no stale cache)
    res.setHeader("Cache-Control", "no-cache");
  }
}));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: "Something went wrong on the server." });
});

// ---------- Start ----------
userStore.ensureDemoUser();
app.listen(PORT, () => {
  console.log(`BookNest is running at http://localhost:${PORT}`);
});
