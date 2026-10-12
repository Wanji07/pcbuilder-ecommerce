// registration.html

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        const userData = {
            name: name,
            email: email,
            password: password
        };

        localStorage.setItem('pcbuilder_user', JSON.stringify(userData));

        alert('Account created successfully! Please log in.');
        window.location.href = 'login.html';
    });
}

// =========================
// LOGIN FUNCTIONALITY login.html
// =========================

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const inputEmail = document.getElementById('login-email').value;
        const inputPassword = document.getElementById('login-password').value;

        const savedUserJSON = localStorage.getItem('pcbuilder_user');

        if (!savedUserJSON) {
            alert('No account found. Please register first!');
            return;
        }

        const savedUser = JSON.parse(savedUserJSON);

        // Check if credentials match
        if (inputEmail === savedUser.email && inputPassword === savedUser.password) {
            alert('Login successful! Welcome back, ' + savedUser.name + '!');
            window.location.href = 'home.html';
        } else {
            alert('Invalid email or password. Please try again.');
        }
    });
}