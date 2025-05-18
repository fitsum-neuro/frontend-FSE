
document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://localhost:3000'; 

    const globalMessageArea = document.getElementById('globalMessageArea');
    const upcomingTableBody = document.getElementById('upcomingTableBody');
    const pastTableBody = document.getElementById('pastTableBody');
    const cancelledTableBody = document.getElementById('cancelledTableBody');
    const logoutNavButton = document.getElementById('logoutNavButton');
    const logoutSidebarButton = document.getElementById('logoutSidebarButton');

    const token = localStorage.getItem('authToken');
    const userString = localStorage.getItem('authUser');
    let currentUser = null;

    if (userString) {
        try {
            currentUser = JSON.parse(userString);
        } catch (e) {
            console.error("Error parsing user data from localStorage:", e);
            localStorage.removeItem('authUser');
        }
    }

    if (!token || !currentUser || currentUser.role !== 'renter') {
        showMessage('Access denied. Please login as a renter.', 'error', globalMessageArea);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }


    function showMessage(message, type = 'info', area = globalMessageArea) {
        if (!area) return;
        area.textContent = message;
        area.className = `message-area ${type}`;
        area.style.display = 'block';
        setTimeout(() => {
            if (area) {
                area.textContent = '';
                area.style.display = 'none';
                area.className = 'message-area';
            }
        }, 5000);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function formatSimpleDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function getStatusClass(status) {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'approved': return 'status-approved';
            case 'completed': return 'status-completed';
            case 'rejected':
            case 'cancelledByRenter':
            case 'cancelledByOwner':
                return 'status-rejected';
            default: return '';
        }
    }
    function formatStatus(status) {
        if (!status) return 'N/A';
        return status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }


    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        showMessage('Logged out successfully.', 'success', globalMessageArea);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
    if(logoutNavButton) logoutNavButton.addEventListener('click', handleLogout);
    if(logoutSidebarButton) logoutSidebarButton.addEventListener('click', handleLogout);

    function renderReservations(reservations) {
        upcomingTableBody.innerHTML = '';
        pastTableBody.innerHTML = '';
        cancelledTableBody.innerHTML = '';

        let upcomingCount = 0, pastCount = 0, cancelledCount = 0;

        if (!reservations || reservations.length === 0) {
            upcomingTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No upcoming reservations. <a href="browse_vehicles.html">Find a car to rent!</a></td></tr>';
            pastTableBody.innerHTML = '<tr><td colspan="5" class="text-center">You have no past rentals.</td></tr>';
            cancelledTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No cancelled reservations.</td></tr>';
            return;
        }

        reservations.forEach(booking => {
            const carInfo = booking.carId ? `${booking.carId.make} ${booking.carId.model} (${booking.carId.year})` : 'Car details unavailable';
            const carLink = booking.carId ? `<a href="vehicle_details.html?id=${booking.carId._id}">${carInfo}</a>` : carInfo;
            const pickupDateTime = formatDate(booking.startTime);
            const returnDateTime = formatDate(booking.endTime);
            const rentalPeriod = `${formatSimpleDate(booking.startTime)} - ${formatSimpleDate(booking.endTime)}`;
            const totalCost = booking.totalCost ? `ETB ${booking.totalCost.toFixed(2)}` : 'N/A';
            const statusDisplay = `<span class="${getStatusClass(booking.status)}">${formatStatus(booking.status)}</span>`;

            if (booking.status === 'pending' || booking.status === 'approved') {
                upcomingCount++;
                const row = `
                    <tr>
                        <td>${carLink}</td>
                        <td>${pickupDateTime}</td>
                        <td>${returnDateTime}</td>
                        <td>${totalCost}</td>
                        <td>${statusDisplay}</td>
                        <td class="table-actions">
                            <a href="reservation_details.html?id=${booking._id}" class="btn btn-sm btn-outline-primary">View</a>
                            ${ (booking.status === 'pending' || booking.status === 'approved') ?
                                `<button class="btn btn-sm btn-danger btn-cancel-booking" data-booking-id="${booking._id}">Cancel</button>` : ''
                            }
                        </td>
                    </tr>`;
                upcomingTableBody.innerHTML += row;
            } else if (booking.status === 'completed') {
                pastCount++;
                const row = `
                    <tr>
                        <td>${carLink}</td>
                        <td>${rentalPeriod}</td>
                        <td>${totalCost}</td>
                        <td>${statusDisplay}</td>
                        <td class="table-actions">
                            <a href="reservation_details.html?id=${booking._id}" class="btn btn-sm btn-outline-primary">View Details</a>
                            <a href="leave_review.html?booking_id=${booking._id}&car_id=${booking.carId ? booking.carId._id : ''}&owner_id=${booking.ownerId ? booking.ownerId._id : ''}" class="btn btn-sm btn-success">Leave Review</a>
                        </td>
                    </tr>`;
                pastTableBody.innerHTML += row;
            } else if (['rejected', 'cancelledByRenter', 'cancelledByOwner'].includes(booking.status)) {
                cancelledCount++;
                const row = `
                    <tr>
                        <td>${carLink}</td>
                        <td>${rentalPeriod}</td>
                        <td>${statusDisplay}</td>
                        <td>${formatSimpleDate(booking.cancellationTime || booking.updatedAt)}</td>
                        <td>${booking.cancellationReason || 'N/A'}</td>
                    </tr>`;
                cancelledTableBody.innerHTML += row;
            }
        });

        if (upcomingCount === 0) upcomingTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No upcoming reservations. <a href="browse_vehicles.html">Find a car to rent!</a></td></tr>';
        if (pastCount === 0) pastTableBody.innerHTML = '<tr><td colspan="5" class="text-center">You have no past rentals.</td></tr>';
        if (cancelledCount === 0) cancelledTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No cancelled reservations.</td></tr>';

        addCancelButtonListeners();
    }


    async function fetchMyReservations() {
        showMessage('Loading your reservations...', 'info', globalMessageArea);
        try {
            const response = await fetch(`${BACKEND_URL}/api/bookings/renter/my-reservations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                     showMessage('Session expired or unauthorized. Please log in again.', 'error', globalMessageArea);
                     setTimeout(handleLogout, 2000);
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reservations.' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                return;
            }

            const reservations = await response.json();
            renderReservations(reservations);
            showMessage('Reservations loaded.', 'success', globalMessageArea);

        } catch (error) {
            console.error('Error fetching reservations:', error);
            showMessage(error.message || 'Could not fetch reservations.', 'error', globalMessageArea);
            upcomingTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading reservations.</td></tr>';
            pastTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading reservations.</td></tr>';
            cancelledTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading reservations.</td></tr>';
        }
    }

    async function handleCancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this reservation? Please check the cancellation policy if applicable.')) {
            return;
        }
        showMessage('Cancelling reservation...', 'info', globalMessageArea);

        try {
            const response = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'cancelledByRenter'  })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to cancel reservation.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

          
            showMessage('Reservation cancelled successfully!', 'success', globalMessageArea);
            fetchMyReservations(); // Refresh the list

        } catch (error) {
            console.error('Error cancelling reservation:', error);
            showMessage(error.message || 'Could not cancel reservation.', 'error', globalMessageArea);
        }
    }


    function addCancelButtonListeners() {
        document.querySelectorAll('.btn-cancel-booking').forEach(button => {
          
            button.replaceWith(button.cloneNode(true));
        });
     
        document.querySelectorAll('.btn-cancel-booking').forEach(button => {
            button.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                handleCancelBooking(bookingId);
            });
        });
    }


    if (document.getElementById('upcoming')) { 
        document.getElementById('upcoming').style.display = "block";
        const firstTabButton = document.querySelector('.tabs-navigation .btn-tab');
        if (firstTabButton) firstTabButton.classList.add('active');
    }
    fetchMyReservations();
  
});