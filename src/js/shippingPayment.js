document.addEventListener('DOMContentLoaded', () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));
    if (!userSession) {
        alert('Please log in to checkout.');
        window.location.href = 'login.html';
        return;
    }

    const cartKey = `cart_${userSession.id || userSession._id}`;
    
    // MATCH THE EXACT ID FROM YOUR HTML FILE: 'shipping-form'
    const checkoutForm = document.getElementById('shipping-form'); 

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            const orderPayload = {
                userId: userSession.id || userSession._id,
                items: cart,
                shippingAddress: {
                    street: document.getElementById('street').value,
                    city: document.getElementById('city').value,
                    postalCode: document.getElementById('postalCode').value,
                    phone: document.getElementById('phone').value
                }
            };

            try {
                const response = await fetch('http://localhost:3000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                });

                const data = await response.json();

                if (response.ok) {
                    // Clear user-specific cart after successful order
                    localStorage.removeItem(cartKey);

                    const orderId = data.orderId || data._id;
                    alert(`Order placed successfully! Reference ID: ${orderId}`);
                    
                    // Redirect straight to account page to see order history
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