const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'mock_secret_key';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Error logging
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

const DB_PATH = path.join(__dirname, 'db.json');

const readDb = () => {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};

const writeDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- Middleware ---
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// --- Routes ---

// Login
app.post('/api/v1/users/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.email === email && u.password === password);

    if (user) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.json({
            status: 'success',
            token,
            data: { user }
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// Signup
app.post('/api/v1/users/signup', (req, res) => {
    const { name, email, password } = req.body;
    const db = readDb();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = { id: Date.now(), name, email, password, role: 'user' };
    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, SECRET_KEY);
    res.json({
        status: 'success',
        token,
        data: { user: newUser }
    });
});

// Products
app.get('/api/v1/products', (req, res) => {
    const db = readDb();
    let products = db.products;
    const { category, section } = req.query;

    if (category) {
        products = products.filter(p => p.category === category);
    }
    if (section) {
        products = products.filter(p => p.section === section);
    }

    res.json({
        status: 'success',
        data: { data: products }
    });
});

app.get('/api/v1/products/best-sellers', (req, res) => {
    const db = readDb();
    const orders = db.orders || [];
    const reviews = db.reviews || [];

    // Calculate sales per product
    const sales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const pid = item.productId;
            sales[pid] = (sales[pid] || 0) + item.quantity;
        });
    });

    // Calculate reviews and ratings per product
    const productReviews = {};
    reviews.forEach(review => {
        if (!productReviews[review.productId]) {
            productReviews[review.productId] = { count: 0, totalRating: 0 };
        }
        productReviews[review.productId].count += 1;
        productReviews[review.productId].totalRating += review.rating;
    });

    // Calculate popularity score
    // Formula: (sales * 2) + (reviewCount * 5) + (averageRating * 3)
    const bestSellers = db.products
        .map(p => {
            const sCount = sales[p.id] || 0;
            const rData = productReviews[p.id] || { count: 0, totalRating: 0 };
            const rCount = rData.count;
            const avgRating = rCount > 0 ? (rData.totalRating / rCount) : 0;

            return {
                ...p,
                salesCount: sCount,
                reviewCount: rCount,
                averageRating: Number(avgRating.toFixed(1)),
                popularityScore: (sCount * 2) + (rCount * 5) + (avgRating * 3)
            };
        })
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, 8);

    res.json({
        status: 'success',
        data: { data: bestSellers }
    });
});

