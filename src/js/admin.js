document.addEventListener('DOMContentLoaded', () => {
    fetchAdminProducts();

    const productForm = document.getElementById('add-product-form');
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newProduct = {
            name: document.getElementById('prod-name').value,
            category: document.getElementById('prod-category').value,
            price: Number(document.getElementById('prod-price').value),
            stock: Number(document.getElementById('prod-stock').value),
            specs: document.getElementById('prod-specs').value,
            image: document.getElementById('prod-image').value 
        };

        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });

            if (response.ok) {
                alert('Product added successfully to MongoDB!');
                productForm.reset();
                fetchAdminProducts(); // Refresh the table list
            } else {
                alert('Failed to add product.');
            }
        } catch (err) {
            console.error('Error adding product:', err);
        }
    });
});

// Function to fetch and display products in the admin table
async function fetchAdminProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        const products = await response.json();

        const tableBody = document.getElementById('admin-product-table');
        tableBody.innerHTML = '';

        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No products found in database.</td></tr>`;
            return;
        }

     products.forEach(product => {
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>
            <img src="${product.image || '../assets/default-pc-part.png'}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: contain;">
        </td>
        <td><strong>${product.name}</strong></td>
        <td>${product.category || 'N/A'}</td>
        
        <!-- Editable Price Input with Up/Down Arrows -->
        <td>
            <input type="number" id="price-${product._id}" value="${product.price}" step="0.01" min="0" 
                   style="width: 100px; background: #1e293b; color: white; border: 1px solid #334155; padding: 6px; border-radius: 4px;">
        </td>

        <!-- Editable Stock Input with Up/Down Arrows -->
        <td>
            <input type="number" id="stock-${product._id}" value="${product.stock}" min="0" 
                   style="width: 70px; background: #1e293b; color: white; border: 1px solid #334155; padding: 6px; border-radius: 4px;">
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
    const newPrice = document.getElementById(`price-${productId}`).value;
    const newStock = document.getElementById(`stock-${productId}`).value;

    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                price: Number(newPrice),
                stock: Number(newStock)
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Product updated successfully in MongoDB!');
        } else {
            alert(data.error || 'Failed to update product.');
        }
    } catch (err) {
        console.error('Error saving product:', err);
        alert('Server connection error while saving.');
    }
}

// Function to delete a product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchAdminProducts(); // Refresh table
        } else {
            alert('Failed to delete product.');
        }
    } catch (err) {
        console.error('Error deleting product:', err);
    }
}