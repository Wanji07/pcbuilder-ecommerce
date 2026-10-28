document.addEventListener('DOMContentLoaded', async () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));

    // Redirect to login if user is not signed in
    if (!userSession) {
        alert('Please log in to view your account dashboard.');
        window.location.href = 'login.html';
        return;
    }

    const userName = userSession.name || 'User';
    const userEmail = userSession.email || 'N/A';
    const userId = userSession.id || userSession._id;

    // Populate Sidebar & Profile Info
    document.getElementById('sidebar-user-name').textContent = `Hi, ${userName}!`;
    document.getElementById('sidebar-user-email').textContent = userEmail;
    document.getElementById('profile-name').textContent = userName;
    document.getElementById('profile-email').textContent = userEmail;

    // Render "Hi, Name" link in top header
    const userHeaderNav = document.getElementById('user-header-nav');
    if (userHeaderNav) {
        userHeaderNav.innerHTML = `
            <a href="account.html" style="color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 0.95rem;">
                Hi, ${userName}
            </a>
        `;
    }

    // Load Order History from backend
    await fetchOrderHistory(userId);
});

// Tab Switching Handler
function switchTab(tabName) {
    const buttons = document.querySelectorAll('.sidebar-btn');
    const panels = document.querySelectorAll('.tab-panel');

    buttons.forEach(btn => btn.classList.remove('active'));
    panels.forEach(panel => panel.classList.remove('active'));

    if (tabName === 'profile') {
        buttons[0].classList.add('active');
        document.getElementById('tab-profile').classList.add('active');
    } else if (tabName === 'orders') {
        buttons[1].classList.add('active');
        document.getElementById('tab-orders').classList.add('active');
    }
}

// Fetch Order History from Backend
async function fetchOrderHistory(userId) {
    const ordersContainer = document.getElementById('orders-list');
    if (!ordersContainer) return;

    try {
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
                <div style="font-size: 0.85rem; color: #94a3b8;">
                    <strong>Shipping To:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city} (${order.shippingAddress.postalCode})
                </div>
            `;

            ordersContainer.appendChild(orderCard);
        });

    } catch (err) {
        console.error('Error fetching orders:', err);
        ordersContainer.innerHTML = `<p style="color: #ef4444;">Failed to load order receipts.</p>`;
    }
}

// Logout Handler
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}