app.get('/api/v1/products/:id', (req, res) => {
    const db = readDb();
    const product = db.products.find(p => p.id == req.params.id);
    if (product) {
        res.json({
            status: 'success',
            data: { data: product }
        });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Reviews
app.get('/api/v1/reviews', (req, res) => {
    const db = readDb();
    let reviews = db.reviews;

    // By default, only return approved reviews
    // Pass ?includePending=true to get all reviews (for admin)
    if (req.query.includePending !== 'true') {
        reviews = reviews.filter(r => r.isApproved === true);
    }

    res.json({
        status: 'success',
        data: { data: reviews }
    });
});

app.get('/api/v1/products/:id/reviews', (req, res) => {
    const db = readDb();
    const reviews = db.reviews.filter(r => r.productId == req.params.id && r.isApproved === true);
    res.json({
        status: 'success',
        data: { data: reviews }
    });
});

app.post('/api/v1/reviews', authenticate, (req, res) => {
    const { productId, rating, text, images, videos } = req.body;
    const db = readDb();
    const newReview = {
        id: Date.now(),
        productId,
        rating,
        text,
        images: images || [],
        videos: videos || [],
        user: req.user.email,
        isApproved: false
    };
    db.reviews.push(newReview);
    writeDb(db);
    res.json({
        status: 'success',
        data: { data: newReview }
    });
});

// Categories
app.get('/api/v1/categories', (req, res) => {
    const db = readDb();
    res.json({
        status: 'success',
        data: { data: db.categories || [] }
    });
});

app.post('/api/v1/categories', (req, res) => {
    const { name } = req.body;
    const db = readDb();
    if (!db.categories) db.categories = [];
    if (!db.categories.includes(name)) {
        db.categories.push(name);
        writeDb(db);
    }
    res.json({
        status: 'success',
        data: { data: name }
    });
});

app.patch('/api/v1/categories/:oldName', (req, res) => {
    const { oldName } = req.params;
    const { newName } = req.body;
    const db = readDb();

    if (!db.categories.includes(oldName)) {
        return res.status(404).json({ message: 'Category not found' });
    }

    // Update categories list
    db.categories = db.categories.map(c => c === oldName ? newName : c);

    // Update all products with this category
    db.products = db.products.map(p => {
        if (p.category === oldName) {
            return { ...p, category: newName };
        }
        return p;
    });

    writeDb(db);
    res.json({ status: 'success', data: { data: newName } });
});

app.delete('/api/v1/categories/:name', (req, res) => {
    const { name } = req.params;
    const db = readDb();

    if (!db.categories.includes(name)) {
        return res.status(404).json({ message: 'Category not found' });
    }

    // Remove from categories list
    db.categories = db.categories.filter(c => c !== name);

    // Update all products with this category - set to empty string or 'Uncategorized'
    db.products = db.products.map(p => {
        if (p.category === name) {
            return { ...p, category: '' };
        }
        return p;
    });

    writeDb(db);
    res.json({ status: 'success', message: 'Category deleted' });
});

// Admin: Delete review
// Update review status (Approved/Unapproved)
app.patch('/api/v1/reviews/:id/status', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const { isApproved } = req.body;
    const db = readDb();
    const review = db.reviews.find(r => r.id == req.params.id);

    if (review) {
        review.isApproved = isApproved;
        writeDb(db);
        res.json({ status: 'success', data: { review } });
    } else {
        res.status(404).json({ message: 'Review not found' });
    }
});

app.delete('/api/v1/reviews/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = readDb();
    const initialLength = db.reviews.length;
    db.reviews = db.reviews.filter(r => r.id != req.params.id);

    if (db.reviews.length < initialLength) {
        writeDb(db);
        res.json({ status: 'success', message: 'Review deleted' });
    } else {
        res.status(404).json({ message: 'Review not found' });
    }
});

// Cart
app.get('/api/v1/cart', authenticate, (req, res) => {
    const db = readDb();
    let userCart = db.cart.find(c => c.userId == req.user.id);
    if (!userCart) {
        userCart = { userId: req.user.id, items: [] };
    }
    res.json({
        status: 'success',
        data: { cart: userCart }
    });
});

app.post('/api/v1/cart', authenticate, (req, res) => {
    const { productId, quantity } = req.body;
    const db = readDb();
    let userCart = db.cart.find(c => c.userId == req.user.id);
    if (!userCart) {
        userCart = { userId: req.user.id, items: [] };
        db.cart.push(userCart);
    }

    const product = db.products.find(p => p.id == productId);
    const existingItem = userCart.items.find(i => i.productId == productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        userCart.items.push({
            id: Date.now(),
            productId,
            quantity,
            product
        });
    }

    writeDb(db);
    res.json({
        status: 'success',
        data: { cart: userCart }
    });
});

// Admin: Add product to user's cart
app.post('/api/v1/admin/users/:userId/cart/items', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { productId, quantity } = req.body;
    const db = readDb();

    // Validate user exists
    const user = db.users.find(u => u.id == req.params.userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Validate product exists
    const product = db.products.find(p => p.id == productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // Find or create user cart
    let userCart = db.cart.find(c => c.userId == req.params.userId);
    if (!userCart) {
        userCart = { userId: req.params.userId, items: [] };
        db.cart.push(userCart);
    }

    // Check if product already in cart
    const existingItem = userCart.items.find(i => i.productId == productId);
    if (existingItem) {
        existingItem.quantity += quantity || 1;
    } else {
        userCart.items.push({
            id: Date.now(),
            productId,
            quantity: quantity || 1,
            product: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image
            }
        });
    }

    writeDb(db);
    res.json({
        status: 'success',
        data: { cart: userCart }
    });
});

// Admin: Remove item from user's cart
app.delete('/api/v1/admin/users/:userId/cart/items/:itemId', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const db = readDb();
    const userCart = db.cart.find(c => c.userId == req.params.userId);

    if (!userCart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    const initialLength = userCart.items.length;
    userCart.items = userCart.items.filter(item => item.id != req.params.itemId);

    if (userCart.items.length < initialLength) {
        writeDb(db);
        res.json({ status: 'success', data: { cart: userCart } });
    } else {
        res.status(404).json({ message: 'Item not found in cart' });
    }
});

// Admin: Create order for user
app.post('/api/v1/admin/users/:userId/orders', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const db = readDb();
    const userCart = db.cart.find(c => c.userId == req.params.userId);

    if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    const newOrder = {
        id: Date.now(),
        userId: parseInt(req.params.userId),
        items: userCart.items,
        total: userCart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: 'admin', // Flag for audit trail
        ...req.body
    };

    if (!db.orders) db.orders = [];
    db.orders.push(newOrder);

    // Clear cart after order creation
    userCart.items = [];

    writeDb(db);

    res.json({
        status: 'success',
        data: { order: newOrder }
    });
});

// Orders
app.post('/api/v1/orders/checkout', authenticate, (req, res) => {
    const db = readDb();
    const userCart = db.cart.find(c => c.userId == req.user.id);

    if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    const newOrder = {
        id: Date.now(),
        userId: req.user.id,
        items: userCart.items,
        total: userCart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...req.body
    };

    if (!db.orders) db.orders = [];
    db.orders.push(newOrder);

    // Clear cart after checkout
    userCart.items = [];

    writeDb(db);

    res.json({
        status: 'success',
        data: { order: newOrder }
    });
});

