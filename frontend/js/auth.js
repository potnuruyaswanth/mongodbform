import api from "./axios.js";

// REGISTER
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      
      await api.post("/register", {
        username: username,
        password: password
      });
      alert("Registered successfully");
      window.location.href = "/login.html";
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message);
      alert("Registration failed: " + (error.response?.data?.message || "Unknown error"));
    }
  });
}

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      
      await api.post("/login", {
        username: username,
        password: password
      });
      window.location.href = "/dashboard.html";
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      alert("Login failed: " + (error.response?.data || "Unknown error"));
    }
  });
}
