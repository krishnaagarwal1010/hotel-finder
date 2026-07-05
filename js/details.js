/* Details Page Logic (details.html) */

let currentHotel = null;

// DOM Elements
const elements = {
  loading: document.getElementById('details-loading'),
  error: document.getElementById('details-error'),
  content: document.getElementById('details-content'),
  
  carouselIndicators: document.getElementById('carousel-indicators-container'),
  carouselInner: document.getElementById('carousel-inner-container'),
  
  name: document.getElementById('hotel-name'),
  location: document.getElementById('hotel-location'),
  ratingVal: document.getElementById('hotel-rating-val'),
  description: document.getElementById('hotel-description'),
  priceVal: document.getElementById('hotel-price-val'),
  
  bookingForm: document.getElementById('booking-form'),
  checkin: document.getElementById('booking-checkin'),
  checkout: document.getElementById('booking-checkout'),
  guests: document.getElementById('booking-guests'),
  guestName: document.getElementById('booking-name'),
  guestEmail: document.getElementById('booking-email'),
  
  // Modal Elements
  modalRefId: document.getElementById('modal-ref-id'),
  modalHotelName: document.getElementById('modal-hotel-name'),
  modalGuestName: document.getElementById('modal-guest-name'),
  modalCheckin: document.getElementById('modal-checkin'),
  modalCheckout: document.getElementById('modal-checkout'),
  modalNights: document.getElementById('modal-nights'),
  modalTotalPrice: document.getElementById('modal-total-price')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelId = urlParams.get('id');
  
  if (!hotelId) {
    showError();
    return;
  }
  
  loadHotelDetails(hotelId);
  setupDateLimits();
  setupBookingHandler();
});

// Load hotel data
async function loadHotelDetails(id) {
  try {
    currentHotel = await getHotelById(id);
    renderHotelDetails(currentHotel);
  } catch (error) {
    console.error('Error fetching hotel detail:', error);
    showError();
  }
}

// Render details onto page
function renderHotelDetails(hotel) {
  elements.name.textContent = hotel.name;
  elements.location.textContent = hotel.location;
  elements.ratingVal.textContent = parseFloat(hotel.rating).toFixed(1);
  elements.description.textContent = hotel.description;
  
  const priceFormatted = parseFloat(hotel.price).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });
  elements.priceVal.textContent = `₹${priceFormatted}`;
  
  // Render Carousel photos
  renderCarousel(hotel.photos || [hotel.thumbnail]);
  
  // Update browser document title
  document.title = `StayHub - ${hotel.name}`;
  
  // Transition views
  elements.loading.classList.add('d-none');
  elements.content.classList.remove('d-none');
}

// Generate Bootstrap carousel indicators and items
function renderCarousel(photos) {
  elements.carouselIndicators.innerHTML = '';
  elements.carouselInner.innerHTML = '';
  
  photos.forEach((photoUrl, index) => {
    // Indicator
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.setAttribute('data-bs-target', '#hotelCarousel');
    indicator.setAttribute('data-bs-slide-to', index);
    if (index === 0) {
      indicator.className = 'active';
      indicator.setAttribute('aria-current', 'true');
    }
    indicator.setAttribute('aria-label', `Slide ${index + 1}`);
    elements.carouselIndicators.appendChild(indicator);
    
    // Slide Item
    const item = document.createElement('div');
    item.className = `carousel-item ${index === 0 ? 'active' : ''}`;
    item.innerHTML = `
      <img src="${photoUrl}" class="d-block w-100" alt="Hotel Photo ${index + 1}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080';">
    `;
    elements.carouselInner.appendChild(item);
  });
}

// Setup Date constraints (past dates disabled)
function setupDateLimits() {
  const today = new Date();
  const todayStr = formatDate(today);
  
  // Check-in must be today or later
  elements.checkin.min = todayStr;
  elements.checkin.value = todayStr;
  
  // Check-out must be tomorrow or later initially
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);
  elements.checkout.min = tomorrowStr;
  elements.checkout.value = tomorrowStr;

  // When check-in changes, adjust check-out min dynamically
  elements.checkin.addEventListener('change', () => {
    const selectedCheckin = new Date(elements.checkin.value);
    
    const nextDay = new Date(selectedCheckin);
    nextDay.setDate(selectedCheckin.getDate() + 1);
    const nextDayStr = formatDate(nextDay);
    
    elements.checkout.min = nextDayStr;
    
    // If check-out is currently before the new min, auto-adjust it
    const currentCheckout = new Date(elements.checkout.value);
    if (currentCheckout <= selectedCheckin) {
      elements.checkout.value = nextDayStr;
    }
  });
}

// Setup booking click validation and calculation
function setupBookingHandler() {
  elements.bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!currentHotel) return;
    
    const checkinDate = new Date(elements.checkin.value);
    const checkoutDate = new Date(elements.checkout.value);
    
    // Check validation of dates
    if (checkoutDate <= checkinDate) {
      alert('Check-out date must be after the check-in date.');
      return;
    }
    
    // Calculate nights
    const diffTime = Math.abs(checkoutDate - checkinDate);
    const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate price
    const hotelPrice = parseFloat(currentHotel.price);
    const totalPrice = hotelPrice * diffNights;
    
    const totalPriceFormatted = totalPrice.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
    
    // Populate Modal details
    elements.modalRefId.textContent = `SH-${Math.floor(100000 + Math.random() * 900000)}`;
    elements.modalHotelName.textContent = currentHotel.name;
    elements.modalGuestName.textContent = elements.guestName.value;
    elements.modalCheckin.textContent = elements.checkin.value;
    elements.modalCheckout.textContent = elements.checkout.value;
    elements.modalNights.textContent = `${diffNights} night${diffNights > 1 ? 's' : ''}`;
    elements.modalTotalPrice.textContent = `₹${totalPriceFormatted}`;
    
    // Launch Bootstrap modal
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    bookingModal.show();
    
    // Reset Form
    elements.bookingForm.reset();
    setupDateLimits(); // re-setup limits and defaults
  });
}

// Format date into YYYY-MM-DD
function formatDate(date) {
  const yyyy = date.getFullYear();
  let mm = date.getMonth() + 1; // Months start at 0
  let dd = date.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  return `${yyyy}-${mm}-${dd}`;
}

// UI State Switchers
function showError() {
  elements.loading.classList.add('d-none');
  elements.content.classList.add('d-none');
  elements.error.classList.remove('d-none');
}
