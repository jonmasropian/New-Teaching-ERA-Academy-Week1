// ── NAVBAR ────────────────────────────────────────────────────────────────────

function toggleMenu() {
  const menu   = document.getElementById("navMenu");
  const toggle = document.getElementById("menuToggle");

  menu.classList.toggle("active");

  if (menu.classList.contains("active")) {
    toggle.textContent = "✕";
  } else {
    toggle.textContent = "☰";
  }
}

window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");

  if (window.scrollY > 50) {
    navbar.classList.add("navbar-floating");
  } else {
    navbar.classList.remove("navbar-floating");
  }
});

// ── SECTION LOADER ────────────────────────────────────────────────────────────

function loadSection(elementId, filePath) {
  fetch(filePath)
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      document.getElementById(elementId).innerHTML = data;

      // After loading, attach event listeners for forms
      if (elementId === "auth-section") {
        attachAuthListeners();
      } else if (elementId === "contact-section") {
        attachContactListener();
      }
    })
    .catch(function (error) {
      console.log("Error loading section:", error);
    });
}

loadSection("hero-section",     "sections/hero.html");
loadSection("features-section", "sections/features.html");
loadSection("auth-section",     "sections/auth.html");
loadSection("contact-section",  "sections/contact.html");
loadSection("cta-section",      "sections/cta.html");

// ── BACKEND URL ───────────────────────────────────────────────────────────────
// Change this if your backend runs on a different port
const BACKEND_URL = "http://localhost:3000";

// ── AUTH FORMS ────────────────────────────────────────────────────────────────

function attachAuthListeners() {

  // ── SIGNUP FORM ──────────────────────────────────────────────────────────
  const signupForm = document.getElementById("signup-form");

  if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const first_name = document.getElementById("signup-firstname").value.trim();
      const last_name  = document.getElementById("signup-lastname").value.trim();
      const email      = document.getElementById("signup-email").value.trim();
      const password   = document.getElementById("signup-password").value;

      // ── Frontend validation ──────────────────────────────────────────────

      // Rule 1: password must be at least 8 characters
      if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
      }

      // Rule 2: password must contain at least one special character
      // Must match the backend regex exactly: /[!@#$%]/
      const specialCharPattern = /[!@#$%]/;
      if (!specialCharPattern.test(password)) {
        alert("Password must include at least one special character: ! @ # $ %");
        return;
      }

      // ── Send to backend ──────────────────────────────────────────────────
      // Field names must match what POST /users expects: first_name, last_name
      const formData = {
        first_name: first_name,
        last_name:  last_name,
        email:      email,
        password:   password
      };

      fetch(BACKEND_URL + "/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData)
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data.message) {
            // Success — user was created
            alert("Account created successfully! You can now log in.");
            signupForm.reset();
          } else {
            // Backend returned a validation or server error
            alert("Error: " + data.error);
          }
        })
        .catch(function (error) {
          // Network error — backend probably not running
          alert("Could not connect to the server. Make sure the backend is running (npm run dev).");
          console.error("Signup error:", error);
        });
    });
  }

  // ── LOGIN FORM ───────────────────────────────────────────────────────────
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email    = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      // ── Frontend validation ──────────────────────────────────────────────

      // Rule 1: password must be at least 8 characters
      if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
      }
      const specialCharPattern = /[!@#$%]/;
      if (!specialCharPattern.test(password)) {
        alert("Password must include at least one special character: ! @ # $ %");
        return;
      }

      // ── Send to backend ──────────────────────────────────────────────────
      const formData = {
        email:    email,
        password: password
      };

      fetch(BACKEND_URL + "/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData)
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          if (data.message) {
            localStorage.setItem("era_user", JSON.stringify({
              first_name: data.first_name,
              last_name:  data.last_name,
              student_id: data.student_id
            }));
            window.location.href = "dashboard.html";
          } else {
            alert("Error: " + data.error);
          }
        })
        .catch(function (error) {
          alert("Could not connect to the server. Make sure the backend is running (npm run dev).");
          console.error("Login error:", error);
        });
    });
  }
}

// ── CONTACT FORM ──────────────────────────────────────────────────────────────

function attachContactListener() {
  const contactForm = document.getElementById("contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = {
        name:     document.getElementById("contact-name").value.trim(),
        email:    document.getElementById("contact-email").value.trim(),
        interest: document.getElementById("contact-interest").value,
        message:  document.getElementById("contact-message").value.trim()
      };

      // Contact form is not connected to the backend yet
      // This will be wired up in a future lesson
      console.log("Contact Form Data:", formData);
      alert("Message sent successfully! We will get back to you soon.");
      contactForm.reset();
    });
  }
}