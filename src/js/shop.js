let allProducts = []; // Store products globally for filtering

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndDisplayProducts();
    setupFilters();
});

const userSession = JSON.parse(localStorage.getItem('currentUser'));
const cartKey = userSession ? `cart_${userSession.id || userSession._id}` : 'cart_guest';

function addToCart(productId) {
    if (!userSession) {
        alert('Please log in first.');
        window.location.href = 'login.html';
        return;
    }

    const productToAdd = allProducts.find(p => p._id === productId);
    if (!productToAdd) return;

    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    const existingItem = cart.find(item => item._id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: productToAdd._id,
            name: productToAdd.name,
            price: productToAdd.price,
            image: productToAdd.image,
            quantity: 1
        });
    }

    // Save back to this user's specific storage key
    localStorage.setItem(cartKey, JSON.stringify(cart));
    alert(`${productToAdd.name} added to cart!`);
}

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
    if (!grid) return;
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
                <strong>₱${product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                <div class="product-actions">
                    <button type="button" onclick="openProductModal('${product._id}')" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; font: inherit; text-decoration: underline;">View details →</button>
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
    if (brandFilter) brandFilter.addEventListener('change', applyFilters);
    if (availabilityFilter) availabilityFilter.addEventListener('change', applyFilters);

    function applyFilters() {
        const selectedBrand = brandFilter ? brandFilter.value.toLowerCase() : 'all';
        const selectedAvailability = availabilityFilter ? availabilityFilter.value.toLowerCase() : 'all';

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

// 4. Modal Popup Controls for "View details"
function openProductModal(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    // Create modal dynamically if it doesn't exist in HTML yet
    let modal = document.getElementById('product-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'product-modal';
        modal.style.cssText = `display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center;`;
        modal.innerHTML = `
            <div style="background: #0D1B2C; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; width: 600px; max-width: 90%; padding: 30px; position: relative; color: #fff;">
                <button onclick="closeProductModal()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;">&times;</button>
                
                <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
                    <img id="modal-img" src="" alt="Product Image" style="width: 120px; height: 120px; object-fit: contain; background: #fff; border-radius: 8px; padding: 10px;">
                    <div>
                        <span id="modal-brand-tag" style="background: #38bdf8; color: #08121F; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px;"></span>
                        <h2 id="modal-title" style="margin: 8px 0 4px 0; font-size: 1.3rem;"></h2>
                        <strong id="modal-price" style="color: #38bdf8; font-size: 1.2rem;"></strong>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="color: #94a3b8; margin: 0 0 6px 0; font-size: 0.85rem; text-transform: uppercase;">Specifications</h4>
                    <p id="modal-specs" style="color: #cbd5e1; font-size: 0.9rem; margin: 0;"></p>
                </div>

                <div style="margin-bottom: 25px;">
                    <h4 style="color: #94a3b8; margin: 0 0 6px 0; font-size: 0.85rem; text-transform: uppercase;">Detailed Overview</h4>
                    <p id="modal-desc" style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin: 0;"></p>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; align-items: center;">
                    <span id="modal-stock" style="font-size: 0.85rem; color: #4ade80;"></span>
                    <button id="modal-add-btn" style="background: #38bdf8; color: #08121F; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Populate modal content
    document.getElementById('modal-img').src = product.image || '../assets/default-pc-part.png';
    document.getElementById('modal-brand-tag').textContent = product.brand || product.category;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-price').textContent = `₱${product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('modal-specs').textContent = product.specs || 'No specific attributes listed.';
    document.getElementById('modal-desc').textContent = product.description || 'No extended description available for this product.';
    
    const stockEl = document.getElementById('modal-stock');
    const addBtn = document.getElementById('modal-add-btn');

    if (product.stock > 0) {
        stockEl.textContent = `In Stock (${product.stock} available)`;
        stockEl.style.color = '#4ade80';
        addBtn.disabled = false;
        addBtn.style.opacity = '1';
        addBtn.onclick = () => {
            addToCart(product._id);
            closeProductModal();
        };
    } else {
        stockEl.textContent = 'Out of Stock';
        stockEl.style.color = '#ef4444';
        addBtn.disabled = true;
        addBtn.style.opacity = '0.5';
    }

    modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
}