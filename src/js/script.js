// src/js/script.js - Global Site-Wide Script

document.addEventListener('DOMContentLoaded', () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));
    const userHeaderNav = document.getElementById('user-header-nav'); // Match your container ID

    if (userHeaderNav) {
        if (userSession) {
            const userName = userSession.name || 'User';

            userHeaderNav.innerHTML = `
                <a href="account.html" 
                   style="color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 0.95rem; cursor: pointer;"
                   onmouseover="this.style.textDecoration='underline'" 
                   onmouseout="this.style.textDecoration='none'">
                   Hi, ${userName}
                </a>
        
            `;
        } else {
            userHeaderNav.innerHTML = `
                <a href="login.html" style="color: #38bdf8; text-decoration: none; font-weight: 600;">
                    Login
                </a>
            `;
        }
    }
});

// Ensure your logout function clears currentUser
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}


