const currentSession = JSON.parse(localStorage.getItem('currentUser'));

if (!currentSession || !currentSession.isAdmin) {
    alert('Access denied. Administrator privileges required.');
    window.location.href = 'home.html'; // Kick non-admins back to home
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminProducts();

    const addProductForm = document.getElementById('add-product-form');

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const priceInput = document.getElementById('product-price');
            const stockInput = document.getElementById('product-stock');
            if (!priceInput.reportValidity() || !stockInput.reportValidity()) return;

            const newProduct = {
                name: document.getElementById('product-name').value,
                category: document.getElementById('product-category').value,
                brand: document.getElementById('product-brand').value,
                price: Number(priceInput.value),
                stock: Number(stockInput.value),
                specs: document.getElementById('product-specs').value,
                description: document.getElementById('product-description') ? document.getElementById('product-description').value : '',
                image: document.getElementById('product-image').value
            };

            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProduct)
                });

                if (response.ok) {
                    alert('Product added successfully!');
                    addProductForm.reset();
                    fetchAdminProducts(); // Refresh inventory table immediately
                } else {
                    const data = await response.json();
                    alert(data.error || 'Failed to add product.');
                }
            } catch (err) {
                console.error('Error adding product:', err);
                alert('Server error while saving product.');
            }
        });
    }
});

// Fetch and display products in the admin inventory table
async function fetchAdminProducts() {
    const tableBody = document.getElementById('admin-product-table');
    if (!tableBody) return;

    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        tableBody.innerHTML = '';

        if (!products || products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No products found in database.</td></tr>`;
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>
                    <img src="${product.image || '../assets/default-pc-part.png'}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px; background: rgba(0,0,0,0.2);">
                </td>
                <td><strong>${product.name}</strong></td>
                <td>${product.category || 'N/A'}</td>
                <td><span style="color: #38bdf8; font-weight: 500;">${product.brand || 'N/A'}</span></td>
                
                <!-- Editable Price Input -->
                <td>
                    <input type="number" id="price-${product._id}" value="${product.price}" step="0.01" min="0" required
                           style="width: 90px; background: #1e293b; color: white; border: 1px solid #334155; padding: 6px; border-radius: 4px;">
                </td>

                <!-- Editable Stock Input -->
                <td>
                    <input type="number" id="stock-${product._id}" value="${product.stock}" min="0" step="1" required
                           style="width: 60px; background: #1e293b; color: white; border: 1px solid #334155; padding: 6px; border-radius: 4px;">
                </td>

                <!-- Editable Description Textarea -->
                <td>
                    <textarea id="desc-${product._id}" rows="2" 
                              style="width: 180px; background: #1e293b; color: white; border: 1px solid #334155; padding: 6px; border-radius: 4px; font-size: 0.8rem; resize: vertical;">${product.description || ''}</textarea>
                </td>

                <!-- Action Buttons: Save & Delete -->
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button onclick="saveProduct('${product._id}')" 
                                style="background: #38bdf8; color: #08121F; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            Save
                        </button>
                        <button onclick="deleteProduct('${product._id}')" 
                                style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            Delete
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching inventory:', err);
    }
}

async function saveProduct(productId) {
    const priceInput = document.getElementById(`price-${productId}`);
    const stockInput = document.getElementById(`stock-${productId}`);
    if (!priceInput.reportValidity() || !stockInput.reportValidity()) return;

    const newPrice = priceInput.value;
    const newStock = stockInput.value;
    const newDescription = document.getElementById(`desc-${productId}`).value;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                price: Number(newPrice),
                stock: Number(newStock),
                description: newDescription
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Product updated successfully in MongoDB!');
            fetchAdminProducts();
        } else {
            alert(data.error || 'Failed to update product.');
        }
    } catch (err) {
        console.error('Error saving product:', err);
        alert('Server connection error while saving.');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchAdminProducts();
        } else {
            alert('Failed to delete product.');
        }
    } catch (err) {
        console.error('Error deleting product:', err);
    }
}