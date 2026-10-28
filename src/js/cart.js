// Helper to get the correct user-specific cart key
function getCartKey() {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));
    if (!userSession) return null;
    return `cart_${userSession.id || userSession._id}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!userSession) {
        alert('Please log in to view your cart.');
        window.location.href = 'login.html';
        return;
    }

    loadCart();
});

function loadCart() {
    const cartKey = getCartKey();
    if (!cartKey) return;

    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountElement = document.getElementById('cart-count');
    const subtotalElement = document.getElementById('cart-subtotal');
    const vatElement = document.getElementById('cart-vat');
    const totalElement = document.getElementById('cart-total');

    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    // Filter out invalid string IDs
    cart = cart.filter(item => typeof item === 'object' && item !== null && item.name && item.price);

    if (cartCountElement) {
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItemsCount > 0 ? `(${totalItemsCount})` : '';
    }

    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="color: #94a3b8; text-align: center; padding: 30px;">Your shopping cart is empty.</p>`;
        if (subtotalElement) subtotalElement.textContent = '₱0.00';
        if (vatElement) vatElement.textContent = '₱0.00';
        if (totalElement) totalElement.textContent = '₱0.00';
        return;
    }

    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        subtotal += itemTotal;

        const itemCard = document.createElement('div');
        itemCard.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            margin-bottom: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
        `;

        itemCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 16px; flex: 2;">
                <img src="${item.image || '../assets/default-pc-part.png'}" alt="${item.name}" 
                     style="width: 55px; height: 55px; object-fit: contain; border-radius: 6px; background: rgba(0,0,0,0.2); padding: 4px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 0.95rem;">${item.name}</h4>
                    <span style="font-size: 0.85rem; color: #94a3b8;">₱${Number(item.price).toLocaleString(undefined, {minimumFractionDigits: 2})} each</span>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center;">
                <button onclick="changeQuantity(${index}, -1)" style="background: #1e293b; color: white; border: 1px solid #334155; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                <span style="min-width: 20px; text-align: center; color: #fff; font-weight: 600;">${item.quantity}</span>
                <button onclick="changeQuantity(${index}, 1)" style="background: #1e293b; color: white; border: 1px solid #334155; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
            </div>

            <div style="display: flex; align-items: center; gap: 16px; flex: 1; justify-content: flex-end;">
                <strong style="color: #fff; font-size: 1rem;">₱${itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                <button onclick="removeItem(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; text-decoration: underline;">Remove</button>
            </div>
        `;

        cartItemsContainer.appendChild(itemCard);
    });

    const vat = subtotal * 0.12;

    if (subtotalElement) subtotalElement.textContent = `₱${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (vatElement) vatElement.textContent = `₱${vat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (totalElement) totalElement.textContent = `₱${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function changeQuantity(index, amount) {
    const cartKey = getCartKey();
    if (!cartKey) return;

    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    if (cart[index]) {
        cart[index].quantity += amount;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        localStorage.setItem(cartKey, JSON.stringify(cart));
        loadCart();
    }
}

function removeItem(index) {
    const cartKey = getCartKey();
    if (!cartKey) return;

    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    cart.splice(index, 1);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    loadCart();
}