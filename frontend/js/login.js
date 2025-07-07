document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
  };

  const res = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.jwtToken) {
    localStorage.setItem("jwtToken", data.jwtToken);
    location.href = "products.html";
  } else {
    alert("Login failed: " + data);
  }
});
