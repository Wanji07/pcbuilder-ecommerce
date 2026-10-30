const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// Use Render's dynamic port if deployed, otherwise fallback to 3000 locally
const PORT = process.env.PORT || 3000;

// ==========================
// MIDDLEWARE CONFIGURATION
// ==========================
app.use(cors()); // Enables cross-origin requests for frontend-backend communication
app.use(express.json()); // Parses incoming JSON payloads from client requests
app.use(express.static('src')); // Serves static front-end assets (HTML, CSS, JS)

// ==========================
// DATABASE MODELS
// ==========================
const Product = require('./models/Product');
const User = require('./models/User');

// ==========================
// DATABASE CONNECTION
// ==========================
// Uses MongoDB Atlas URL when online (Render), or falls back to local MongoDB for development
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pcbuilder_db';

/* 
  --- OLD LOCAL CONNECTION CODE (Reference) ---
  mongoose.connect('mongodb://127.0.0.1:27017/pcbuilder_db')
*/

mongoose.connect(MONGO_URI)
  .then(() => console.log('Database connected successfully!'))
  .catch((err) => console.error('Database connection failed:', err));

// ==========================
// PRODUCT MANAGEMENT ROUTES
// ==========================

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Add a new product
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ message: 'Product added successfully!', newProduct });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Update a product by ID
app.put('/api/products/:id', async (req, res) => {
    try {
        const { price, stock, description } = req.body; 
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { price, stock, description },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.json({ message: 'Product updated successfully!', product: updatedProduct });
    } catch (err) {
        res.status(500).json({ error: 'Server error while updating product.' });
    }
});

// Delete a product by ID
app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ==========================
// USER AUTHENTICATION ROUTES
// ==========================

// Register a new user with encrypted password hashing
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed. Email might already exist.' });
    }
});

// Authenticate user login credentials
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        res.json({
            message: 'Login successful!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                shippingAddress: user.shippingAddress
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// Update user shipping address
app.put('/api/user/shipping', async (req, res) => {
    try {
        const { userId, shippingAddress } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { shippingAddress },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({
            message: 'Shipping address saved successfully!',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                shippingAddress: updatedUser.shippingAddress
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save shipping information.' });
    }
});

// ==========================
// ORDER & CHECKOUT ROUTES
// ==========================

//Order Schema & Model with Payment Information
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: String,
            name: String,
            price: Number,
            quantity: Number,
            image: String
        }
    ],
    subtotal: Number,
    vat: Number,
    totalAmount: Number, // Mapped to total order value
    shippingAddress: {
        street: String,
        city: String,
        postalCode: String,
        phone: String
    },
    paymentInfo: {
        method: { type: String, required: true },
        maskedDetails: { type: String, default: 'N/A' },
        expiryDate: { type: String, default: '' },
        securityCode: { type: String, default: '' }
    },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Process checkout, validate stock, deduct inventory, and save payment data
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, items, shippingAddress, paymentInfo } = req.body;

        if (!userId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Invalid order data or empty cart.' });
        }

        // Validate stock for all items first
        for (let cartItem of items) {
            const productId = cartItem._id || cartItem.productId;
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({ error: `Product not found: ${cartItem.name}` });
            }

            if (product.stock < cartItem.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for "${product.name}". Only ${product.stock} left!` 
                });
            }
        }

        // Deduct stock and calculate totals
        let subtotal = 0;
        for (let cartItem of items) {
            const productId = cartItem._id || cartItem.productId;
            const product = await Product.findById(productId);

            product.stock -= cartItem.quantity;
            await product.save();

            subtotal += cartItem.price * cartItem.quantity;
        }

        let vat = subtotal * 0.12;
        let totalAmount = subtotal; // Can add vat if required by your pricing logic

        // Save order receipt with payment information included
        const newOrder = new Order({ 
            userId, 
            items, 
            subtotal, 
            vat, 
            totalAmount, 
            shippingAddress, 
            paymentInfo 
        });
        await newOrder.save();

        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder._id });
    } catch (err) {
        console.error('Checkout processing error:', err);
        res.status(500).json({ error: 'Server error while processing order.' });
    }
});

// Retrieve order history for a specific user
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve order history.' });
    }
});

// ==========================
// SYSTEM & NAVIGATION ROUTES
// ==========================

// Health check endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: "Hello from your backend server!" });
});

// Serve frontend home page on root request
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'home.html'));
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});