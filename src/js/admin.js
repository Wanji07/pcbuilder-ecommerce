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
        <td><img src="${product.image}" alt="${product.name}" width="50" style="border-radius: 4px;"></td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>₱${product.price.toLocaleString()}</td>
        <td>${product.stock}</td>
        <td><button class="delete-btn" onclick="deleteProduct('${product._id}')">Delete</button></td>
    `;
    tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching inventory:', err);
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