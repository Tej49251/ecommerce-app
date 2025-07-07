# ecommerce-app

A RESTful, secure, and scalable backend powering the Ecommerce Lite platform. Built using Node.js, Express.js, SQLite, and JWT for session management. It supports customer and admin roles, product/cart/order APIs, and robust security measures.

 Technologies Used
------------------------------------------------------------------------
| Category       | Technology                                          | 
------------------------------------------------------------------------
| Server         | Node.js with Express.js                             | 
| Database       | SQLite (lightweight, embedded)                      | 
| Auth & Session | bcrypt (password hashing), JWT (stateless sessions) | 
| Deployment     | Render (Linux-based cloud)                          | 
------------------------------------------------------------------------


📦 Backend Directory Structure
backend/
├── ecom.js             # Express server entry point
├── ecommerce.db       # SQLite database file
├── package.json





📋 API Overview
All APIs are RESTful and respond in JSON format. Frontend authentication handled via JWT in localStorage.
🔐 Authentication
POST /register
- Creates a new user with hashed password
- Validates password length and uniqueness
POST /login
- Verifies credentials
- Issues a JWT token with embedded role (admin or customer)
- Returns { jwtToken, role }

📌 Middleware Logic
// authenticateToken.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]
  if (!token) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403)
    req.headers.username = payload.username
    req.headers.role = payload.role
    next()
  })
}


// authorizeRole('admin')
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.headers.role === requiredRole) next()
    else res.sendStatus(403)
  }
}



🛍️ Product APIs (admin only)
__________________________________________________________
| Method | Endpoint             | Description            | 
__________________________________________________________
| GET    | /products/:id        | View product by ID     | 
| POST   | /products/           | Add new product        | 
| PUT    | /products/:id        | Update product details | 
| DELETE | /products/:productId | Delete product         | 


All protected via JWT + role check.

🛒 Cart APIs (customer only)
______________________________________________________
| Method | Endpoint          | Description           | 
______________________________________________________
| GET    | /cart             | View cart items       | 
| POST   | /cart/            | Add item to cart      | 
| PUT    | /cart/:productId/ | Update quantity       | 
| DELETE | /cart/:productId/ | Remove item from cart | 


Logic checks for duplicate entries and updates quantity on repeat additions.

📦 Order APIs (customer only)
___________________________________________________________
| Method | Endpoint            | Description              | 
___________________________________________________________
| POST   | /orders/            | Place order from cart    | 
| GET    | /orders             | View order history       | 
| PATCH  | /orders/:id/cancel  | Cancel active order      | 


- Ensures cart isn’t empty before placing
- Stores all product details at time of order
- Can cancel only open orders

🔒 Privacy & Session Management
- Stateless Auth via JWT: tokens carry role and username
- JWT stored in frontend (localStorage) and verified on every API call
- Sensitive data like JWT_SECRET set via environment variables
- Password hashing with bcrypt to prevent leaks
- Logout clears localStorage on frontend (jwtToken, role)

🚀 Scalability Considerations
- Designed to be modular: middleware separated, DB queries structured
- SQLite works for MVPs; scalable DB options include PostgreSQL or MongoDB
- JWT enables horizontal scaling (no sessions stored server-side)
- Supports pagination and product search with query parameters
- Can easily extend with Redis (for caching), rate-limiting, and WebSocket


---------------FRONTEND-------------------------

 Frontend Overview (Public Folder)
- Pages:
- login.html – user authentication
- register.html – signup with validation
- products.html – display all items
- cart.html – manage selected items
- admin.html – dashboard for product control
- admin-add-product.html – new product entry
- admin-products.html – product list view/edit/delete


- Tech Used:
- HTML5, CSS3, Bootstrap 5 for styling
- JavaScript for dynamic interactions

  
- Design Highlights:
- Flipkart-inspired UI
- Responsive layout for desktop and mobile
- Category-based filtering and product cards
- Alert system for login errors, cart actions, and confirmations

  
- Client-Side Logic:
- JWT stored in localStorage → controls access flow
- Conditional rendering based on role
- Form validation before submission
- AJAX-like fetch calls to backend APIs



⚙️ How to Run Backend Locally
cd backend
npm install
node ecom.js


Server runs on:
http://localhost:3000
