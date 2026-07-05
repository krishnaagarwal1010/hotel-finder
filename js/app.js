/* Explore Page Logic (index.html) */

// Global State
const state = {
  filters: {
    search: '',
    location: '',
    min_price: '',
    max_price: '',
    min_rating: '',
    order_by: '',
    limit: 9,      // 9 hotels per page (fits 3x3 grid nicely)
    skip: 0
  },
  currentPage: 1,
  totalCount: 0
};

// DOM Elements
const elements = {
  form: document.getElementById('filter-form'),
  search: document.getElementById('filter-search'),
  location: document.getElementById('filter-location'),
  minPrice: document.getElementById('filter-min-price'),
  maxPrice: document.getElementById('filter-max-price'),
  rating: document.getElementById('filter-rating'),
  sort: document.getElementById('filter-sort'),
  
  btnClearFilters: document.getElementById('btn-clear-filters'),
  btnEmptyReset: document.getElementById('btn-empty-reset'),
  
  hotelsGrid: document.getElementById('hotels-grid'),
  resultsCount: document.getElementById('results-count'),
  loadingSpinner: document.getElementById('loading-spinner'),
  errorAlert: document.getElementById('error-alert'),
  emptyState: document.getElementById('empty-state'),
  
  paginationNav: document.getElementById('pagination-nav'),
  btnPagePrev: document.getElementById('btn-page-prev'),
  btnPageNext: document.getElementById('btn-page-next'),
  pageInfo: document.getElementById('page-info')
};

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadHotels();
});

// Setup Events
function setupEventListeners() {
  // 1. Search Query with Debounce
  let searchTimeout;
  elements.search.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value.trim();
      resetPagination();
      loadHotels();
    }, 400);
  });

  // 2. Select Dropdowns (City Location, Rating, Sorting)
  elements.location.addEventListener('change', (e) => {
    state.filters.location = e.target.value;
    resetPagination();
    loadHotels();
  });

  elements.rating.addEventListener('change', (e) => {
    state.filters.min_rating = e.target.value;
    resetPagination();
    loadHotels();
  });

  elements.sort.addEventListener('change', (e) => {
    state.filters.order_by = e.target.value;
    resetPagination();
    loadHotels();
  });

  // 3. Price Inputs with Blur/Enter triggers
  const handlePriceChange = () => {
    const minVal = elements.minPrice.value.trim();
    const maxVal = elements.maxPrice.value.trim();
    
    // Simple verification
    if (minVal !== '' && parseFloat(minVal) < 0) return;
    if (maxVal !== '' && parseFloat(maxVal) < 0) return;

    state.filters.min_price = minVal;
    state.filters.max_price = maxVal;
    resetPagination();
    loadHotels();
  };

  elements.minPrice.addEventListener('blur', handlePriceChange);
  elements.maxPrice.addEventListener('blur', handlePriceChange);
  
  // Also trigger price filter on pressing Enter key
  const triggerOnEnter = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePriceChange();
      e.target.blur(); // Triggers focus out
    }
  };
  elements.minPrice.addEventListener('keydown', triggerOnEnter);
  elements.maxPrice.addEventListener('keydown', triggerOnEnter);

  // 4. Pagination Actions
  elements.btnPagePrev.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      state.filters.skip = (state.currentPage - 1) * state.filters.limit;
      loadHotels();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  });

  elements.btnPageNext.addEventListener('click', () => {
    const totalPages = Math.ceil(state.totalCount / state.filters.limit);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      state.filters.skip = (state.currentPage - 1) * state.filters.limit;
      loadHotels();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  });

  // 5. Clear Filters Button Click
  elements.btnClearFilters.addEventListener('click', (e) => {
    e.preventDefault();
    clearAllFilters();
  });

  elements.btnEmptyReset.addEventListener('click', clearAllFilters);
}

// Reset Pagination State
function resetPagination() {
  state.currentPage = 1;
  state.filters.skip = 0;
}

// Clear all inputs and reset state
function clearAllFilters() {
  elements.form.reset();
  
  state.filters.search = '';
  state.filters.location = '';
  state.filters.min_price = '';
  state.filters.max_price = '';
  state.filters.min_rating = '';
  state.filters.order_by = '';
  
  resetPagination();
  loadHotels();
}

