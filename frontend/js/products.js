document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("http://localhost:3000/products/", {
    headers: authHeader(),
  });
  const products = await res.json();

  const container = document.getElementById("productList");
  container.innerHTML = products.map(p => `
    <div class="card m-2 p-3">
      <h5>${p.name}</h5>
      <p>${p.description}</p>
      <p>Price: ₹${p.price}</p>
      <p>Category: ${p.category}</p>
    </div>
  `).join('');
});
