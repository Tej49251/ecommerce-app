// === E-COMMERCE API ===
const express = require('express')
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require("cors");

const app = express()
app.use(express.json())
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, 'frontend')));

const dbPath = path.join(__dirname, 'ecommerce.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database })
    app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
    });

    app.listen(3000, () => console.log('Server running at http://localhost:3000/'))
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()


// === USER REGISTRATION ===
app.post('/register', async (req, res) => {
  const { username, password, name, gender, role } = req.body
  const userCheckQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(userCheckQuery)
  if (dbUser === undefined) {
    if (password.length < 6) {
      res.status(400).send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const createUserQuery = `
        INSERT INTO user (username, password, name, gender, role)
        VALUES ('${username}', '${hashedPassword}', '${name}', '${gender}', '${role}')`
      await db.run(createUserQuery)
      res.send('User created successfully')
    }
  } else {
    res.status(400).send('User already exists')
  }
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get(`SELECT * FROM user WHERE username = ?`, [username]);

  if (!user) {
    res.status(400).send('Invalid user');
  } else {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const payload = { username: user.username, role: user.role };
      const jwtToken = jwt.sign(payload, 'SECRET_KEY');

      // Send success with role and token to redirect on frontend
      res.send({ jwtToken, role: user.role });
    } else {
      res.status(400).send('Invalid password');
    }
  }
});

// === AUTHENTICATION MIDDLEWARE ===
const authenticateToken = (req, res, next) => {
  let jwtToken
  const authHeader = req.headers['authorization']
  if (authHeader) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (!jwtToken) {
    res.status(401).send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'SECRET_KEY', (error, payload) => {
      if (error) {
        res.status(401).send('Invalid JWT Token')
      } else {
        req.headers.username = payload.username
        req.headers.role = payload.role
        next()
      }
    })
  }
}

const authorizeRole = (role) => {
  return (req, res, next) => {
    const userRole = req.headers.role
    if (userRole === role) {
      next()
    } else {
      res.status(403).send('Access Denied')
    }
  }
}

// === PRODUCT ROUTES ===
app.get('/products', authenticateToken, async (req, res) => {
  const { search = '', page = 1, limit = 12, sort = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const sortClause = (sort === 'asc' || sort === 'desc') ? `ORDER BY price ${sort.toUpperCase()}` : '';

  const query = `
    SELECT * FROM product
    WHERE name LIKE '%' || ? || '%'
    ${sortClause}
    LIMIT ? OFFSET ?
  `;

  const products = await db.all(query, [search, limit, offset]);
  res.json(products);
});


app.get('/products/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const product = await db.get('SELECT * FROM product WHERE product_id = ?', id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).send('Product not found');
  }
});

app.post('/products/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { name, category, price, description } = req.body
  await db.run(`INSERT INTO product (name, category, price, description) VALUES ('${name}', '${category}', ${price}, '${description}')`)
  res.send('Product added successfully')
})

app.put('/products/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { name, category, price, description } = req.body;
  const { id } = req.params;

  await db.run(`
    UPDATE product
    SET name = ?, category = ?, price = ?, description = ?
    WHERE product_id = ?
  `, [name, category, price, description, id]);

  res.send("Product updated");
});

app.delete('/products/:productId/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { productId } = req.params
  await db.run(`DELETE FROM product WHERE product_id=${productId}`)
  res.send('Product deleted successfully')
})

// === CART ROUTES ===
app.get('/cart', authenticateToken, authorizeRole('customer'), async (req, res) => {
  try {
    const { username } = req.headers;
    const user = await db.get(`SELECT * FROM user WHERE username = ?`, username);

    if (!user) {
      return res.status(404).send('User not found');
    }

    const cartItems = await db.all(`
      SELECT 
        p.product_id,
        p.name,
        p.price,
        c.quantity
      FROM cart c
      JOIN product p ON c.product_id = p.product_id
      WHERE c.user_id = ?
    `, user.user_id);

    res.json(cartItems);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.post('/cart/', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { username } = req.headers
  const { productId, quantity } = req.body
  const user = await db.get(`SELECT * FROM user WHERE username = '${username}'`)
  await db.run(`INSERT INTO cart (user_id, product_id, quantity) VALUES (${user.user_id}, ${productId}, ${quantity})`)
  res.send('Item added to cart')
})

app.put('/cart/:productId/', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { productId } = req.params
  const { quantity } = req.body
  const { username } = req.headers
  const user = await db.get(`SELECT * FROM user WHERE username = '${username}'`)
  await db.run(`UPDATE cart SET quantity = ${quantity} WHERE user_id = ${user.user_id} AND product_id = ${productId}`)
  res.send('Cart updated')
})

app.delete('/cart/:productId/', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { productId } = req.params
  const { username } = req.headers
  const user = await db.get(`SELECT * FROM user WHERE username = '${username}'`)
  await db.run(`DELETE FROM cart WHERE user_id = ${user.user_id} AND product_id = ${productId}`)
  res.send('Item removed from cart')
})

// === ORDER ROUTES ===
app.post('/orders/', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { username } = req.headers
  const user = await db.get(`SELECT * FROM user WHERE username = '${username}'`)
  const cartItems = await db.all(`SELECT * FROM cart WHERE user_id = ${user.user_id}`)
  if (cartItems.length === 0) return res.send('Cart is empty')

  const dateTime = new Date().toISOString()
  const orderInsert = await db.run(`INSERT INTO orders (user_id, date_time) VALUES (${user.user_id}, '${dateTime}')`)
  const orderId = orderInsert.lastID

  for (let item of cartItems) {
    await db.run(`INSERT INTO order_item(order_id, product_id, quantity) VALUES (${orderId}, ${item.product_id}, ${item.quantity})`)
  }

  await db.run(`DELETE FROM cart WHERE user_id = ${user.user_id}`)
  res.send('Order placed successfully')
})
app.get('/orders', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { username } = req.headers;
  const user = await db.get(`SELECT * FROM user WHERE username = ?`, username);

  const orders = await db.all(`SELECT * FROM orders WHERE user_id = ?`, user.user_id);

  for (const order of orders) {
    const items = await db.all(`
      SELECT p.name, p.price, p.description, p.category, oi.quantity
      FROM order_item oi
      JOIN product p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, order.order_id);
    order.items = items;
  }

  res.json(orders);
});

app.patch('/orders/:id/cancel', authenticateToken, authorizeRole('customer'), async (req, res) => {
  const { id } = req.params;
  await db.run(`UPDATE orders SET cancel_order = 1 WHERE order_id = ?`, id);
  res.send("Order cancelled");
});

module.exports = app
