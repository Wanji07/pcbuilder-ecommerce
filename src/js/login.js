document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save session in browser storage
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                alert('Login successful!');
                window.location.href = 'shop.html';
            } else {
                alert(data.error || 'Login failed.');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Server connection error.');
        }
    });
});