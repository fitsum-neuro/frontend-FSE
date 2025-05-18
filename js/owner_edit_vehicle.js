
document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://localhost:3000';
    const editingCarNameSpan = document.getElementById('editingCarName');
    
    const carMakeInput = document.getElementById('carMake');
    const carModelInput = document.getElementById('carModel');
    const carYearInput = document.getElementById('carYear');
   
    const currentPhotosDiv = document.getElementById('currentPhotosDiv');
    const carPhotosInput = document.getElementById('carPhotos'); 
    const editVehicleForm = document.getElementById('editVehicleForm'); 
    const globalMessageArea = document.getElementById('globalMessageArea'); 

    const token = localStorage.getItem('authToken');


    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('id');

    if (!vehicleId) {
        showMessage('No vehicle ID provided for editing.', 'error');
       
        return;
    }

    async function fetchVehicleDetails() {
        showMessage('Loading vehicle details...', 'info');
        try {
            const response = await fetch(`${BACKEND_URL}/api/cars/${vehicleId}`, {
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('Failed to fetch vehicle details.');
            const car = await response.json();
            populateForm(car);
            showMessage('Vehicle details loaded.', 'success');
        } catch (error) {
            console.error(error);
            showMessage(error.message, 'error');
        }
    }

    function populateForm(car) {
        if (editingCarNameSpan) editingCarNameSpan.textContent = `${car.make} ${car.model} (${car.year})`;
        if (carMakeInput) carMakeInput.value = car.make || '';
        if (carModelInput) carModelInput.value = car.model || '';
        if (carYearInput) carYearInput.value = car.year || '';
     
        if (currentPhotosDiv && car.photos && car.photos.length > 0) {
            currentPhotosDiv.innerHTML = ''; // Clear
            car.photos.forEach((photoUrl, index) => {
                const photoDiv = document.createElement('div');
                photoDiv.style.position = 'relative';
                photoDiv.style.display = 'inline-block';
                photoDiv.style.marginRight = '10px';
                photoDiv.innerHTML = `
                    <img src="${photoUrl}" alt="Photo ${index + 1}" style="width:100px; height:auto; border-radius:.2rem;">
                    <button type="button" class="btn-delete-photo" data-photo-url="${photoUrl}" style="position:absolute; top:0; right:0; background:rgba(255,0,0,0.7); color:white; border:none; cursor:pointer; border-radius: 50%; width: 20px; height: 20px; line-height: 18px; text-align: center;">×</button>
                `;
                currentPhotosDiv.appendChild(photoDiv);
            });
  
             document.querySelectorAll('.btn-delete-photo').forEach(button => {
                button.addEventListener('click', handleDeleteExistingPhoto);
            });
        }
    }
    
    async function handleDeleteExistingPhoto(event) {
        const photoUrlToDelete = event.target.dataset.photoUrl;
        if (!confirm(`Are you sure you want to remove this photo? This will be permanent upon saving changes.`)) return;

      
        event.target.closest('div[style*="position:relative"]').remove();
        

        showMessage('Photo marked for removal. Save changes to make it permanent.', 'info');
    }


    if(editVehicleForm) {
        editVehicleForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showMessage('Saving changes...', 'info');

            const formData = new FormData(editVehicleForm); 
  
            const carData = {
                make: formData.get('carMake'),
                model: formData.get('carModel'),
                year: formData.get('carYear'),
                licensePlate: formData.get('licensePlate'),
                carType: formData.get('carType'),
                transmission: formData.get('transmission'),
                fuelType: formData.get('fuelType'),
                seats: formData.get('seats'),
                hourlyPrice: formData.get('hourlyPrice'),
                locationCity: formData.get('locationCity'),
                locationNeighborhood: formData.get('locationNeighborhood'),
                description: formData.get('description'),
              
                status: formData.get('listingStatus'),
           
            };



            try {
               
                const response = await fetch(`${BACKEND_URL}/api/cars/${vehicleId}`, {
                    method: 'PUT',
                    headers: { 'x-auth-token': token }, 
                    body: formData 
                });


                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to save vehicle.' }));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                showMessage('Vehicle updated successfully!', 'success');
                setTimeout(() => { window.location.href = 'owner_manage_vehicles.html'; }, 1500);
            } catch (error) {
                console.error(error);
                showMessage(error.message, 'error');
            }
        });
    }

   
    if (vehicleId && token && currentUser && currentUser.role === 'owner') {
        fetchVehicleDetails();
    } else if (!vehicleId) {
        
    } else {
        showMessage('Authentication error or invalid role.', 'error');
     
    }

});