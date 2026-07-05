# StayHub - Hotel Booking and Management System

StayHub is a responsive hotel discovery and management web application. It integrates directly with a Python-based Hotel REST API, offering real-time hotel search, filtering, detailed exploration, mock booking math, and full administrative CRUD (Create, Read, Update, Delete) capability.

Designed with a clean, classic corporate light theme (Navy and Amber Gold), it is built using semantic HTML5, custom CSS, and vanilla JavaScript (leveraging Bootstrap 5 for responsiveness and grids).

---

## 🌟 Key Features

1. **Hotel Search & Exploration**
   - Live query search matching hotel names or cities.
   - Dual-bound price range filtering (Min/Max price limits in ₹).
   - Real-time location filters for 12 major Indian cities.
   - Minimum star rating filters.
   - Dynamic sorting options (Price: Low to High, Price: High to Low, Rating: High to Low).
   - Client-side pagination for smooth performance.

2. **Detailed Hotel Information & Photo Gallery**
   - Click "View Details" on any card to load the specific hotel page.
   - Fully interactive image carousel gallery rendering the hotel's custom photos.
   - Detailed description and visual iconography badges for room amenities.

3. **Smart Booking Widget**
   - In-page checkout card calculating check-in and check-out durations.
   - Form-level constraints: restricts past dates and ensures check-out is strictly after check-in.
   - Computes total cost dynamically (Daily Rate × Number of Nights booked).
   - Triggers confirmation modal displaying a unique Booking Reference ID and summaries.

4. **Administration & Listing Management Dashboard (CRUD)**
   - View all current hotels in a clean, scrollable administrative table.
   - Quick-search matching hotel names or locations within the dashboard.
   - **Create**: Register new hotels using a structured form complete with validation rules.
   - **Read**: View current details of all listings.
   - **Update**: Edit details, pricing, ratings, description, and images of any hotel.
   - **Delete**: Remove listings using a safe confirmation modal prompt.

---

## 📂 Project Directory Structure

```text
hotel-finder/
├── index.html         # Main Stay Explorer Portal (Search, Filters, Listings Grid)
├── details.html       # Single Hotel Detail view & Booking Widget
├── manage.html        # Admin Dashboard (Management Table, Actions)
├── add-edit.html      # Create/Edit Form (Pre-populates fields in Edit mode)
├── css/
│   └── style.css      # Core Design Tokens (Navy/Gold), animations, overrides
├── js/
│   ├── api.js         # API integration layer + LocalStorage fallback CRUD sync
│   ├── app.js         # Explore Page controller (live filtering & pagination)
│   ├── details.js     # Detail View controller (carousel, booking logic)
│   ├── manage.js      # Dashboard controller (table rows, delete trigger)
│   └── add-edit.js    # Registration form controller (validations, pre-fill)
└── README.md          # Project documentation (this file)
```

---

## ⚙️ CRUD Simulation Architecture

The target Python REST API is hosted publicly and remains **read-only** (returns `405 Method Not Allowed` for writes like `POST`, `PUT`, `PATCH`, and `DELETE`). 

To satisfy the assignment's CRUD specifications, StayHub implements a transparent **LocalStorage Sync Layer** inside `js/api.js`:
- **Read**: Fetches active hotels from the backend REST server.
- **Create**: Generates a high, unique numeric ID (`>= 10000`) and saves the hotel to `localStorage` under `stayhub_added_hotels`.
- **Update**: Saves modifications to custom hotels directly, or maps modifications of API hotels in `localStorage` under `stayhub_updated_hotels`.
- **Delete**: Removes custom hotels from the array, or appends API hotel IDs to a list under `stayhub_deleted_ids` to exclude them on subsequent reads.
- **Merge**: When retrieving listings, `js/api.js` automatically merges backend results with local storage overrides, applies filters/sorts globally, and returns the result, creating a seamless CRUD experience.

---

## 🔌 API Reference Integrated

- **API Docs URL**: `https://demohotelsapi.pythonanywhere.com/`
- **REST Base URL**: `https://demohotelsapi.pythonanywhere.com/hotels/`
- **Supported URL Queries**:
  - Location Filter: `?location=Goa`
  - Text Search: `?search=haven`
  - Price Range Filter: `?min_price=2000&max_price=4000`
  - Rating Filter: `?min_rating=4.0`
  - Sorting: `?order_by=-rating` or `?order_by=price`

---

## 🚀 How to Run the Project Locally

Since the project is built with vanilla HTML, CSS, and JS:
1. Extract or clone this folder.
2. Open `index.html` directly in any web browser.
3. *Alternative (Recommended)*: Run a simple local development server to avoid CORS issues on certain browsers (e.g. using VS Code's "Live Server" extension, or running `npx serve` in the project directory).
