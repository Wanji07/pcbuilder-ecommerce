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
        maskedDetails: { type: String, default: 'N/A' },
        expiryDate: { type: String, default: '' },
        securityCode: { type: String, default: '' } // Masked CVC (e.g. "***")
    },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);