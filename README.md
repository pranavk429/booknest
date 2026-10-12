# 📚 BookNest — Online Bookstore

A real-time bookstore management system with quick search and filter, plus a secure
login / registration system.

## Features

- **Quick search** — books are filtered by title or author as you type
- **Filters** — category, price, and sorting (price low → high / high → low)
- **Clear Filters** button
- **Shopping cart** — add books, adjust quantities, remove items, see the total,
  and checkout with a confirmation (the cart is saved in your browser)
- **Login / Register / Logout** with server-side session authentication
- **Protected bookstore** — visitors who are not logged in are redirected to the login page
- **Client-side and server-side validation** — email format, password length,
  password confirmation, duplicate email detection
- **Passwords are hashed with bcrypt** — never stored in plain text

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | HTML, CSS, JavaScript (fetch API)       |
| Backend        | Node.js + Express                       |
| Sessions       | express-session (httpOnly cookie)       |
| Passwords      | bcryptjs (hashing)                      |
| User data      | `users.json` (created automatically)    |

## How to Run

1. Install the dependencies (first time only):

   ```
   npm install
   ```

2. Start the server:

   ```
   npm start
   ```

3. Open **http://localhost:3000** — you will be redirected to the login page.

> Keep the terminal running while using the site; stop it with `Ctrl + C`.

## Demo Account

| Email               | Password  |
| ------------------- | --------- |
| `demo@booknest.com` | `demo123` |

You can also create your own account from the Register page.

## Project Structure

```
booknest/
├── server.js          # Express server: auth API + page protection
├── userStore.js       # User storage (users.json) + bcrypt hashing
├── package.json
├── users.json         # Created automatically on first run
├── README.md
└── public/
    ├── index.html     # Bookstore (search, filters, sort, cart)
    ├── style.css      # All styles, incl. login/register pages
    ├── script.js      # Bookstore logic + auth guard + logout
    ├── login.html     # Login page
    ├── register.html  # Register page
    └── auth.js        # Shared form validation + submit logic
```

## API Endpoints (for reference)

| Method | Route           | Purpose                                  |
| ------ | --------------- | ---------------------------------------- |
| POST   | `/api/register` | Create an account                        |
| POST   | `/api/login`    | Log in and start a session               |
| POST   | `/api/logout`   | End the session                          |
| GET    | `/api/me`       | Return the currently logged-in user      |

## Notes

- Sessions are stored in memory: restarting the server logs everyone out (log in again).
- User accounts are stored in `users.json`; passwords are stored only as bcrypt hashes.
