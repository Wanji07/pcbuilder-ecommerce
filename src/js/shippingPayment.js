document.addEventListener('DOMContentLoaded', () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));
    if (!userSession) {
        alert('Please log in to checkout.');
        window.location.href = 'login.html';
        return;
    }

    const cartKey = `cart_${userSession.id || userSession._id}`;
    
    // UI elements for toggling payment inputs
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    const cardInputs = document.getElementById('card-inputs');
    const paypalInputs = document.getElementById('paypal-inputs');
    const codInputs = document.getElementById('cod-inputs');

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const method = e.target.value;
            cardInputs.style.display = method === 'Credit/Debit' ? 'block' : 'none';
            paypalInputs.style.display = method === 'PayPal' ? 'block' : 'none';
            codInputs.style.display = method === 'COD' ? 'block' : 'none';
        });
    });

    const checkoutForm = document.getElementById('shipping-form'); 

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            // Get selected payment method and secure mask data
            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            let maskedDetails = 'N/A';

            if (selectedMethod === 'Credit/Debit') {
                const rawCard = document.getElementById('cardNumber').value.trim();
                if (rawCard.length < 12) {
                    alert('Please enter a valid card number.');
                    return;
                }
                // Mask data so only last 4 numbers save safely
                maskedDetails = `•••• •••• •••• ${rawCard.slice(-4)}`;
            } else if (selectedMethod === 'PayPal') {
                const email = document.getElementById('paypalEmail').value.trim();
                if (!email.includes('@')) {
                    alert('Please enter a valid PayPal email.');
                    return;
                }
                const [name, domain] = email.split('@');
                maskedDetails = `${name[0]}***@${domain}`;
            } else if (selectedMethod === 'COD') {
                maskedDetails = 'Pay on Delivery';
            }

            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const orderPayload = {
                userId: userSession.id || userSession._id,
                items: cart,
                totalAmount: totalAmount,
                shippingAddress: {
                    street: document.getElementById('street').value,
                    city: document.getElementById('city').value,
                    postalCode: document.getElementById('postalCode').value,
                    phone: document.getElementById('phone').value
                },
                paymentInfo: {
                    method: selectedMethod,
                    maskedDetails: maskedDetails
                }
            };

            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.removeItem(cartKey);

                    const orderId = data.orderId || data._id;
                    alert(`Order placed successfully! Reference ID: ${orderId}`);
                    
                    window.location.href = 'account.html';
                } else {
                    alert(data.error || data.message || 'Failed to process checkout.');
                }
            } catch (err) {
                console.error('Checkout error:', err);
                alert('Server connection error during checkout.');
            }
        });
    }
});