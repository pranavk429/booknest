// ---------- Book data ----------
const books = [
  { title: "The Alchemist", author: "Paulo Coelho", category: "fiction", price: 299, rating: 4.5 },
  { title: "JavaScript: The Good Parts", author: "Douglas Crockford", category: "programming", price: 450, rating: 4.6 },
  { title: "DSA Master", author: "Robert C. Martin", category: "programming", price: 550, rating: 4.8 },
  { title: "A Brief History of Time", author: "Stephen Hawking", category: "science", price: 399, rating: 4.7 },
  { title: "India After Gandhi", author: "Ramachandra Guha", category: "history", price: 699, rating: 4.4 },
  { title: "Atomic Habits", author: "James Clear", category: "self-help", price: 499, rating: 4.9 },
  { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", category: "self-help", price: 350, rating: 4.5 },
  { title: "Harry Potter", author: "J.K. Rowling", category: "fiction", price: 599, rating: 4.8 }
];

// Pretty display names for the category values
const categoryLabels = {
  "fiction": "Fiction",
  "programming": "Programming",
  "science": "Science",
  "history": "History",
  "self-help": "Self Help"
};

// ---------- Authentication ----------
// Ask the server who is logged in. If nobody, go back to the login page.
async function checkLoggedIn() {
  try {
    const response = await fetch("/api/me");
    if (!response.ok) {
      window.location.replace("login.html");
      return;
    }
    const data = await response.json();
    document.getElementById("userName").innerText = data.user.name;
  } catch (error) {
    window.location.replace("login.html");
  }
}

// Log out: destroy the server session, then return to the login page
document.getElementById("logoutBtn").addEventListener("click", async function () {
  await fetch("/api/logout", { method: "POST" });
  window.location.replace("login.html");
});

// ---------- Display books ----------
function displayBooks(bookList) {
  const container = document.getElementById("bookContainer");
  container.innerHTML = "";
  document.getElementById("resultCount").innerText = bookList.length + " books found";

  if (bookList.length === 0) {
    container.innerHTML = "<h3>No books found. Try another search.</h3>";
    return;
  }

  bookList.forEach(function (book) {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <div class="book-image">📖</div>
      <h3>${book.title}</h3>
      <p class="author">${book.author}</p>
      <p class="category">${categoryLabels[book.category] || book.category}</p>
      <p class="rating">⭐ ${book.rating}</p>
      <p class="price">₹${book.price}</p>
      <button type="button" class="add-btn" data-title="${book.title}">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

// ---------- Quick search, filter and sort ----------
function filterBooks() {
  const search = document.getElementById("searchBox").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const price = document.getElementById("priceFilter").value;
  const sort = document.getElementById("sortFilter").value;

  const filteredBooks = books.filter(function (book) {
    const matchesSearch =
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search);
    const matchesCategory = category === "all" || book.category === category;
    const matchesPrice = price === "all" || book.price <= Number(price);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sorting
  if (sort === "low") {
    filteredBooks.sort(function (a, b) { return a.price - b.price; });
  }
  if (sort === "high") {
    filteredBooks.sort(function (a, b) { return b.price - a.price; });
  }

  displayBooks(filteredBooks);
}

// ---------- Cart ----------
// The cart is a list of { title, price, qty } saved in the browser,
// so it survives page refreshes.

let cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("booknest_cart"));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("booknest_cart", JSON.stringify(cart));
}

function getCartCount() {
  return cart.reduce(function (total, item) { return total + item.qty; }, 0);
}

function updateCartCount() {
  document.getElementById("cartCount").innerText = getCartCount();
}

function addToCart(title) {
  const book = books.find(function (b) { return b.title === title; });
  if (!book) return;

  const existing = cart.find(function (item) { return item.title === title; });
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ title: book.title, price: book.price, qty: 1 });
  }

  saveCart();
  updateCartCount();
  renderCart();
  showToast('✓ "' + book.title + '" added to cart');
}

function changeQuantity(title, change) {
  const item = cart.find(function (entry) { return entry.title === title; });
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    cart = cart.filter(function (entry) { return entry.title !== title; });
  }

  saveCart();
  updateCartCount();
  renderCart();
}

function removeFromCart(title) {
  cart = cart.filter(function (entry) { return entry.title !== title; });
  saveCart();
  updateCartCount();
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const total = cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  document.getElementById("cartTotal").innerText = "₹" + total;

  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Your cart is empty. Add some books!</p>';
    return;
  }

  container.innerHTML = cart.map(function (item) {
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${item.title}</strong>
          <span class="cart-item-price">₹${item.price} each</span>
        </div>
        <div class="cart-item-actions">
          <button type="button" class="qty-btn" data-action="decrease" data-title="${item.title}">−</button>
          <span class="qty-value">${item.qty}</span>
          <button type="button" class="qty-btn" data-action="increase" data-title="${item.title}">+</button>
          <button type="button" class="remove-btn" data-action="remove" data-title="${item.title}">Remove</button>
        </div>
      </div>`;
  }).join("");
}

function openCart() {
  renderCart();
  document.getElementById("cartModal").hidden = false;
}

function closeCart() {
  document.getElementById("cartModal").hidden = true;
}

// ---------- Toast message ----------
let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2500);
}

// ---------- Clear filters ----------
function clearFilters() {
  document.getElementById("searchBox").value = "";
  document.getElementById("categoryFilter").value = "all";
  document.getElementById("priceFilter").value = "all";
  document.getElementById("sortFilter").value = "default";
  displayBooks(books);
}

// ---------- Event listeners ----------

// Search and filters
document.getElementById("searchBox").addEventListener("input", filterBooks);
document.getElementById("categoryFilter").addEventListener("change", filterBooks);
document.getElementById("priceFilter").addEventListener("change", filterBooks);
document.getElementById("sortFilter").addEventListener("change", filterBooks);

// "Add to Cart" buttons (event delegation works for every book card)
document.getElementById("bookContainer").addEventListener("click", function (event) {
  const addButton = event.target.closest(".add-btn");
  if (addButton) {
    addToCart(addButton.dataset.title);
  }
});

// Open / close the cart
document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("closeCartBtn").addEventListener("click", closeCart);
document.getElementById("cartModal").addEventListener("click", function (event) {
  if (event.target === this) {
    closeCart(); // clicking the dark background closes the cart
  }
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeCart();
  }
});

// Quantity buttons inside the cart
document.getElementById("cartItems").addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const title = button.dataset.title;
  if (button.dataset.action === "increase") changeQuantity(title, 1);
  if (button.dataset.action === "decrease") changeQuantity(title, -1);
  if (button.dataset.action === "remove") removeFromCart(title);
});

// Checkout
document.getElementById("checkoutBtn").addEventListener("click", function () {
  if (cart.length === 0) {
    showToast("Your cart is empty - add some books first!");
    return;
  }
  cart = [];
  saveCart();
  updateCartCount();
  renderCart();
  closeCart();
  showToast("✓ Order placed successfully! Thank you.");
});

// Clear cart
document.getElementById("clearCartBtn").addEventListener("click", function () {
  if (cart.length === 0) {
    showToast("Your cart is already empty");
    return;
  }
  cart = [];
  saveCart();
  updateCartCount();
  renderCart();
  showToast("Cart cleared");
});

// ---------- Start ----------
checkLoggedIn();
updateCartCount();
renderCart();
displayBooks(books);
