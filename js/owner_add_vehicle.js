// js/owner_add_vehicle.js
document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://localhost:3000'; // Adjust
    const addVehicleForm = document.getElementById('addVehicleForm');
    const globalMessageArea = document.getElementById('globalMessageArea');
    const logoutNavButton = document.getElementById('logoutNavButton');
    const logoutSidebarButton = document.getElementById('logoutSidebarButton');

    // --- Auth ---
    const token = localStorage.getItem('authToken');
    const userString = localStorage.getItem('authUser');
    let currentUser = null;
    if (userString) {
        try { currentUser = JSON.parse(userString); } catch (e) { localStorage.removeItem('authUser'); }
    }

    if (!token || !currentUser || currentUser.role !== 'owner') {
        showMessage('Access denied. Please login as an owner.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        return;
    }

    // Set min date for 'availabileAfter' to today
    const today = new Date().toISOString().split('T')[0];
    const availableAfterInput = document.getElementById('availabileAfter');
    if (availableAfterInput) {
        availableAfterInput.setAttribute('min', today);
        availableAfterInput.value = today; // Default to today
    }


    // --- Helpers ---
    function showMessage(message, type = 'info') {
        if (!globalMessageArea) return;
        globalMessageArea.textContent = message;
        globalMessageArea.className = `message-area ${type}`;
        globalMessageArea.style.display = 'block';
        setTimeout(() => {
            if (globalMessageArea) {
                globalMessageArea.textContent = '';
                globalMessageArea.style.display = 'none';
                globalMessageArea.className = 'message-area';
            }
        }, 5000);
    }

    // --- Logout ---
    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        showMessage('Logged out successfully.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    }
    if(logoutNavButton) logoutNavButton.addEventListener('click', handleLogout);
    if(logoutSidebarButton) logoutSidebarButton.addEventListener('click', handleLogout);


    // --- Form Submission ---
    if (addVehicleForm) {
        addVehicleForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showMessage('Adding vehicle...', 'info');

            // Collect 'features' from checkboxes
            const featureCheckboxes = addVehicleForm.querySelectorAll('input[name="features"]:checked');
            const features = Array.from(featureCheckboxes).map(cb => cb.value);

            // Create data object from form fields
            // Ensure names match what backend cars.js POST route expects
            const vehicleData = {
                make: document.getElementById('carMake').value,
                model: document.getElementById('carModel').value,
                year: parseInt(document.getElementById('carYear').value),
                licensePlate: document.getElementById('licensePlate').value,
                description: document.getElementById('description').value,
                carType: document.getElementById('carType').value,
                transmission: document.getElementById('transmission').value,
                fuelType: document.getElementById('fuelType').value,
                seats: parseInt(document.getElementById('seats').value),
                hourlyPrice: parseFloat(document.getElementById('hourlyPrice').value),
                locationCity: document.getElementById('locationCity').value,
                locationNeighborhood: document.getElementById('locationNeighborhood').value,
                availabileAfter: document.getElementById('availabileAfter').value, 
                features: features, 
            };

        
            if (vehicleData.year < 1980 || vehicleData.year > new Date().getFullYear() + 1) {
                showMessage('Please enter a valid year.', 'error');
                return;
            }
            if (vehicleData.hourlyPrice <= 0) {
                 showMessage('Hourly price must be greater than zero.', 'error');
                return;
            }
           


            try {
                const response = await fetch(`${BACKEND_URL}/api/cars`, {
                    method: 'POST',
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(vehicleData)
                });

                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
                }

                showMessage('Vehicle added successfully!', 'success');
                addVehicleForm.reset(); 
                if (availableAfterInput) availableAfterInput.value = today; 
                
                
                setTimeout(() => {
                    window.location.href = 'owner_manage_vehicles.html';
                }, 1500);

            } catch (error) {
                console.error('Error adding vehicle:', error);
                showMessage(error.message || 'Could not add vehicle. Please check your input.', 'error');
            }
        });
    }
});