const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // <-- Added this so password hashing works!
const path = require('path');

const app = express();
const PORT = 3000;

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors()); // Allows your frontend HTML/JS to talk to this backend server
app.use(express.json()); // Teaches Express how to read incoming JSON data from requests
app.use(express.static('src')); // Tells the server where to find your static front-end files (CSS, images, JS)

// Import Mongoose Models
const Product = require('./models/Product');
const User = require('./models/User');

// ==========================
// DATABASE CONNECTION
// ==========================
mongoose.connect('mongodb://127.0.0.1:27017/pcbuilder_db')
  .then(() => console.log('Connected to Local MongoDB successfully!'))
  .catch((err) => console.error('Database connection failed:', err));

// ==========================
// PRODUCT ROUTES
// ==========================

// Get all products from MongoDB to display on the shop/categories page
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
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

// Add a new product into MongoDB (useful for seeding data via Thunder Client)
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ message: 'Product added successfully!', newProduct });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// ==========================
// USER AUTH ROUTES
// ==========================

// Register Route: Takes user details, hashes the password, and saves to MongoDB
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Hash password securely (10 rounds) before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed. Email might already exist.' });
    }
});

// Login Route: Authenticates user credentials against MongoDB
// Login Route: Authenticates user credentials against MongoDB using bcrypt
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Compare entered plain-text password with the encrypted hash in MongoDB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Return user info including isAdmin and shippingAddress
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
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});



// PUT Route to update a product
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
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Server error while updating product.' });
    }
});

// Update User Shipping Address Route
app.put('/api/user/shipping', async (req, res) => {
    try {
        const { userId, shippingAddress } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { shippingAddress },
            { new: true } // Returns the updated document
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

// Checkout & Create Order Route
// Checkout & Create Order Route with Stock Validation & Deduction
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, items, shippingAddress } = req.body;

        if (!userId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Invalid order data or empty cart.' });
        }

        // 1. Verify stock availability for EVERY item in the cart first
        for (let cartItem of items) {
            // Ensure your cart items save the product's database ID as `_id` or `productId`
            const productId = cartItem._id || cartItem.productId;
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({ error: `Product not found: ${cartItem.name}` });
            }

            if (product.stock < cartItem.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for "${product.name}". Only ${product.stock} left in stock!` 
                });
            }
        }

        // 2. If all items have enough stock, deduct the stock and calculate pricing
        let subtotal = 0;
        for (let cartItem of items) {
            const productId = cartItem._id || cartItem.productId;
            const product = await Product.findById(productId);

            // Subtract ordered quantity from database stock
            product.stock -= cartItem.quantity;
            await product.save();

            subtotal += cartItem.price * cartItem.quantity;
        }

        let vat = subtotal * 0.12;
        let total = subtotal; // Assuming VAT inclusive pricing

        // 3. Save the permanent order receipt to MongoDB
        const newOrder = new Order({
            userId,
            items,
            subtotal,
            vat,
            total,
            shippingAddress
        });

        await newOrder.save();

        res.status(201).json({
            message: 'Order placed successfully!',
            orderId: newOrder._id
        });
    } catch (err) {
        console.error('Error processing order:', err);
        res.status(500).json({ error: 'Server error while processing order.' });
    }
});

// Order Schema for MongoDB
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
    total: Number,
    shippingAddress: {
        street: String,
        city: String,
        postalCode: String,
        phone: String
    },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Get Orders for a Specific User
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }); // Newest orders first
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to retrieve order history.' });
    }
});

// ==========================
// FRONTEND NAVIGATION ROUTES
// ==========================

// Test route to verify server is responding
app.get('/api/test', (req, res) => {
    res.json({ message: "Hello from your backend server!" });
});

// Root route: Automatically serves your home page when visiting http://localhost:3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'home.html'));
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});