// Unified Frontend App - Connected to MySQL Backend API
// This file combines api.js and app-api.js without ES6 modules

// ========== API Configuration ==========
const API_BASE_URL = 'http://localhost:3000/api';

// Helper functions
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

function getCurrentUser() {
  const userStr = localStorage.getItem('current_user');
  return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current_user');
  }
}

function normalizeServiceRequestStatus(input) {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  const allowed = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  if (allowed.includes(trimmed)) return trimmed;
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
const authAPI = {
  register: async (fullName, email, password, phone, address) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone, address }),
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
const usersAPI = {
  getAll: async (role) => {
    const query = role ? `?role=${role}` : '';
    return apiRequest(`/users${query}`);
  },

  getMe: async () => {
    return apiRequest('/users/me');
  },

  create: async (fullName, email, password, role, phone, address, position) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        fullName,
        email,
        password,
        role,
        phone,
        address,
        position,
      }),
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
const productsAPI = {
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
const serviceRequestsAPI = {
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
const serviceNotesAPI = {
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

// ========== DOM Elements ==========
const authSection = document.getElementById('authSection');
const userArea = document.getElementById('userArea');
const currentUserNameSpan = document.getElementById('currentUserName');
const currentRoleLabel = document.getElementById('currentRoleLabel');
const logoutBtn = document.getElementById('logoutBtn');

const tabButtons = document.querySelectorAll('.tab-button');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const customerView = document.getElementById('customerView');
const technicianView = document.getElementById('technicianView');
const adminView = document.getElementById('adminView');

const serviceForm = document.getElementById('serviceForm');
const customerProductSelect = document.getElementById('customerProduct');
const requestDateInput = document.getElementById('requestDate');
const customerRequestsTableBody = document.getElementById('customerRequestsTableBody');

const technicianRequestsTableBody = document.getElementById('technicianRequestsTableBody');

const adminStatsContainer = document.getElementById('adminStats');
const addTechnicianForm = document.getElementById('addTechnicianForm');
const addProductForm = document.getElementById('addProductForm');
const adminProductsTableBody = document.getElementById('adminProductsTableBody');
const adminRequestsTableBody = document.getElementById('adminRequestsTableBody');

// ========== UI Functions ==========
function updateUIForRole() {
  const user = getCurrentUser();

  if (!user) {
    authSection.classList.remove('hidden');
    userArea.style.display = 'none';
    customerView.classList.add('hidden');
    technicianView.classList.add('hidden');
    adminView.classList.add('hidden');
    currentRoleLabel.textContent = 'Not signed in';
    currentUserNameSpan.textContent = '';
    return;
  }

  authSection.classList.add('hidden');
  userArea.style.display = 'flex';
  currentUserNameSpan.textContent = user.fullName;
  currentRoleLabel.textContent =
    user.role === 'admin'
      ? 'Administrator'
      : user.role === 'technician'
      ? 'Technician'
      : 'Customer';

  customerView.classList.add('hidden');
  technicianView.classList.add('hidden');
  adminView.classList.add('hidden');

  if (user.role === 'customer') {
    customerView.classList.remove('hidden');
    populateCustomerProducts();
    renderCustomerRequests();
  } else if (user.role === 'technician') {
    technicianView.classList.remove('hidden');
    renderTechnicianRequests();
  } else if (user.role === 'admin') {
    adminView.classList.remove('hidden');
    renderAdminProducts();
    renderAdminRequests();
    renderAdminStats();
  }
}

function statusLabel(status) {
  return status || 'Pending';
}

// ========== Event Listeners ==========
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('loginTab').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerTab').classList.toggle('hidden', tab !== 'register');
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    await authAPI.login(email, password);
    loginForm.reset();
    updateUIForRole();
  } catch (error) {
    alert(error.message || 'Login failed. Make sure the backend server is running on http://localhost:3000');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const phone = document.getElementById('registerPhone').value.trim();
  const address = document.getElementById('registerAddress').value.trim();

  try {
    await authAPI.register(fullName, email, password, phone, address);
    registerForm.reset();
    updateUIForRole();
  } catch (error) {
    alert(error.message || 'Registration failed. Make sure the backend server is running on http://localhost:3000');
  }
});

logoutBtn.addEventListener('click', () => {
  authAPI.logout();
  updateUIForRole();
});

if (requestDateInput) {
  const today = new Date().toISOString().split('T')[0];
  requestDateInput.value = today;
}

// ========== Render Functions ==========
async function populateCustomerProducts() {
  try {
    const products = await productsAPI.getAll();
    customerProductSelect.innerHTML =
      '<option value="">No specific product</option>' +
      products
        .map(
          (p) =>
            `<option value="${p.id}">${p.name} ${p.model ? '- ' + p.model : ''}</option>`
        )
        .join('');
  } catch (error) {
    console.error('Error loading products:', error);
    customerProductSelect.innerHTML = '<option value="">No specific product</option>';
  }
}

async function renderCustomerRequests() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const requests = await serviceRequestsAPI.getAll();
    customerRequestsTableBody.innerHTML = '';

    if (requests.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No requests yet.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      customerRequestsTableBody.appendChild(tr);
      return;
    }

    requests.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.service_code}</td>
        <td>${r.product_name || '-'}</td>
        <td>${r.request_date}</td>
        <td>${statusLabel(r.status)}</td>
        <td>${r.service_fee || '-'}</td>
      `;
      customerRequestsTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading customer requests:', error);
    alert('Error loading requests. Make sure the backend server is running.');
  }
}

async function renderTechnicianRequests() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const requests = await serviceRequestsAPI.getAll();
    technicianRequestsTableBody.innerHTML = '';

    if (requests.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'No requests assigned to you yet.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      technicianRequestsTableBody.appendChild(tr);
      return;
    }

    requests.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.service_code}</td>
        <td>${r.customer_name || '-'}</td>
        <td>${r.product_name || '-'}</td>
        <td>${r.problem_desc}</td>
        <td>${statusLabel(r.status)}</td>
        <td>
          <button class="btn small" data-action="update-status" data-id="${r.id}">
            Update status
          </button>
        </td>
      `;
      technicianRequestsTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading technician requests:', error);
    alert('Error loading requests. Make sure the backend server is running.');
  }
}

technicianRequestsTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest("button[data-action='update-status']");
  if (!btn) return;
  const id = btn.dataset.id;

  const newStatus = prompt(
    'Status: Pending | In Progress | Completed | Cancelled (case/spaces flexible):',
    'Pending'
  );
  if (!newStatus) return;

  const normalized = normalizeServiceRequestStatus(newStatus);
  if (!normalized) {
    alert(
      'Invalid status. Use one of: Pending, In Progress, Completed, Cancelled (e.g. "in progress" works).'
    );
    return;
  }

  const noteText = prompt('Add service note (optional):', '');

  try {
    await serviceRequestsAPI.updateStatus(id, normalized);
    if (noteText && noteText.trim()) {
      await serviceNotesAPI.create(id, noteText.trim());
    }
    renderTechnicianRequests();
    renderCustomerRequests();
    renderAdminRequests();
    renderAdminStats();
  } catch (error) {
    alert(error.message || 'Failed to update status');
  }
});

serviceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user || user.role !== 'customer') {
    alert('You must be logged in as a customer to submit a request.');
    return;
  }

  const productId = customerProductSelect.value || null;
  const requestDate = requestDateInput.value;
  const problemDesc = document.getElementById('problemDescription').value.trim();
  const serviceFee = document.getElementById('serviceFee').value;

  if (!problemDesc) {
    alert('Please describe the problem.');
    return;
  }

  try {
    await serviceRequestsAPI.create(productId, requestDate, problemDesc, serviceFee);
    serviceForm.reset();
    const today = new Date().toISOString().split('T')[0];
    requestDateInput.value = today;
    renderCustomerRequests();
    renderAdminRequests();
    renderAdminStats();
    alert('Service request submitted successfully.');
  } catch (error) {
    alert(error.message || 'Failed to submit request');
  }
});

addTechnicianForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('techName').value.trim();
  const email = document.getElementById('techEmail').value.trim();
  const password = document.getElementById('techPassword').value;
  const phone = document.getElementById('techPhone').value.trim();
  const position = document.getElementById('techPosition').value.trim();

  try {
    await usersAPI.create(fullName, email, password, 'technician', phone, null, position);
    addTechnicianForm.reset();
    renderAdminRequests();
    renderAdminStats();
    alert('Technician added successfully.');
  } catch (error) {
    alert(error.message || 'Failed to add technician');
  }
});

addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('productName').value.trim();
  const model = document.getElementById('productModel').value.trim();
  const serial = document.getElementById('productSerial').value.trim();
  const description = document
    .getElementById('productDescription')
    .value.trim();
  const warrantyPeriod = document
    .getElementById('productWarranty')
    .value.trim();

  try {
    await productsAPI.create(
      name,
      model,
      serial,
      description || null,
      warrantyPeriod || null,
      null,
      null
    );
    addProductForm.reset();
    renderAdminProducts();
    populateCustomerProducts();
    alert('Product added successfully.');
  } catch (error) {
    alert(error.message || 'Failed to add product');
  }
});

async function renderAdminProducts() {
  try {
    const products = await productsAPI.getAll();
    adminProductsTableBody.innerHTML = '';

    if (products.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No products.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      adminProductsTableBody.appendChild(tr);
      return;
    }

    products.forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.model || '-'}</td>
        <td>${p.serial_no || '-'}</td>
        <td>${p.description || '-'}</td>
        <td>${p.warranty_period || '-'}</td>
      `;
      adminProductsTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

async function renderAdminRequests() {
  try {
    const [requests, technicians] = await Promise.all([
      serviceRequestsAPI.getAll(),
      usersAPI.getAll('technician'),
    ]);

    adminRequestsTableBody.innerHTML = '';

    if (requests.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'No service requests.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      adminRequestsTableBody.appendChild(tr);
      return;
    }

    requests.forEach((r) => {
      const tr = document.createElement('tr');
      const techOptions =
        '<option value="">Unassigned</option>' +
        technicians
          .map(
            (t) =>
              `<option value="${t.id}" ${
                r.technician_id === t.id ? 'selected' : ''
              }>${t.full_name}</option>`
          )
          .join('');

      tr.innerHTML = `
        <td>${r.service_code}</td>
        <td>${r.customer_name || '-'}</td>
        <td>${r.product_name || '-'}</td>
        <td>${r.technician_name || '-'}</td>
        <td>${statusLabel(r.status)}</td>
        <td>
          <select data-role="assign-tech" data-id="${r.id}">
            ${techOptions}
          </select>
          <button class="btn small" data-role="set-status" data-id="${r.id}">Status</button>
        </td>
      `;

      adminRequestsTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading admin requests:', error);
  }
}

adminRequestsTableBody.addEventListener('change', async (e) => {
  const select = e.target.closest("select[data-role='assign-tech']");
  if (!select) return;
  const id = select.dataset.id;
  const techId = select.value || null;

  try {
    await serviceRequestsAPI.assignTechnician(id, techId);
    renderAdminRequests();
    renderTechnicianRequests();
  } catch (error) {
    alert(error.message || 'Failed to assign technician');
  }
});

adminRequestsTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest("button[data-role='set-status']");
  if (!btn) return;
  const id = btn.dataset.id;

  const newStatus = prompt(
    'Status: Pending | In Progress | Completed | Cancelled (case/spaces flexible):',
    'Pending'
  );
  if (!newStatus) return;

  const normalized = normalizeServiceRequestStatus(newStatus);
  if (!normalized) {
    alert(
      'Invalid status. Use one of: Pending, In Progress, Completed, Cancelled (e.g. "in progress" works).'
    );
    return;
  }

  try {
    await serviceRequestsAPI.updateStatus(id, normalized);
    renderAdminRequests();
    renderCustomerRequests();
    renderTechnicianRequests();
    renderAdminStats();
  } catch (error) {
    alert(error.message || 'Failed to update status');
  }
});

async function renderAdminStats() {
  try {
    const stats = await serviceRequestsAPI.getDashboardStats();
    const products = await productsAPI.getAll();
    const technicians = await usersAPI.getAll('technician');
    const customers = await usersAPI.getAll('customer');

    adminStatsContainer.innerHTML = '';

    const statsData = [
      { label: 'Customers', value: customers.length },
      { label: 'Technicians', value: technicians.length },
      { label: 'Products', value: products.length },
      { label: 'Pending requests', value: stats.pending_count || 0 },
      { label: 'In-progress requests', value: stats.in_progress_count || 0 },
      { label: 'Completed requests', value: stats.completed_count || 0 },
    ];

    statsData.forEach((s) => {
      const div = document.createElement('div');
      div.className = 'stat-card';
      div.innerHTML = `
        <span class="stat-label">${s.label}</span>
        <span class="stat-value">${s.value}</span>
      `;
      adminStatsContainer.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Initialize app
updateUIForRole();
