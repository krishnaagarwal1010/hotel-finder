/* Administration Dashboard Logic (manage.html) */

// Global State
const state = {
  filters: {
    search: '',
    limit: 10,     // 10 hotels per page for clean table lists
    skip: 0
  },
  currentPage: 1,
  totalCount: 0
};

let hotelIdToDelete = null;

// DOM Elements
const elements = {
  search: document.getElementById('manage-search'),
  resultsCount: document.getElementById('manage-results-count'),
  loading: document.getElementById('manage-loading'),
  tableContainer: document.getElementById('manage-table-container'),
  tableBody: document.getElementById('manage-table-body'),
  emptyState: document.getElementById('manage-empty-state'),
  btnResetSearch: document.getElementById('btn-manage-reset-search'),
  
  paginationNav: document.getElementById('manage-pagination-nav'),
  btnPrev: document.getElementById('btn-manage-page-prev'),
  btnNext: document.getElementById('btn-manage-page-next'),
  pageInfo: document.getElementById('manage-page-info'),
  
  // Modal Elements
  deleteModal: document.getElementById('deleteModal'),
  deleteModalHotelName: document.getElementById('delete-modal-hotel-name'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadManagedHotels();
});

// Setup Events
function setupEventListeners() {
  // 1. Search Query Debounce
  let searchTimeout;
  elements.search.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value.trim();
      resetPagination();
      loadManagedHotels();
    }, 400);
  });

  // 2. Reset Search Input
  elements.btnResetSearch.addEventListener('click', () => {
    elements.search.value = '';
    state.filters.search = '';
    resetPagination();
    loadManagedHotels();
  });

  // 3. Pagination Actions
  elements.btnPrev.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      state.filters.skip = (state.currentPage - 1) * state.filters.limit;
      loadManagedHotels();
    }
  });

  elements.btnNext.addEventListener('click', () => {
    const totalPages = Math.ceil(state.totalCount / state.filters.limit);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      state.filters.skip = (state.currentPage - 1) * state.filters.limit;
      loadManagedHotels();
    }
  });

  // 4. Click Handler for Table Actions (Delegation)
  elements.tableBody.addEventListener('click', (e) => {
    // Traverse parent to find button
    const deleteBtn = e.target.closest('.btn-delete-hotel');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      const name = deleteBtn.getAttribute('data-name');
      promptDelete(id, name);
    }
  });

  // 5. Modal Deletion Confirmation
  elements.btnConfirmDelete.addEventListener('click', () => {
    if (hotelIdToDelete !== null) {
      deleteHotel(hotelIdToDelete);
      
      // Close Modal
      const modalInstance = bootstrap.Modal.getInstance(elements.deleteModal);
      if (modalInstance) {
        modalInstance.hide();
      }
      
      // Reset tracker & reload
      hotelIdToDelete = null;
      loadManagedHotels();
    }
  });
}

// Reset Pagination State
function resetPagination() {
  state.currentPage = 1;
  state.filters.skip = 0;
}

// Fetch hotels list
async function loadManagedHotels() {
  showLoading();
  
  try {
    const response = await getHotels(state.filters);
    state.totalCount = response.totalCount;
    
    renderTableRows(response.data);
    updatePaginationControls();
    
    // Update Stats Label
    if (response.totalCount > 0) {
      elements.resultsCount.textContent = `Showing ${state.filters.skip + 1}-${Math.min(state.filters.skip + state.filters.limit, response.totalCount)} of ${response.totalCount} listings`;
    } else {
      elements.resultsCount.textContent = `0 listings found`;
    }
  } catch (error) {
    console.error('Error loading managed hotels:', error);
    elements.resultsCount.textContent = `Connection Error`;
  }
}

// Render Table Listings
function renderTableRows(hotels) {
  elements.tableBody.innerHTML = '';
  
  if (!hotels || hotels.length === 0) {
    showEmpty();
    return;
  }
  
  hideStates();
  
  hotels.forEach(hotel => {
    const row = document.createElement('tr');
    
    const priceFormatted = parseFloat(hotel.price).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
    
    row.innerHTML = `
      <td>
        <img src="${hotel.thumbnail}" class="rounded" style="width: 48px; height: 48px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100';">
      </td>
      <td>
        <div class="fw-bold">${hotel.name}</div>
        <div class="text-muted small d-lg-none"><i class="bi bi-geo-alt-fill text-danger small"></i> ${hotel.location}</div>
      </td>
      <td class="d-none d-lg-table-cell">
        <i class="bi bi-geo-alt-fill text-danger small me-1"></i> ${hotel.location}
      </td>
      <td class="fw-semibold">₹${priceFormatted}</td>
      <td>
        <span class="badge bg-warning text-dark"><i class="bi bi-star-fill me-1"></i>${parseFloat(hotel.rating).toFixed(1)}</span>
      </td>
      <td class="text-center">
        <div class="d-flex justify-content-center gap-2">
          <a href="add-edit.html?id=${hotel.id}" class="btn btn-sm btn-outline-secondary" title="Edit Hotel">
            <i class="bi bi-pencil-square"></i>
          </a>
          <button class="btn btn-sm btn-outline-danger btn-delete-hotel" data-id="${hotel.id}" data-name="${hotel.name}" title="Delete Hotel">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    elements.tableBody.appendChild(row);
  });
}

// Trigger Delete Confirmation Modal
function promptDelete(id, name) {
  hotelIdToDelete = id;
  elements.deleteModalHotelName.textContent = `"${name}"`;
  
  const modal = new bootstrap.Modal(elements.deleteModal);
  modal.show();
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
    elements.btnPrev.parentElement.classList.add('disabled');
  } else {
    elements.btnPrev.parentElement.classList.remove('disabled');
  }
  
  if (state.currentPage === totalPages) {
    elements.btnNext.parentElement.classList.add('disabled');
  } else {
    elements.btnNext.parentElement.classList.remove('disabled');
  }
}

// UI State Switchers
function showLoading() {
  elements.loading.classList.remove('d-none');
  elements.tableContainer.classList.add('d-none');
  elements.paginationNav.classList.add('d-none');
  elements.emptyState.classList.add('d-none');
}

function showEmpty() {
  elements.loading.classList.add('d-none');
  elements.tableContainer.classList.add('d-none');
  elements.paginationNav.classList.add('d-none');
  elements.emptyState.classList.remove('d-none');
}

function hideStates() {
  elements.loading.classList.add('d-none');
  elements.tableContainer.classList.remove('d-none');
  elements.emptyState.classList.add('d-none');
}
