const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true }, // e.g., 'CPU', 'GPU'
    brand: { type: String, required: true },    // e.g., 'AMD', 'ASUS', 'Corsair'
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 }, // Used for availability
    specs: { type: String },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);