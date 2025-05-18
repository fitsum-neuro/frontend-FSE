
document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://localhost:3000'; 

    const globalMessageArea = document.getElementById('globalMessageArea');
    const pendingCountSpan = document.getElementById('pendingCount');

    const pendingTableBody = document.getElementById('pendingRequestsTableBody');
    const upcomingTableBody = document.getElementById('upcomingBookingsTableBody');
    const pastTableBody = document.getElementById('pastBookingsTableBody');
    const cancelledTableBody = document.getElementById('cancelledBookingsTableBody');
    const logoutButton = document.getElementById('logoutButton');
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

    if (!token || !currentUser || currentUser.role !== 'owner') {
        showMessage('Access denied. Please login as an owner.', 'error', globalMessageArea);
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
            area.textContent = '';
            area.style.display = 'none';
            area.className = 'message-area';
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


    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        showMessage('Logged out successfully.', 'success', globalMessageArea);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
    if(logoutButton) logoutButton.addEventListener('click', handleLogout);
    if(logoutSidebarButton) logoutSidebarButton.addEventListener('click', handleLogout);


    function renderBookings(bookings) {
        
        pendingTableBody.innerHTML = '';
        upcomingTableBody.innerHTML = '';
        pastTableBody.innerHTML = '';
        cancelledTableBody.innerHTML = '';

        let pendingRequestsCount = 0;

        if (!bookings || bookings.length === 0) {
            pendingTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No pending booking requests.</td></tr>';
            upcomingTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No upcoming bookings.</td></tr>';
            pastTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No past bookings.</td></tr>';
            cancelledTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No cancelled or rejected bookings.</td></tr>';
            pendingCountSpan.textContent = '(0)';
            return;
        }

        bookings.forEach(booking => {
            const carName = booking.carId ? `${booking.carId.make} ${booking.carId.model} (${booking.carId.year})` : 'N/A';
            const renterName = booking.renterId ? `${booking.renterId.firstName} ${booking.renterId.lastName}` : 'N/A';
            const bookingDates = `${formatSimpleDate(booking.startTime)} - ${formatSimpleDate(booking.endTime)}`;
            const totalCost = booking.totalCost ? `ETB ${booking.totalCost.toFixed(2)}` : 'N/A'; // Assuming ETB currency

            if (booking.status === 'pendingApproval') {
                pendingRequestsCount++;
                const row = `
                    <tr>
                        <td>${carName}</td>
                        <td>${renterName} ${booking.renterId ? `(<a href="renter_profile.html?id=${booking.renterId._id}" target="_blank">View Profile</a>)` : ''}</td>
                        <td>${bookingDates}</td>
                        <td>${totalCost}</td>
                        <td>${formatDate(booking.createdAt)}</td>
                        <td class="table-actions">
                            <button class="btn btn-sm btn-success" data-booking-id="${booking._id}" data-action="approve">Approve</button>
                            <button class="btn btn-sm btn-danger" data-booking-id="${booking._id}" data-action="reject">Reject</button>
                            ${booking.renterId ? `<a href="message_renter.html?id=${booking.renterId._id}" class="btn btn-sm btn-outline-primary">Message</a>` : ''}
                        </td>
                    </tr>`;
                pendingTableBody.innerHTML += row;
            } else if (booking.status === 'approved') {
                const row = `
                    <tr>
                        <td>${carName}</td>
                        <td>${renterName}</td>
                        <td>${bookingDates}</td>
                        <td><span style="color: green; text-transform: capitalize;">${booking.status}</span></td>
                        <td class="table-actions">
                             <a href="booking_details_owner.html?id=${booking._id}" class="btn btn-sm btn-outline-primary">View Details</a>
                            ${booking.renterId ? `<a href="message_renter.html?id=${booking.renterId._id}" class="btn btn-sm btn-outline-primary">Message Renter</a>` : ''}
                        </td>
                    </tr>`;
                upcomingTableBody.innerHTML += row;
            } else if (booking.status === 'completed') {
                const row = `
                    <tr>
                        <td>${carName}</td>
                        <td>${renterName}</td>
                        <td>${bookingDates}</td>
                        <td>${totalCost}</td>
                        <td><span style="color: blue; text-transform: capitalize;">${booking.status}</span></td>
                        <td class="table-actions">
                            <a href="booking_details_owner.html?id=${booking._id}" class="btn btn-sm btn-outline-primary">View Details</a>
                            <a href="leave_review_for_renter.html?booking_id=${booking._id}&renter_id=${booking.renterId ? booking.renterId._id : ''}" class="btn btn-sm btn-success">Review Renter</a>
                        </td>
                    </tr>`;
                pastTableBody.innerHTML += row;
            } else if (booking.status === 'rejected' || booking.status === 'cancelledByRenter' || booking.status === 'cancelledByOwner') { // Adapt based on your actual statuses
                const row = `
                    <tr>
                        <td>${carName}</td>
                        <td>${renterName}</td>
                        <td>${bookingDates}</td>
                        <td><span style="color: red; text-transform: capitalize;">${booking.status.replace(/([A-Z])/g, ' $1').trim()}</span></td>
                        <td>${booking.cancellationReason || 'N/A'}</td>
                    </tr>`;
                cancelledTableBody.innerHTML += row;
            }
        });

        pendingCountSpan.textContent = `(${pendingRequestsCount})`;
        if(pendingRequestsCount === 0) pendingTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No pending booking requests.</td></tr>';
        if(upcomingTableBody.innerHTML === '') upcomingTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No upcoming bookings.</td></tr>';
        if(pastTableBody.innerHTML === '') pastTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No past bookings.</td></tr>';
        if(cancelledTableBody.innerHTML === '') cancelledTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No cancelled or rejected bookings.</td></tr>';

        addTableActionListeners(); 
    }

    
    async function fetchOwnerBookings() {
        showMessage('Loading bookings...', 'info', globalMessageArea);
        try {
            const response = await fetch(`${BACKEND_URL}/api/bookings/owner/all`, {
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
                    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch bookings. Please try again.' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                return;
            }

            const bookings = await response.json();
            renderBookings(bookings);
            showMessage('Bookings loaded.', 'success', globalMessageArea);

        } catch (error) {
            console.error('Error fetching owner bookings:', error);
            showMessage(error.message || 'Could not fetch bookings.', 'error', globalMessageArea);
        
            pendingTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading bookings.</td></tr>';
            upcomingTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading bookings.</td></tr>';
            pastTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading bookings.</td></tr>';
            cancelledTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading bookings.</td></tr>';
        }
    }

    async function handleBookingAction(bookingId, action) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        showMessage(`Processing request to ${action} booking...`, 'info', globalMessageArea);

        try {
            const response = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Failed to ${action} booking.` }));
                 throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const updatedBooking = await response.json();
            showMessage(`Booking successfully ${newStatus}!`, 'success', globalMessageArea);
            fetchOwnerBookings(); 

        } catch (error) {
            console.error(`Error ${action}ing booking:`, error);
            showMessage(error.message || `Could not ${action} booking.`, 'error', globalMessageArea);
        }
    }

    function addTableActionListeners() {
        
        [pendingTableBody, upcomingTableBody, pastTableBody].forEach(tbody => {
            if (tbody) { 
                tbody.addEventListener('click', (event) => {
                    const target = event.target;
                    if (target.tagName === 'BUTTON' && target.dataset.bookingId && target.dataset.action) {
                        const bookingId = target.dataset.bookingId;
                        const action = target.dataset.action;
                        if (action === 'approve' || action === 'reject') {
                             if (confirm(`Are you sure you want to ${action} this booking?`)) {
                                handleBookingAction(bookingId, action);
                            }
                        }
                       
                    }
                });
            }
        });
    }


    
    if (document.getElementById('pendingRequests')) {
        document.getElementById('pendingRequests').style.display = "block";
        const firstTabButton = document.querySelector('.tabs-navigation .btn-tab');
        if (firstTabButton) firstTabButton.classList.add('active');
    }
    fetchOwnerBookings();
   
    addTableActionListeners();
});