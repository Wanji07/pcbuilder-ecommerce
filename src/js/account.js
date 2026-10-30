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

        // Render all orders cleanly using map once
        ordersContainer.innerHTML = orders.map(order => {
            const dateFormatted = new Date(order.createdAt).toLocaleDateString();
            
            // Map items inside the order
            const itemsHtml = order.items.map(item => `
                <li style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px; color: #cbd5e1;">
                    <span>${item.name} (x${item.quantity})</span>
                    <strong>₱${(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                </li>
            `).join('');

            // Format payment display info
            const payMethod = order.paymentInfo?.method || 'N/A';
            const maskDetails = order.paymentInfo?.maskedDetails || '';
            const expiry = order.paymentInfo?.expiryDate ? ` (Exp: ${order.paymentInfo.expiryDate})` : '';

            return `
                <div class="order-card" style="background: #121f2f; border: 1px solid #2a3b52; border-radius: 8px; padding: 20px; margin-bottom: 15px; color: #fff;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 12px;">
                        <span style="font-size: 0.85rem; color: #94a3b8;"><strong>Order ID:</strong> ${order._id}</span>
                        <span style="color: #38bdf8; font-weight: bold; font-size: 0.9rem;">${order.status || 'Order Placed'}</span>
                    </div>

                    <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px;"><strong>Date:</strong> ${dateFormatted}</p>

                    <div style="margin-bottom: 12px;">
                        <strong style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase;">Items Ordered:</strong>
                        <ul style="list-style: none; padding: 0; margin: 6px 0 0 0;">
                            ${itemsHtml}
                        </ul>
                    </div>

                    <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px; margin-top: 10px;">
                        <p style="color: #94a3b8; font-size: 0.85rem; margin: 4px 0;">
                            <strong>Payment:</strong> ${payMethod} <span style="color: #cbd5e1;">(${maskDetails})${expiry}</span>
                        </p>
                        <p style="color: #94a3b8; font-size: 0.85rem; margin: 4px 0;">
                            <strong>Delivery Address:</strong> ${order.shippingAddress?.street}, ${order.shippingAddress?.city} (${order.shippingAddress?.postalCode})
                        </p>
                        <p style="font-size: 1rem; color: #38bdf8; margin-top: 8px; font-weight: bold;">
                            Total: ₱${order.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </p>
                    </div>
                </div>
            `;
        }).join('');

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