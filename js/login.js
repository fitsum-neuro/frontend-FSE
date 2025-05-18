document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const messageArea = document.getElementById("messageArea");
    messageArea.style.display = "none";

    try {
      const response = await fetch("http://localhost:3000/api/userAuth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Login failed");
      }

      const token = response.headers.get("x-auth-token");
      if (!token) {
        throw new Error("No token received");
      }

      localStorage.setItem("authToken", token);

      alert("Login successful!");
      window.location.href = "user_profile.html";
    } catch (err) {
      messageArea.textContent = err.message;
      messageArea.style.display = "block";
      messageArea.style.backgroundColor = "#f8d7da";
      messageArea.style.color = "#721c24";
      messageArea.style.border = "1px solid #f5c6cb";
    }
  });
