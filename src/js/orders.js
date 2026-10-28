document.addEventListener('DOMContentLoaded', async () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));
    const ordersContainer = document.getElementById('orders-list');

    if (!userSession) {
        alert('Please log in to view your order history.');
        window.location.href = 'login.html';
        return;
    }

    const userId = userSession.id || userSession._id;

    try {
        // Fetch only orders belonging to this specific user ID from MongoDB
        const response = await fetch(`http://localhost:3000/api/orders/${userId}`);
        const orders = await response.json();

        ordersContainer.innerHTML = '';

        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = `<p style="color: #94a3b8;">No past orders found for this account.</p>`;
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            const dateFormatted = new Date(order.createdAt).toLocaleDateString();

            let itemsHtml = order.items.map(item => `
                <li>
                    <span>${item.name} (x${item.quantity})</span>
                    <strong>₱${(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                </li>
            `).join('');

            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <span style="font-size: 0.8rem; color: #38bdf8; display: block;">Reference No: ${order._id}</span>
                        <strong style="color: #fff; font-size: 1.1rem;">Order Date: ${dateFormatted}</strong>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: #94a3b8; font-size: 0.85rem; display: block;">Total Paid</span>
                        <strong style="color: #38bdf8; font-size: 1.1rem;">₱${order.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                    </div>
                </div>
                <ul class="order-items-list">${itemsHtml}</ul>
                <div class="shipping-info">
                    <p style="margin: 0 0 4px 0;"><strong>Shipping Location:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city} (${order.shippingAddress.postalCode})</p>
                    <p style="margin: 0;"><strong>Contact Phone:</strong> ${order.shippingAddress.phone}</p>
                </div>
            `;

            ordersContainer.appendChild(orderCard);
        });

    } catch (err) {
        console.error('Error fetching user orders:', err);
        ordersContainer.innerHTML = `<p style="color: #ef4444;">Failed to load order history.</p>`;
    }
});