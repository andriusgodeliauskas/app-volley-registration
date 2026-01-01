// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login.php`,
  REGISTER: `${API_BASE_URL}/register.php`,
  LOGOUT: `${API_BASE_URL}/logout.php`,

  // Admin Endpoints
  ADMIN_USER_DETAILS: `${API_BASE_URL}/admin_user_details.php`,
  ADMIN_USER_UPDATE: `${API_BASE_URL}/admin_user_update.php`,
  ADMIN_EVENT_DETAILS: `${API_BASE_URL}/admin_event_details.php`,
  ADMIN_EVENT_UPDATE: `${API_BASE_URL}/admin_event_update.php`,
  ADMIN_TOPUP: `${API_BASE_URL}/admin_topup.php`,
  ADMIN_EVENT_FINALIZE: `${API_BASE_URL}/admin_event_finalize.php`,
  ADMIN_USER_TRANSACTIONS: `${API_BASE_URL}/admin_user_transactions.php`,
  ADMIN_TRANSACTION_UPDATE: `${API_BASE_URL}/admin_transaction_update.php`,

  // User Actions
  TRANSACTIONS: `${API_BASE_URL}/transactions.php`,

  // User Profile
  USER: `${API_BASE_URL}/user.php`,
  USER_UPDATE: `${API_BASE_URL}/user_update.php`,
  USERS: `${API_BASE_URL}/users.php`,
  ADMIN_STATS: `${API_BASE_URL}/admin_stats.php`,
  ADMIN_TOPUPS: `${API_BASE_URL}/admin_topups.php`,
  ADMIN_RENT: `${API_BASE_URL}/admin_rent.php`,
  EVENT_DETAILS: `${API_BASE_URL}/event_details.php`,

  // Events
  EVENTS: `${API_BASE_URL}/events.php`,
  REGISTER_EVENT: `${API_BASE_URL}/register_event.php`,

  // Registrations
  REGISTRATIONS: `${API_BASE_URL}/registrations.php`,

  // Wallet
  WALLET: `${API_BASE_URL}/wallet.php`,

  // Groups
  GROUPS: `${API_BASE_URL}/groups.php`,
};

/**
 * Make an API request with proper headers and error handling
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Handle unauthorized (token expired)
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

/**
 * POST request helper
 */
export function post(url, body) {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * GET request helper
 */
export function get(url) {
  return apiRequest(url, {
    method: 'GET',
  });
}

/**
 * PUT request helper
 */
export function put(url, body) {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export function del(url) {
  return apiRequest(url, {
    method: 'DELETE',
  });
}
