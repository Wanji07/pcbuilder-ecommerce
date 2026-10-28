const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    specs: { type: String },
    description: { type: String, default: 'No detailed description provided for this item.' }, // Added for detail view
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);