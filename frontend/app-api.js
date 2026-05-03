// Frontend app connected to MySQL backend API
import {
  authAPI,
  usersAPI,
  productsAPI,
  serviceRequestsAPI,
  serviceNotesAPI,
  getCurrentUser,
  setCurrentUser,
  normalizeServiceRequestStatus,
} from './api.js';

// Common elements
const authSection = document.getElementById('authSection');
const userArea = document.getElementById('userArea');
const currentUserNameSpan = document.getElementById('currentUserName');
const currentRoleLabel = document.getElementById('currentRoleLabel');
const logoutBtn = document.getElementById('logoutBtn');

// Auth tabs
const tabButtons = document.querySelectorAll('.tab-button');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Role sections
const customerView = document.getElementById('customerView');
const technicianView = document.getElementById('technicianView');
const adminView = document.getElementById('adminView');

// Customer elements
const serviceForm = document.getElementById('serviceForm');
const customerProductSelect = document.getElementById('customerProduct');
const requestDateInput = document.getElementById('requestDate');
const customerRequestsTableBody = document.getElementById('customerRequestsTableBody');

// Technician elements
const technicianRequestsTableBody = document.getElementById('technicianRequestsTableBody');

// Admin elements
const adminStatsContainer = document.getElementById('adminStats');
const addTechnicianForm = document.getElementById('addTechnicianForm');
const addProductForm = document.getElementById('addProductForm');
const adminProductsTableBody = document.getElementById('adminProductsTableBody');
const adminRequestsTableBody = document.getElementById('adminRequestsTableBody');

// Update UI based on role
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

// Auth tabs logic
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('loginTab').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerTab').classList.toggle('hidden', tab !== 'register');
  });
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    await authAPI.login(email, password);
    loginForm.reset();
    updateUIForRole();
  } catch (error) {
    alert(error.message || 'Login failed');
  }
});

// Register (customer)
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  try {
    await authAPI.register(fullName, email, password);
    registerForm.reset();
    updateUIForRole();
  } catch (error) {
    alert(error.message || 'Registration failed');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  authAPI.logout();
  updateUIForRole();
});

// Default date
if (requestDateInput) {
  const today = new Date().toISOString().split('T')[0];
  requestDateInput.value = today;
}

// Populate customer products dropdown
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

// Status label helper
function statusLabel(status) {
  return status || 'Pending';
}

// Render customer requests
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
    alert('Error loading requests');
  }
}

// Render technician requests
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
    alert('Error loading requests');
  }
}

// Update status handler for technician
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

// Create service request (customer)
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

// Add technician (admin)
addTechnicianForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('techName').value.trim();
  const email = document.getElementById('techEmail').value.trim();
  const password = document.getElementById('techPassword').value;

  try {
    await usersAPI.create(fullName, email, password, 'technician');
    addTechnicianForm.reset();
    renderAdminRequests();
    renderAdminStats();
    alert('Technician added successfully.');
  } catch (error) {
    alert(error.message || 'Failed to add technician');
  }
});

// Add product (admin)
addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('productName').value.trim();
  const model = document.getElementById('productModel').value.trim();
  const serial = document.getElementById('productSerial').value.trim();
  const description = document
    .getElementById('productDescription')
    ?.value.trim();
  const warrantyPeriod = document
    .getElementById('productWarranty')
    ?.value.trim();

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

// Render admin products
async function renderAdminProducts() {
  try {
    const products = await productsAPI.getAll();
    adminProductsTableBody.innerHTML = '';

    if (products.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
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
      `;
      adminProductsTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Render admin requests
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

// Assign technician handler
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

// Update status handler for admin
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

// Render admin stats
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
