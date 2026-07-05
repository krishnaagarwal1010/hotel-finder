/* Add/Edit Hotel Form Logic (add-edit.html) */

let isEditMode = false;
let hotelId = null;

// DOM Elements
const elements = {
  form: document.getElementById('hotel-form'),
  formTitle: document.getElementById('form-title'),
  loading: document.getElementById('form-loading'),
  btnSubmit: document.getElementById('btn-submit'),
  
  // Inputs
  name: document.getElementById('hotel-name-input'),
  location: document.getElementById('hotel-location-input'),
  price: document.getElementById('hotel-price-input'),
  rating: document.getElementById('hotel-rating-input'),
  thumbnail: document.getElementById('hotel-thumbnail-input'),
  photos: document.getElementById('hotel-photos-input'),
  description: document.getElementById('hotel-description-input')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  hotelId = urlParams.get('id');
  isEditMode = !!hotelId;
  
  if (isEditMode) {
    prepareEditMode(hotelId);
  }
  
  setupFormHandler();
});

// Setup Edit Mode UI and populate fields
async function prepareEditMode(id) {
  document.title = "StayHub - Edit Hotel Listing";
  elements.formTitle.textContent = "Edit Hotel Listing";
  elements.btnSubmit.textContent = "Save Changes";
  
  // Show loading indicator, hide form fields
  elements.loading.classList.remove('d-none');
  setFormDisabled(true);
  
  try {
    const hotel = await getHotelById(id);
    
    // Populate form fields
    elements.name.value = hotel.name;
    elements.location.value = hotel.location;
    elements.price.value = Math.round(parseFloat(hotel.price));
    elements.rating.value = parseFloat(hotel.rating).toFixed(1);
    elements.thumbnail.value = hotel.thumbnail;
    elements.description.value = hotel.description;
    
    // photos array join
    if (hotel.photos && hotel.photos.length > 0) {
      // Don't repeat the thumbnail URL if it is the only one in the photos array
      if (hotel.photos.length === 1 && hotel.photos[0] === hotel.thumbnail) {
        elements.photos.value = '';
      } else {
        elements.photos.value = hotel.photos.join(', ');
      }
    } else {
      elements.photos.value = '';
    }

  } catch (error) {
    console.error('Error fetching hotel for editing:', error);
    alert('Failed to load hotel data. Redirecting back to dashboard.');
    window.location.href = 'manage.html';
  } finally {
    elements.loading.classList.add('d-none');
    setFormDisabled(false);
  }
}

// Enable/Disable form inputs
function setFormDisabled(disabled) {
  const formElements = elements.form.elements;
  for (let i = 0; i < formElements.length; i++) {
    formElements[i].disabled = disabled;
  }
}

// Setup Form Submission
function setupFormHandler() {
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 1. Client-side Validations
    const ratingValue = parseFloat(elements.rating.value);
    if (ratingValue < 1.0 || ratingValue > 5.0) {
      alert('Star Rating must be between 1.0 and 5.0.');
      return;
    }
    
    const priceValue = parseFloat(elements.price.value);
    if (priceValue <= 0) {
      alert('Price per night must be greater than ₹0.');
      return;
    }

    // 2. Format additional photos string into array
    const photosRaw = elements.photos.value.trim();
    let photosArray = [];
    if (photosRaw) {
      photosArray = photosRaw.split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    }
    
    // Always ensure at least the thumbnail is in the photos list
    if (photosArray.length === 0) {
      photosArray.push(elements.thumbnail.value.trim());
    }

    // 3. Construct Hotel Data
    const hotelData = {
      name: elements.name.value.trim(),
      location: elements.location.value,
      price: priceValue.toFixed(2),
      rating: ratingValue,
      thumbnail: elements.thumbnail.value.trim(),
      photos: photosArray,
      description: elements.description.value.trim()
    };

    // 4. Save
    try {
      if (isEditMode) {
        updateHotel(hotelId, hotelData);
      } else {
        createHotel(hotelData);
      }
      
      // Redirect
      window.location.href = 'manage.html';
    } catch (error) {
      console.error('Error saving hotel details:', error);
      alert('An error occurred while saving the hotel details. Please try again.');
    }
  });
}
