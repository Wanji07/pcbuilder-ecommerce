// src/js/script.js - Global Site-Wide Script

document.addEventListener('DOMContentLoaded', () => {
    const userSession = JSON.parse(localStorage.getItem('currentUser'));

    // 1. Handle User Header Nav (Hi, Name / Login)
    const userHeaderNav = document.getElementById('user-header-nav');
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

    // 2. Handle Admin Dashboard Link Injection & Active State
    const navContainer = document.querySelector('.main-nav');
    if (userSession && userSession.isAdmin === true && navContainer) {
        if (!document.getElementById('admin-nav-link')) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.id = 'admin-nav-link';
            adminLink.textContent = 'Admin Dashboard';
            adminLink.style.color = '#38bdf8';
            // Automatically add the 'active' class if the user is currently on admin.html
            const isCurrentPage = window.location.pathname.includes('admin.html');
            adminLink.className = isCurrentPage ? 'active' : ''; 

            navContainer.appendChild(adminLink);
        }
    }
});

// Ensure your logout function clears currentUser
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}