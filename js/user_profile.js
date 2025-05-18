// js/user_profile.js
document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://localhost:3000'; 


    const userAvatar = document.getElementById('userAvatar');
    const profileName = document.getElementById('profileName'); 
    const fullNameSpan = document.getElementById('fullName');
    const emailSpan = document.getElementById('email');
    const phoneNumberSpan = document.getElementById('phoneNumber');
    const memberSinceSpan = document.getElementById('memberSince');
    const idStatusSpan = document.getElementById('idStatus');
    const avgRatingSpan = document.getElementById('avgRating');
    const userRoleDisplay = document.querySelector('.profile-details .text-muted');
    const globalMessageArea = document.createElement('div'); 
    globalMessageArea.className = 'message-area';
    globalMessageArea.style.display = 'none';
    const mainContent = document.querySelector('.dashboard-content');
    if(mainContent) mainContent.insertBefore(globalMessageArea, mainContent.firstChild);


    const logoutNavButton = document.querySelector('.main-nav .btn-secondary'); 
    const logoutSidebarButton = document.querySelector('.dashboard-sidebar ul li a[href="index.html"]:last-child'); // Assuming last link is logout


    const token = localStorage.getItem('authToken');
    const userString = localStorage.getItem('authUser');
    let currentUser = null;
    if (userString) {
        try { currentUser = JSON.parse(userString); } catch (e) { localStorage.removeItem('authUser'); }
    }

    if (!token || !currentUser) {
        showMessage('Access denied. Please login.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return;
    }

    
    function showMessage(message, type = 'info') {
        globalMessageArea.textContent = message;
        globalMessageArea.className = `message-area ${type}`; 
        globalMessageArea.style.display = 'block';
        setTimeout(() => {
            globalMessageArea.textContent = '';
            globalMessageArea.style.display = 'none';
            globalMessageArea.className = 'message-area';
        }, 5000);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
     
        showMessage('Logged out successfully.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    }
    if(logoutNavButton) logoutNavButton.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    if(logoutSidebarButton) logoutSidebarButton.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });


    async function fetchUserProfile() {
        showMessage('Loading profile...', 'info');
        try {
         
            const response = await fetch(`${BACKEND_URL}/api/users/me`, {
                method: 'GET',
                headers: { 'x-auth-token': token }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to load profile.' }));
                if (response.status === 401) setTimeout(handleLogout, 1000); 
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const user = await response.json();
            displayProfile(user);
            showMessage('Profile loaded.', 'success');

        } catch (error) {
            console.error('Error fetching profile:', error);
            showMessage(error.message, 'error');
        }
    }

    function displayProfile(user) {
        if (userAvatar) userAvatar.src = user.profilePictureUrl || 'images/user_avatar_placeholder.png'; 
        if (profileName) profileName.textContent = `${user.firstName} ${user.lastName}`;
        if (fullNameSpan) fullNameSpan.textContent = `${user.firstName} ${user.lastName}`;
        if (emailSpan) emailSpan.textContent = user.email;
        if (phoneNumberSpan) phoneNumberSpan.textContent = user.phoneNumber || 'Not provided'; 
        if (memberSinceSpan) memberSinceSpan.textContent = formatDate(user.createdAt);
        if (userRoleDisplay && user.role) userRoleDisplay.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);


       
        if (idStatusSpan) {
            const status = user.idVerificationStatus || 'Not Verified';
            idStatusSpan.textContent = status;
            idStatusSpan.style.color = status.toLowerCase() === 'verified' ? '#28a745' : '#dc3545';
            idStatusSpan.style.fontWeight = 'bold';
        }

        
        if (avgRatingSpan) {
            const rating = user.averageRating ? user.averageRating.toFixed(1) : 'N/A';
            const count = user.reviewersCount || 0;
            avgRatingSpan.textContent = `${rating}/5 (from ${count} review${count !== 1 ? 's' : ''})`;
        }
    }

  
    if (token && currentUser) {
        fetchUserProfile();
    }

  
});