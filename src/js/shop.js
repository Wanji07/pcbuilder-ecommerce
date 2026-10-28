let allProducts = []; // Store products globally for filtering

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndDisplayProducts();
    setupFilters();
});

// 1. Fetch products from Node.js / MongoDB backend
async function fetchAndDisplayProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        allProducts = await response.json();
        renderProducts(allProducts);
    } catch (err) {
        console.error('Failed to load products from database:', err);
        document.getElementById('product-grid').innerHTML = '<p style="color: red;">Failed to load products from server.</p>';
    }
}

// 2. Render products dynamically into the grid
function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #94a3b8;">No products found.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const isAvailable = product.stock > 0;
        const stockStatus = isAvailable ? 'available' : 'out';
        
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('data-category', product.category.toLowerCase());
        card.setAttribute('data-brand', product.brand ? product.brand.toLowerCase() : '');
        card.setAttribute('data-availability', stockStatus);

        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image || '../assets/default-pc-part.png'}" alt="${product.name}">
                <span class="product-tag">${product.category}</span>
            </div>
            <div class="product-info">
                <small>${product.brand || 'B.Y.T.E.'}</small>
                <h3>${product.name}</h3>
                <p>${product.specs || 'Standard specifications'}</p>
                <strong>₱${product.price.toLocaleString()}</strong>
                <div class="product-actions">
                    <a href="#">View details →</a>
                    <button onclick="addToCart('${product._id}')" ${!isAvailable ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        ${isAvailable ? 'Add to cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Handle Category Buttons and Filters
function setupFilters() {
    const categoryButtons = document.querySelectorAll('.category-button');
    const brandFilter = document.getElementById('brand-filter');
    const availabilityFilter = document.getElementById('availability-filter');

    let currentCategory = 'all';

    // Category button click event
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-category');
            applyFilters();
        });
    });

    // Dropdown change events
    brandFilter.addEventListener('change', applyFilters);
    availabilityFilter.addEventListener('change', applyFilters);

    function applyFilters() {
        const selectedBrand = brandFilter.value.toLowerCase();
        const selectedAvailability = availabilityFilter.value.toLowerCase();

        const filtered = allProducts.filter(product => {
            const matchesCategory = currentCategory === 'all' || product.category.toLowerCase() === currentCategory;
            const productBrand = product.brand ? product.brand.toLowerCase() : '';
            const matchesBrand = selectedBrand === 'all' || productBrand === selectedBrand;
            
            const isAvailable = product.stock > 0;
            const matchesAvailability = selectedAvailability === 'all' || 
                (selectedAvailability === 'available' && isAvailable) || 
                (selectedAvailability === 'out' && !isAvailable);

            return matchesCategory && matchesBrand && matchesAvailability;
        });

        renderProducts(filtered);
    }
}

// Updated addToCart function in src/js/shop.js
function addToCart(productId) {
    const userSession = localStorage.getItem('currentUser');
    
    if (!userSession) {
        alert('Access Denied: Please log in first to add items to your cart.');
        window.location.href = 'login.html';
        return;
    }

    // Find the clicked product from our global 'allProducts' array
    const productToAdd = allProducts.find(p => p._id === productId);
    if (!productToAdd) return;

    // Get current cart from localStorage (or empty array)
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if product is already in cart, if so, increase quantity or alert
    const existingItem = cart.find(item => item._id === productId);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({ ...productToAdd, quantity: 1 });
    }

    // Save back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${productToAdd.name} added to your cart!`);
}