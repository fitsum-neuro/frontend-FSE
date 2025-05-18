// js/owner_manage_vehicles.js
document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://localhost:3000'; 
    const globalMessageArea = document.getElementById('globalMessageArea');
    const vehiclesTableBody = document.getElementById('vehiclesTableBody');
    const logoutNavButton = document.getElementById('logoutNavButton');
    const logoutSidebarButton = document.getElementById('logoutSidebarButton');

  
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

    function getStatusClass(status) {
     
        if (!status) return '';
        const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');
        if (normalizedStatus.includes('available')) return 'status-available';
        if (normalizedStatus.includes('unavailable') || normalizedStatus.includes('undermaintenance') || normalizedStatus.includes('pendingapproval')) return 'status-unavailable'; // Grouping orange statuses
        if (normalizedStatus.includes('rented')) return 'status-rented';
        if (normalizedStatus.includes('suspended')) return 'status-suspendedByAdmin'; 
        return ''; 
    }

    function formatStatus(status) {
        if (!status) return 'N/A';
        return status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }


    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        showMessage('Logged out successfully.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    }
    if(logoutNavButton) logoutNavButton.addEventListener('click', handleLogout);
    if(logoutSidebarButton) logoutSidebarButton.addEventListener('click', handleLogout);


    function renderVehicles(vehicles) {
        vehiclesTableBody.innerHTML = ''; 
        if (!vehicles || vehicles.length === 0) {
            vehiclesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">You have not listed any vehicles yet. <a href="owner_add_vehicle.html">Add your first vehicle!</a></td></tr>';
            return;
        }

        vehicles.forEach(car => {
            const photoSrc = (car.photos && car.photos.length > 0) ? car.photos[0] : 'images/car_placeholder_thumb.png'; // Use first photo or a placeholder
            const carName = `${car.make} ${car.model} (${car.year})`;
            const statusDisplay = `<span class="${getStatusClass(car.status)}">${formatStatus(car.status)}</span>`;

           
            let toggleStatusAction, toggleStatusText, toggleStatusClass;
            if (car.status === 'available') {
                toggleStatusAction = 'unavailable'; 
                toggleStatusText = 'Set Unavailable';
                toggleStatusClass = 'btn-secondary';
            } else if (car.status === 'unavailable' || car.status === 'underMaintenance') {
                toggleStatusAction = 'available';
                toggleStatusText = 'Set Available';
                toggleStatusClass = 'btn-success';
            } else { 
                toggleStatusAction = null;
            }


            const row = `
                <tr>
                    <td><img src="${photoSrc}" alt="${carName}" style="width: 80px; height: 60px; object-fit: cover; border-radius: .2rem;"></td>
                    <td><a href="vehicle_details.html?id=${car._id}" target="_blank">${carName}</a></td>
                    <td>${car.licensePlate || 'N/A'}</td>
                    <td>ETB ${car.hourlyPrice ? car.hourlyPrice.toFixed(2) : 'N/A'}</td>
                    <td>${statusDisplay}</td>
                    <td class="table-actions">
                        <a href="owner_edit_vehicle.html?id=${car._id}" class="btn btn-sm btn-primary">Edit</a>
                        ${toggleStatusAction ? `<button class="btn btn-sm ${toggleStatusClass} btn-toggle-status" data-car-id="${car._id}" data-new-status="${toggleStatusAction}">${toggleStatusText}</button>` : ''}
                        <button class="btn btn-sm btn-danger btn-delete-car" data-car-id="${car._id}">Delete</button>
                    </td>
                </tr>
            `;
            vehiclesTableBody.innerHTML += row;
        });
        addTableActionListeners();
    }

   
    async function fetchMyVehicles() {
        showMessage('Loading your vehicles...', 'info');
        try {
            const response = await fetch(`${BACKEND_URL}/api/cars/owner/my-vehicles`, {
                method: 'GET',
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                     showMessage( (await response.text()) || 'Access denied. Please log in again.', 'error');
                     setTimeout(handleLogout, 2000);
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch vehicles.' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                return;
            }
            const vehicles = await response.json();
            renderVehicles(vehicles);
            if (vehicles.length > 0) showMessage('Vehicles loaded.', 'success');

        } catch (error) {
            console.error('Error fetching vehicles:', error);
            showMessage(error.message || 'Could not fetch vehicles.', 'error');
            vehiclesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading vehicles.</td></tr>';
        }
    }

  
    async function handleToggleCarStatus(carId, newStatus) {
        showMessage(`Setting car status to ${newStatus}...`, 'info');
        try {
            const response = await fetch(`${BACKEND_URL}/api/cars/${carId}`, {
                method: 'PUT',
                headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }) 
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Failed to update car status.` }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            showMessage(`Car status updated to ${newStatus}.`, 'success');
            fetchMyVehicles();

        } catch (error) {
            console.error('Error toggling car status:', error);
            showMessage(error.message || 'Could not update car status.', 'error');
        }
    }

    async function handleDeleteCar(carId) {
        if (!confirm('Are you sure you want to delete this vehicle listing? This action cannot be undone and may affect active bookings.')) {
            return;
        }
        showMessage('Deleting vehicle...', 'info');
        try {
            const response = await fetch(`${BACKEND_URL}/api/cars/${carId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete vehicle.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            showMessage('Vehicle deleted successfully.', 'success');
            fetchMyVehicles(); 

        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showMessage(error.message || 'Could not delete vehicle.', 'error');
        }
    }


   
    function addTableActionListeners() {
        vehiclesTableBody.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('btn-toggle-status')) {
                const carId = target.dataset.carId;
                const newStatus = target.dataset.newStatus;
                handleToggleCarStatus(carId, newStatus);
            } else if (target.classList.contains('btn-delete-car')) {
                const carId = target.dataset.carId;
                handleDeleteCar(carId);
            }
        });
    }

  
    if (token && currentUser && currentUser.role === 'owner') {
        fetchMyVehicles();
    }
});