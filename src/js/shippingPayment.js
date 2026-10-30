document.addEventListener('DOMContentLoaded', () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));
    if (!userSession) {
        alert('Please log in to checkout.');
        window.location.href = 'login.html';
        return;
    }

    const cartKey = `cart_${userSession.id || userSession._id}`;

    // Get input elements
    const postalInput = document.getElementById('postalCode');
    const phoneInput = document.getElementById('phone');
    const cardInput = document.getElementById('cardNumber');
    const expiryInput = document.getElementById('cardExpiry');
    const cvcInput = document.getElementById('cardCvc');

    // Restrict Postal Code to numbers only
    if (postalInput) {
        postalInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Restrict Phone Number to numbers only
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Format Card Number (numbers only, adds space every 4 digits)
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            let digits = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = digits.match(/.{1,4}/g)?.join(' ') || digits;
        });
    }

    // Format Expiration Date (numbers only, auto-adds slash MM/YY)
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (value.length >= 3) {
                e.target.value = `${value.substring(0, 2)}/${value.substring(2)}`;
            } else {
                e.target.value = value;
            }
        });
    }

    // Restrict CVC to numbers only
    if (cvcInput) {
        cvcInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Radio Toggle Logic
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

            const phoneVal = phoneInput.value.trim();
            if (phoneVal.length !== 11 || !phoneVal.startsWith('09')) {
                alert('Please enter a valid 11-digit Philippine mobile number starting with 09.');
                return;
            }

            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            let maskedDetails = 'N/A';
            let expiryDate = '';
            let securityCode = '';

            if (selectedMethod === 'Credit/Debit') {
                const rawCard = cardInput.value.replace(/\s+/g, '');
                const rawExpiry = expiryInput.value.trim();
                const rawCvc = cvcInput.value.trim();

                if (rawCard.length !== 16) {
                    alert('Please enter a valid 16-digit card number.');
                    return;
                }
                if (rawExpiry.length !== 5) {
                    alert('Please enter a valid expiration date (MM/YY).');
                    return;
                }
                if (rawCvc.length < 3) {
                    alert('Please enter a valid 3 or 4-digit security code (CVC).');
                    return;
                }

                maskedDetails = `•••• •••• •••• ${rawCard.slice(-4)}`;
                expiryDate = rawExpiry;
                securityCode = '***';
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
                    postalCode: postalInput.value,
                    phone: phoneInput.value
                },
                paymentInfo: {
                    method: selectedMethod,
                    maskedDetails: maskedDetails,
                    expiryDate: expiryDate,
                    securityCode: securityCode
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