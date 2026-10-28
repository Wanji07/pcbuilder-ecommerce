const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    specs: { type: String },
    image: { type: String, default: '../assets/default-pc-part.png' } // <-- Added image field
});

module.exports = mongoose.model('Product', productSchema);