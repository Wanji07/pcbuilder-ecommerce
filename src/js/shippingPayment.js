document.addEventListener('DOMContentLoaded', () => {
    const shippingForm = document.getElementById('shipping-form');
    if (!shippingForm) return;

    shippingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Check user session
        const userSession = JSON.parse(localStorage.getItem('currentUser'));
        if (!userSession) {
            alert('Please log in to complete your order.');
            window.location.href = 'login.html';
            return;
        }

        // 2. Check if cart has items
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert('Your cart is empty!');
            window.location.href = 'shop.html';
            return;
        }

        // 3. Gather shipping address inputs
        const shippingAddress = {
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            postalCode: document.getElementById('postalCode').value,
            phone: document.getElementById('phone').value
        };

        try {
            // Step A: Save shipping address to user profile
            await fetch('http://localhost:3000/api/user/shipping', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userSession.id, shippingAddress })
            });

            // Step B: Submit the order to create an Order record in MongoDB
            const orderResponse = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userSession.id,
                    items: cart,
                    shippingAddress
                })
            });

            const orderData = await orderResponse.json();

            if (orderResponse.ok) {
                // Clear the local cart storage after successful order
                localStorage.removeItem('cart');
                
                alert(`Order placed successfully! Order ID: ${orderData.orderId}`);
                window.location.href = 'orderHistory.html'; // Or an order history / success receipt page
            } else {
                alert(orderData.error || 'Failed to place order.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Server connection error during checkout.');
        }
    });
});