/* API Client & local storage CRUD simulation layer */

const API_BASE_URL = 'https://demohotelsapi.pythonanywhere.com/hotels/';

// LocalStorage Keys for CRUD overrides
const KEYS = {
  DELETED: 'stayhub_deleted_ids',
  ADDED: 'stayhub_added_hotels',
  UPDATED: 'stayhub_updated_hotels'
};

// Helper utilities for LocalStorage operations
function getLocalList(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveLocalList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function getLocalObj(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}

function saveLocalObj(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

/**
 * Fetch hotels from API merged with localStorage overrides (CRUD simulation).
 * @param {Object} filters - Search, filter, sorting, and pagination parameters
 */
async function getHotels(filters = {}) {
  try {
    // 1. Construct URL for the API fetch with supported backend filter parameters
    const url = new URL(API_BASE_URL);
    
    // Pass filters supported directly by the backend API
    if (filters.search) {
      url.searchParams.append('search', filters.search);
    }
    if (filters.location) {
      url.searchParams.append('location', filters.location);
    }
    if (filters.min_price) {
      url.searchParams.append('min_price', filters.min_price);
    }
    if (filters.max_price) {
      url.searchParams.append('max_price', filters.max_price);
    }
    if (filters.min_rating) {
      url.searchParams.append('min_rating', filters.min_rating);
    }
    if (filters.order_by) {
      url.searchParams.append('order_by', filters.order_by);
    }

    // Fetch from API
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const apiResult = await response.json();
    let hotels = apiResult.data || [];

    // 2. Apply LocalStorage Overrides
    const deletedIds = getLocalList(KEYS.DELETED);
    const addedHotels = getLocalList(KEYS.ADDED);
    const updatedOverrides = getLocalObj(KEYS.UPDATED);

    // A. Filter out deleted hotels
    hotels = hotels.filter(hotel => !deletedIds.includes(hotel.id));

    // B. Merge updates to API hotels
    hotels = hotels.map(hotel => {
      if (updatedOverrides[hotel.id]) {
        return { ...hotel, ...updatedOverrides[hotel.id] };
      }
      return hotel;
    });

    // C. Filter and append added custom hotels (matching filters client-side)
    let filteredAdded = addedHotels;
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filteredAdded = filteredAdded.filter(h => 
        h.name.toLowerCase().includes(q) || 
        h.location.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q))
      );
    }
    
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filteredAdded = filteredAdded.filter(h => h.location.toLowerCase() === loc);
    }
    
    if (filters.min_price) {
      const minP = parseFloat(filters.min_price);
      filteredAdded = filteredAdded.filter(h => parseFloat(h.price) >= minP);
    }
    
    if (filters.max_price) {
      const maxP = parseFloat(filters.max_price);
      filteredAdded = filteredAdded.filter(h => parseFloat(h.price) <= maxP);
    }
    
    if (filters.min_rating) {
      const minR = parseFloat(filters.min_rating);
      filteredAdded = filteredAdded.filter(h => h.rating >= minR);
    }

    // Merge API hotels and custom added hotels
    let mergedHotels = [...filteredAdded, ...hotels];

    // D. Re-apply sorting if custom items are mixed in or if sorting is selected
    if (filters.order_by) {
      const field = filters.order_by;
      mergedHotels.sort((a, b) => {
        let valA, valB;
        if (field.includes('price')) {
          valA = parseFloat(a.price);
          valB = parseFloat(b.price);
        } else if (field.includes('rating')) {
          valA = parseFloat(a.rating);
          valB = parseFloat(b.rating);
        } else {
          valA = a.name;
          valB = b.name;
        }

        if (field.startsWith('-')) {
          return valB > valA ? 1 : valB < valA ? -1 : 0; // Descending
        } else {
          return valA > valB ? 1 : valA < valB ? -1 : 0; // Ascending
        }
      });
    }

    // 3. Client-side Pagination on the final merged list
    const totalCount = mergedHotels.length;
    const skip = parseInt(filters.skip) || 0;
    const limit = parseInt(filters.limit) || 12;
    const paginatedHotels = mergedHotels.slice(skip, skip + limit);

    return {
      data: paginatedHotels,
      totalCount: totalCount
    };
  } catch (error) {
    console.error('Error fetching/merging hotels:', error);
    // If backend API fails completely (e.g. offline), we fall back to localStorage items only
    const addedHotels = getLocalList(KEYS.ADDED);
    return {
      data: addedHotels.slice(0, 12),
      totalCount: addedHotels.length,
      isOffline: true
    };
  }
}

