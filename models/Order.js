const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        street: String,
        city: String,
        postalCode: String,
        phone: String
    },
    paymentInfo: {
        method: { 
            type: String, 
            enum: ['Credit/Debit', 'PayPal', 'COD'], 
            required: true 
        },
        // Encrypted / Masked details (e.g. "**** **** **** 1234" or "user***@email.com")
        maskedDetails: { type: String, default: 'N/A' }
    },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);