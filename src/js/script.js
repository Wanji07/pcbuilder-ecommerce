// src/js/script.js - Global Site-Wide Script
document.addEventListener('DOMContentLoaded', () => {
    const userSession = localStorage.getItem('currentUser');
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const userBtn = headerActions.querySelector('.user-btn');
    if (!userBtn) return;

    if (userSession) {
        const user = JSON.parse(userSession);
        
        const userContainer = document.createElement('div');
        userContainer.style.display = 'flex';
        userContainer.style.alignItems = 'center';
        userContainer.style.gap = '10px';
        userContainer.innerHTML = `
            <span style="font-size: 0.85rem; color: #38bdf8; font-weight: 500;">Hi, ${user.name}</span>
            <button id="global-logout-btn" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Logout</button>
        `;
        
        userBtn.replaceWith(userContainer);

        document.getElementById('global-logout-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            alert('Logged out successfully.');
            window.location.href = 'home.html';
        });
    }
});