/**
 * Fetch a single hotel by ID, checking overrides first.
 * @param {number|string} id - The unique hotel identifier
 */
async function getHotelById(id) {
  const numericId = parseInt(id);
  
  // 1. Check if deleted
  const deletedIds = getLocalList(KEYS.DELETED);
  if (deletedIds.includes(numericId)) {
    throw new Error('Hotel has been deleted.');
  }

  // 2. Check if custom added hotel
  const addedHotels = getLocalList(KEYS.ADDED);
  const customHotel = addedHotels.find(h => h.id === numericId);
  if (customHotel) {
    return customHotel;
  }

  // 3. Fetch from API
  const response = await fetch(`${API_BASE_URL}${numericId}/`);
  if (!response.ok) {
    throw new Error(`Hotel not found (status ${response.status})`);
  }
  const apiResult = await response.json();
  const hotel = apiResult.data || apiResult;

  // 4. Merge if there is an update override
  const updatedOverrides = getLocalObj(KEYS.UPDATED);
  if (updatedOverrides[numericId]) {
    return { ...hotel, ...updatedOverrides[numericId] };
  }

  // If the hotel has no photos list, inject the thumbnail as photo array
  if (!hotel.photos || hotel.photos.length === 0) {
    hotel.photos = [hotel.thumbnail];
  }

  return hotel;
}

/**
 * Simulate creation of a new hotel in localStorage.
 * @param {Object} hotelData - The data of the hotel to create
 */
function createHotel(hotelData) {
  const addedHotels = getLocalList(KEYS.ADDED);
  
  // Generate high numeric ID to avoid conflicts with API IDs (which are small)
  const newId = 10000 + Date.now() + Math.floor(Math.random() * 1000);
  
  const newHotel = {
    id: newId,
    name: hotelData.name,
    price: parseFloat(hotelData.price).toFixed(2),
    thumbnail: hotelData.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
    rating: parseFloat(hotelData.rating) || 3.0,
    location: hotelData.location,
    description: hotelData.description || 'No description provided.',
    photos: hotelData.photos || [hotelData.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500']
  };

  addedHotels.unshift(newHotel); // Add to the top
  saveLocalList(KEYS.ADDED, addedHotels);
  return newHotel;
}

/**
 * Simulate updating an existing hotel.
 * @param {number|string} id - Hotel ID
 * @param {Object} updatedFields - Fields to update
 */
function updateHotel(id, updatedFields) {
  const numericId = parseInt(id);
  
  // 1. If it's a custom added hotel
  if (numericId >= 10000) {
    const addedHotels = getLocalList(KEYS.ADDED);
    const index = addedHotels.findIndex(h => h.id === numericId);
    if (index !== -1) {
      addedHotels[index] = { ...addedHotels[index], ...updatedFields };
      saveLocalList(KEYS.ADDED, addedHotels);
      return addedHotels[index];
    }
    throw new Error('Custom hotel not found for update.');
  }

  // 2. If it's an API hotel, save the delta in updated overrides
  const updatedOverrides = getLocalObj(KEYS.UPDATED);
  updatedOverrides[numericId] = {
    ...(updatedOverrides[numericId] || {}),
    ...updatedFields
  };
  saveLocalObj(KEYS.UPDATED, updatedOverrides);
  return { id: numericId, ...updatedFields };
}

/**
 * Simulate deleting a hotel.
 * @param {number|string} id - Hotel ID
 */
function deleteHotel(id) {
  const numericId = parseInt(id);

  // 1. If it's a custom added hotel, remove it from added list
  if (numericId >= 10000) {
    const addedHotels = getLocalList(KEYS.ADDED);
    const filtered = addedHotels.filter(h => h.id !== numericId);
    saveLocalList(KEYS.ADDED, filtered);
    return true;
  }

  // 2. If it's an API hotel, add it to deleted list override
  const deletedIds = getLocalList(KEYS.DELETED);
  if (!deletedIds.includes(numericId)) {
    deletedIds.push(numericId);
    saveLocalList(KEYS.DELETED, deletedIds);
  }
  return true;
}
