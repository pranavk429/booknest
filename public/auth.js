// Shared client-side logic for the login and register pages.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Helpers ----------
function setFieldError(id, message) {
  const input = document.getElementById(id);
  const error = document.getElementById(id + "Error");
  if (input) input.classList.add("input-invalid");
  if (error) error.innerText = message;
}

function clearFieldError(id) {
  const input = document.getElementById(id);
  const error = document.getElementById(id + "Error");
  if (input) input.classList.remove("input-invalid");
  if (error) error.innerText = "";
}

function clearAllErrors(form) {
  form.querySelectorAll("input").forEach(function (input) {
    input.classList.remove("input-invalid");
  });
  form.querySelectorAll(".field-error").forEach(function (error) {
    error.innerText = "";
  });
  hideFormError();
}

function showFormError(message) {
  const box = document.getElementById("formError");
  if (box) {
    box.innerText = message;
    box.hidden = false;
  }
}

function hideFormError() {
  const box = document.getElementById("formError");
  if (box) {
    box.innerText = "";
    box.hidden = true;
  }
}

// Disable the button and show a loading label while waiting for the server
function setLoading(button, isLoading, loadingText) {
  if (isLoading) {
    button.dataset.label = button.innerText;
    button.innerText = loadingText;
    button.disabled = true;
  } else {
    button.innerText = button.dataset.label;
    button.disabled = false;
  }
}

// ---------- Show / hide password toggles ----------
document.querySelectorAll(".toggle-password").forEach(function (button) {
  button.addEventListener("click", function () {
    const input = document.getElementById(button.dataset.toggle);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.innerText = show ? "🙈" : "👁";
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

// ---------- Login page ----------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  // Coming back from a successful registration? Show the green banner.
  if (new URLSearchParams(window.location.search).get("registered") === "1") {
    document.getElementById("successBanner").hidden = false;
  }

  loginForm.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", function () {
      clearFieldError(input.id);
      hideFormError();
    });
  });

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearAllErrors(loginForm);

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Client-side validation
    let hasError = false;
    if (email === "") {
      setFieldError("email", "Email is required.");
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError("email", "Please enter a valid email address.");
      hasError = true;
    }
    if (password === "") {
      setFieldError("password", "Password is required.");
      hasError = true;
    }
    if (hasError) return;

    // Send to the server
    const button = document.getElementById("submitBtn");
    setLoading(button, true, "Logging in...");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      });
      const data = await response.json();

      if (response.ok) {
        window.location.href = "/";
        return;
      }

      if (data.errors) {
        Object.keys(data.errors).forEach(function (field) {
          setFieldError(field, data.errors[field]);
        });
      } else {
        showFormError(data.error || "Login failed. Please try again.");
      }
      setLoading(button, false);
    } catch (error) {
      showFormError("Could not reach the server. Please make sure it is running.");
      setLoading(button, false);
    }
  });
}

// ---------- Register page ----------
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", function () {
      clearFieldError(input.id);
      hideFormError();
    });
  });

  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearAllErrors(registerForm);

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Client-side validation
    let hasError = false;
    if (name.length < 2) {
      setFieldError("name", "Please enter your name (at least 2 characters).");
      hasError = true;
    }
    if (email === "") {
      setFieldError("email", "Email is required.");
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError("email", "Please enter a valid email address.");
      hasError = true;
    }
    if (password.length < 6) {
      setFieldError("password", "Password must be at least 6 characters.");
      hasError = true;
    }
    if (confirmPassword === "") {
      setFieldError("confirmPassword", "Please confirm your password.");
      hasError = true;
    } else if (confirmPassword !== password) {
      setFieldError("confirmPassword", "Passwords do not match.");
      hasError = true;
    }
    if (hasError) return;

    // Send to the server
    const button = document.getElementById("submitBtn");
    setLoading(button, true, "Creating account...");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, password: password })
      });
      const data = await response.json();

      if (response.ok) {
        window.location.href = "login.html?registered=1";
        return;
      }

      if (data.errors) {
        Object.keys(data.errors).forEach(function (field) {
          setFieldError(field, data.errors[field]);
        });
      }
      if (data.error) {
        showFormError(data.error);
      }
      setLoading(button, false);
    } catch (error) {
      showFormError("Could not reach the server. Please make sure it is running.");
      setLoading(button, false);
    }
  });
}

// ---------- Already logged in? Go straight to the bookstore ----------
(async function redirectIfLoggedIn() {
  try {
    const response = await fetch("/api/me");
    if (response.ok) {
      window.location.replace("/");
    }
  } catch (error) {
    // Server not reachable - stay on this page.
  }
})();
