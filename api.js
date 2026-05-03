// API Configuration and Helper Functions
const API_BASE_URL = 'http://localhost:3000/api';

// Export helper functions first
export function getAuthToken() {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('current_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current_user');
  }
}

/** Values accepted by PUT /service-requests/:id/status */
export const SERVICE_REQUEST_STATUSES = [
  'Pending',
  'In Progress',
  'Completed',
  'Cancelled',
];

/**
 * Maps user input to a canonical status string, or null if invalid.
 * Trims spaces; ignores case; accepts hyphen/underscore instead of spaces.
 */
export function normalizeServiceRequestStatus(input) {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  if (SERVICE_REQUEST_STATUSES.includes(trimmed)) return trimmed;
  const key = trimmed
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const aliases = {
    pending: 'Pending',
    'in progress': 'In Progress',
    inprogress: 'In Progress',
    completed: 'Completed',
    complete: 'Completed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
  };
  return aliases[key] || null;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  register: async (fullName, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data;
  },

  logout: () => {
    setAuthToken(null);
    setCurrentUser(null);
  },
};

// Users API
export const usersAPI = {
  getAll: async (role) => {
    const query = role ? `?role=${role}` : '';
    return apiRequest(`/users${query}`);
  },

  getMe: async () => {
    return apiRequest('/users/me');
  },

  create: async (fullName, email, password, role) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role }),
    });
  },

  update: async (id, fullName, email, role) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fullName, email, role }),
    });
  },

  delete: async (id) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Products API
export const productsAPI = {
  getAll: async (customerId) => {
    const query = customerId ? `?customerId=${customerId}` : '';
    return apiRequest(`/products${query}`);
  },

  getById: async (id) => {
    return apiRequest(`/products/${id}`);
  },

  create: async (
    name,
    model,
    serialNo,
    description,
    warrantyPeriod,
    purchaseDate,
    customerId
  ) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify({
        name,
        model,
        serialNo,
        description,
        warrantyPeriod,
        purchaseDate,
        customerId,
      }),
    });
  },

  update: async (
    id,
    name,
    model,
    serialNo,
    description,
    warrantyPeriod,
    purchaseDate,
    customerId
  ) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        model,
        serialNo,
        description,
        warrantyPeriod,
        purchaseDate,
        customerId,
      }),
    });
  },

  delete: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Service Requests API
export const serviceRequestsAPI = {
  getAll: async (status, technicianId, customerId) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (technicianId) params.append('technicianId', technicianId);
    if (customerId) params.append('customerId', customerId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/service-requests${query}`);
  },

  getById: async (id) => {
    return apiRequest(`/service-requests/${id}`);
  },

  create: async (productId, requestDate, problemDesc, serviceFee) => {
    return apiRequest('/service-requests', {
      method: 'POST',
      body: JSON.stringify({ productId, requestDate, problemDesc, serviceFee }),
    });
  },

  assignTechnician: async (id, technicianId) => {
    return apiRequest(`/service-requests/${id}/assign-technician`, {
      method: 'PUT',
      body: JSON.stringify({ technicianId }),
    });
  },

  updateStatus: async (id, status) => {
    return apiRequest(`/service-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getDashboardStats: async () => {
    return apiRequest('/service-requests/dashboard/stats');
  },
};

// Service Notes API
export const serviceNotesAPI = {
  getByRequestId: async (requestId) => {
    return apiRequest(`/service-notes/service-request/${requestId}`);
  },

  create: async (serviceRequestId, noteText) => {
    return apiRequest('/service-notes', {
      method: 'POST',
      body: JSON.stringify({ serviceRequestId, noteText }),
    });
  },
};

