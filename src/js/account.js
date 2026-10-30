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
        const response = await fetch(`/api/orders/${userId}`);
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

            // Inside your accounts.js rendering logic
            ordersContainer.innerHTML = orders.map(order => `
            <div class="order-card" style="background: #121f2f; border: 1px solid #2a3b52; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
            <span><strong>Order ID:</strong> ${order._id}</span>
            <span style="color: #38bdf8; font-weight: bold;">${order.status || 'Pending'}</span>
            </div>
            <p><strong>Total:</strong> ₱${order.totalAmount.toLocaleString()}</p>
        
            <!-- Payment Information Section -->
            <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 8px;">
            <strong>Payment Method:</strong> ${order.paymentInfo?.method || 'N/A'} 
            <span style="color: #cbd5e1;">(${order.paymentInfo?.maskedDetails || ''})</span>
            </p>

            <p style="color: #94a3b8; font-size: 0.85rem;">
            <strong>Delivering to:</strong> ${order.shippingAddress?.street}, ${order.shippingAddress?.city}
            </p>
        </div>
        `).join('');

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