app.get('/api/v1/orders/my-orders', authenticate, (req, res) => {
    const db = readDb();
    const userOrders = (db.orders || []).filter(o => o.userId == req.user.id);
    res.json({
        status: 'success',
        data: { orders: userOrders }
    });
});

app.get('/api/v1/orders/:id', authenticate, (req, res) => {
    const db = readDb();
    const order = (db.orders || []).find(o => o.id == req.params.id && o.userId == req.user.id);
    if (order) {
        res.json({
            status: 'success',
            data: { order }
        });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// --- Admin ---

// Admin Stats
app.get('/api/v1/admin/stats', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = readDb();
    const stats = {
        totalRevenue: (db.orders || []).reduce((sum, o) => sum + (o.total || 0), 0),
        totalOrders: (db.orders || []).length,
        totalProducts: db.products.length,
        totalUsers: db.users.length
    };
    res.json({
        status: 'success',
        data: stats
    });
});

// Admin: Get all orders
app.get('/api/v1/admin/orders', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = readDb();
    res.json({
        status: 'success',
        data: { orders: db.orders || [] }
    });
});

// Admin: Update order status
app.patch('/api/v1/admin/orders/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const { status } = req.body;
    const db = readDb();
    const order = (db.orders || []).find(o => o.id == req.params.id);

    if (order) {
        order.status = status;
        writeDb(db);
        res.json({ status: 'success', data: { order } });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// Admin: Get all users
app.get('/api/v1/admin/users', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = readDb();
    res.json({
        status: 'success',
        data: { users: db.users }
    });
});

// Admin: Toggle user role
app.patch('/api/v1/admin/users/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const { role } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.id == req.params.id);

    if (user) {
        user.role = role || (user.role === 'admin' ? 'user' : 'admin');
        writeDb(db);
        res.json({ status: 'success', data: { user } });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Admin: Get specific user deep-dive details
app.get('/api/v1/admin/users/:id/details', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = readDb();
    const user = db.users.find(u => u.id == req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Aggregate user data
    const userOrders = (db.orders || []).filter(o => o.userId == user.id);
    const userCart = (db.cart || []).find(c => c.userId == user.id) || { items: [] };
    const userReviews = (db.reviews || []).filter(r => r.user === user.email);

    res.json({
        status: 'success',
        data: {
            user,
            orders: userOrders,
            cart: userCart,
            reviews: userReviews,
            metrics: {
                totalOrders: userOrders.length,
                totalSpent: userOrders.reduce((sum, o) => sum + (o.total || 0), 0),
                activeCartItems: userCart.items.length,
                totalReviews: userReviews.length
            }
        }
    });
});

// Admin: Delete user
app.delete('/api/v1/admin/users/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // Prevent self-deletion
    if (req.user.id == req.params.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const db = readDb();
    const initialLength = db.users.length;
    db.users = db.users.filter(u => u.id != req.params.id);

    if (db.users.length < initialLength) {
        writeDb(db);
        res.json({ status: 'success', message: 'User deleted successfully' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Admin: Update user profile
app.patch('/api/v1/admin/users/:id/profile', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { name } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.id == req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Only update name (email requires user verification in production)
    if (name) {
        user.name = name;
    }

    writeDb(db);
    res.json({ status: 'success', data: { user } });
});

// Admin: Delete product
app.delete('/api/v1/products/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = readDb();
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id != req.params.id);

    if (db.products.length < initialLength) {
        writeDb(db);
        res.json({ status: 'success', message: 'Product deleted' });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Admin: Update product
app.patch('/api/v1/products/:id', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = readDb();
    const index = db.products.findIndex(p => p.id == req.params.id);

    if (index !== -1) {
        db.products[index] = { ...db.products[index], ...req.body };
        writeDb(db);
        res.json({ status: 'success', data: { data: db.products[index] } });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.post('/api/v1/products', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const { name, price, description, category } = req.body;
    const db = readDb();
    const newProduct = { id: Date.now(), name, price, description, category, image: '/images/placeholder.jpg' };
    db.products.push(newProduct);
    writeDb(db);
    res.json({
        status: 'success',
        data: { data: newProduct }
    });
});

app.listen(PORT, () => {
    console.log(`Mock Server running on http://127.0.0.1:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});
// Get all carts for admin
app.get('/api/v1/admin/carts', authenticate, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { cart, users } = readDb();

    // Filter out empty carts and join with user data
    const abandonedCarts = cart
        .filter(c => c.items && c.items.length > 0)
        .map(c => {
            const user = users.find(u => u.id === c.userId);
            return {
                ...c,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    email: user.email
                } : null
            };
        });

    res.json(abandonedCarts);
});
