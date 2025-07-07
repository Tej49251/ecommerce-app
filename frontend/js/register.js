document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
    name: document.getElementById("name").value,
    gender: document.getElementById("gender").value,
    role: document.getElementById("role").value,
  };

  const res = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const msg = await res.text();
  alert(msg);
});
