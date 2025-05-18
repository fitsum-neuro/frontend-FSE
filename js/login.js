// js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageArea = document.getElementById('messageArea');


    const BACKEND_URL = 'http://localhost:3000'; 

    // Function to display messages
    function showMessage(message, type = 'error') { 
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        messageArea.style.display = 'block';
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        messageArea.textContent = '';
        messageArea.style.display = 'none';
        messageArea.className = 'message-area';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showMessage('Please enter both email and password.', 'error');
            return;
        }

        const loginData = {
            email,
            password,
        };

        try {
           
            const response = await fetch(`${BACKEND_URL}/api/auth`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const responseData = await response.json();

            if (response.ok && responseData.token) {
                // Login successful
                showMessage('Login successful! Redirecting...', 'success');

              
                localStorage.setItem('authToken', responseData.token);
                localStorage.setItem('authUser', JSON.stringify(responseData.user)); 
              
                setTimeout(() => {
                    
                    if (responseData.user && responseData.user.role === 'owner') {
                        window.location.href = 'owner-dashboard.html'; // Example
                    } else if (responseData.user && responseData.user.role === 'renter') {
                        window.location.href = 'renter-dashboard.html'; // Example
                    } else if (responseData.user && responseData.user.role === 'admin') {
                         window.location.href = 'admin-dashboard.html'; // Example
                    }
                    else {
                        window.location.href = 'index.html';
                    }
                }, 1500); 

            } else {
              
                showMessage(responseData.message || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('An unexpected error occurred. Please try again.', 'error');
        }
    });
});