// Load hotels from the API wrapper and render them
async function loadHotels() {
  showLoading();
  
  try {
    const response = await getHotels(state.filters);
    
    state.totalCount = response.totalCount;
    renderHotels(response.data);
    updatePaginationControls();
    
    // Update results label
    let label = `Showing ${response.data.length} `;
    if (state.filters.location) {
      label += `hotels in ${state.filters.location}`;
    } else {
      label += `hotels across India`;
    }
    if (response.totalCount > 0) {
      label += ` (out of ${response.totalCount} found)`;
    } else {
      label = `No hotels found`;
    }
    
    if (response.isOffline) {
      label += ` [OFFLINE MODE]`;
    }

    elements.resultsCount.textContent = label;

  } catch (error) {
    console.error('Error loading hotels UI:', error);
    showError();
  }
}

// Render the grid cards
function renderHotels(hotels) {
  elements.hotelsGrid.innerHTML = '';
  
  if (!hotels || hotels.length === 0) {
    showEmpty();
    return;
  }
  
  hideStates();

  hotels.forEach(hotel => {
    const cardCol = document.createElement('div');
    cardCol.className = 'col-sm-12 col-md-6 col-lg-4';
    
    // Format price
    const priceFormatted = parseFloat(hotel.price).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
    
    // Rating star layout
    const ratingValue = parseFloat(hotel.rating).toFixed(1);
    
    cardCol.innerHTML = `
      <article class="hotel-card">
        <div class="hotel-card-img-wrapper">
          <img src="${hotel.thumbnail}" alt="${hotel.name}" class="hotel-card-img" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500';">
        </div>
        <div class="hotel-card-body">
          <h3 class="hotel-card-title">${hotel.name}</h3>
          <div class="hotel-card-location">
            <i class="bi bi-geo-alt-fill text-danger"></i>
            <span>${hotel.location}</span>
          </div>
          <div class="hotel-card-rating">
            <i class="bi bi-star-fill star-icon"></i>
            <span>${ratingValue} / 5.0</span>
          </div>
          <div class="hotel-card-price-container">
            <div class="hotel-card-price">
              ₹${priceFormatted}<span>/night</span>
            </div>
            <a href="details.html?id=${hotel.id}" class="btn btn-sm btn-primary-custom px-3">
              View Details
            </a>
          </div>
        </div>
      </article>
    `;
    
    elements.hotelsGrid.appendChild(cardCol);
  });
}

// Update Pagination Controls
function updatePaginationControls() {
  const totalPages = Math.ceil(state.totalCount / state.filters.limit);
  
  if (state.totalCount <= state.filters.limit) {
    elements.paginationNav.classList.add('d-none');
    return;
  }
  
  elements.paginationNav.classList.remove('d-none');
  elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
  
  // Enable/Disable buttons
  if (state.currentPage === 1) {
    elements.btnPagePrev.parentElement.classList.add('disabled');
  } else {
    elements.btnPagePrev.parentElement.classList.remove('disabled');
  }
  
  if (state.currentPage === totalPages) {
    elements.btnPageNext.parentElement.classList.add('disabled');
  } else {
    elements.btnPageNext.parentElement.classList.remove('disabled');
  }
}

// UI State Switchers
function showLoading() {
  elements.loadingSpinner.classList.remove('d-none');
  elements.hotelsGrid.classList.add('d-none');
  elements.paginationNav.classList.add('d-none');
  elements.emptyState.classList.add('d-none');
  elements.errorAlert.classList.add('d-none');
  elements.resultsCount.textContent = 'Searching for stays...';
}

function showError() {
  elements.loadingSpinner.classList.add('d-none');
  elements.hotelsGrid.classList.add('d-none');
  elements.paginationNav.classList.add('d-none');
  elements.emptyState.classList.add('d-none');
  elements.errorAlert.classList.remove('d-none');
  elements.resultsCount.textContent = 'Connection Error';
}

function showEmpty() {
  elements.loadingSpinner.classList.add('d-none');
  elements.hotelsGrid.classList.add('d-none');
  elements.paginationNav.classList.add('d-none');
  elements.emptyState.classList.remove('d-none');
  elements.errorAlert.classList.add('d-none');
  elements.resultsCount.textContent = 'No stays found';
}

function hideStates() {
  elements.loadingSpinner.classList.add('d-none');
  elements.hotelsGrid.classList.remove('d-none');
  elements.emptyState.classList.add('d-none');
  elements.errorAlert.classList.add('d-none');
}
