// Frontend-only demo app (data stored in browser localStorage)

const STORAGE_KEYS = {
  users: "sts_users",
  products: "sts_products",
  requests: "sts_requests",
  currentUserId: "sts_current_user_id",
};

function normalizeServiceRequestStatus(input) {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  const allowed = ["Pending", "In Progress", "Completed", "Cancelled"];
  if (allowed.includes(trimmed)) return trimmed;
  const key = trimmed
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const aliases = {
    pending: "Pending",
    "in progress": "In Progress",
    inprogress: "In Progress",
    completed: "Completed",
    complete: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };
  return aliases[key] || null;
}

// Common elements
const authSection = document.getElementById("authSection");
const userArea = document.getElementById("userArea");
const currentUserNameSpan = document.getElementById("currentUserName");
const currentRoleLabel = document.getElementById("currentRoleLabel");
const logoutBtn = document.getElementById("logoutBtn");

// Auth tabs
const tabButtons = document.querySelectorAll(".tab-button");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// Role sections
const customerView = document.getElementById("customerView");
const technicianView = document.getElementById("technicianView");
const adminView = document.getElementById("adminView");

// Customer elements
const serviceForm = document.getElementById("serviceForm");
const customerProductSelect = document.getElementById("customerProduct");
const requestDateInput = document.getElementById("requestDate");
const customerRequestsTableBody = document.getElementById(
  "customerRequestsTableBody"
);

// Technician elements
const technicianRequestsTableBody = document.getElementById(
  "technicianRequestsTableBody"
);

// Admin elements
const adminStatsContainer = document.getElementById("adminStats");
const addTechnicianForm = document.getElementById("addTechnicianForm");
const addProductForm = document.getElementById("addProductForm");
const adminProductsTableBody = document.getElementById(
  "adminProductsTableBody"
);
const adminRequestsTableBody = document.getElementById(
  "adminRequestsTableBody"
);

// Storage helpers
function loadArray(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Seed demo data
function initDemoData() {
  const users = loadArray(STORAGE_KEYS.users);
  if (users.length === 0) {
    const admin = {
      id: generateId("u"),
      fullName: "Admin User",
      email: "admin@smarttech.com",
      password: "admin123",
      role: "admin",
    };
    const technician = {
      id: generateId("u"),
      fullName: "Technician One",
      email: "tech@smarttech.com",
      password: "tech123",
      role: "technician",
    };
    saveArray(STORAGE_KEYS.users, [admin, technician]);
  }
}

// Current user helpers
function getCurrentUser() {
  const id = localStorage.getItem(STORAGE_KEYS.currentUserId);
  if (!id) return null;
  const users = loadArray(STORAGE_KEYS.users);
  return users.find((u) => u.id === id) || null;
}

function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.currentUserId);
  } else {
    localStorage.setItem(STORAGE_KEYS.currentUserId, user.id);
  }
  updateUIForRole();
}

// Update UI based on role
function updateUIForRole() {
  const user = getCurrentUser();

  if (!user) {
    authSection.classList.remove("hidden");
    userArea.style.display = "none";
    customerView.classList.add("hidden");
    technicianView.classList.add("hidden");
    adminView.classList.add("hidden");
    currentRoleLabel.textContent = "Not signed in";
    currentUserNameSpan.textContent = "";
    return;
  }

  authSection.classList.add("hidden");
  userArea.style.display = "flex";
  currentUserNameSpan.textContent = user.fullName;
  currentRoleLabel.textContent =
    user.role === "admin"
      ? "Administrator"
      : user.role === "technician"
      ? "Technician"
      : "Customer";

  customerView.classList.add("hidden");
  technicianView.classList.add("hidden");
  adminView.classList.add("hidden");

  if (user.role === "customer") {
    customerView.classList.remove("hidden");
    populateCustomerProducts();
    renderCustomerRequests();
  } else if (user.role === "technician") {
    technicianView.classList.remove("hidden");
    renderTechnicianRequests();
  } else if (user.role === "admin") {
    adminView.classList.remove("hidden");
    renderAdminProducts();
    renderAdminRequests();
    renderAdminStats();
  }
}

// Auth tabs logic
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById("loginTab").classList.toggle("hidden", tab !== "login");
    document
      .getElementById("registerTab")
      .classList.toggle("hidden", tab !== "register");
  });
});

// Login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const users = loadArray(STORAGE_KEYS.users);
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password.");
    return;
  }

  setCurrentUser(user);
  loginForm.reset();
});

// Register (customer)
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fullName = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  const users = loadArray(STORAGE_KEYS.users);
  if (users.some((u) => u.email === email)) {
    alert("This email is already in use.");
    return;
  }

  const newUser = {
    id: generateId("u"),
    fullName,
    email,
    password,
    role: "customer",
  };
  users.push(newUser);
  saveArray(STORAGE_KEYS.users, users);

  setCurrentUser(newUser);
  registerForm.reset();
});

// Logout
logoutBtn.addEventListener("click", () => {
  setCurrentUser(null);
});

// Default date
if (requestDateInput) {
  const today = new Date().toISOString().split("T")[0];
  requestDateInput.value = today;
}

// Customer products (simple: all products)
function populateCustomerProducts() {
  const products = loadArray(STORAGE_KEYS.products);
  customerProductSelect.innerHTML =
    '<option value="">No specific product</option>' +
    products
      .map(
        (p) =>
          `<option value="${p.id}">${p.name} ${p.model ? "- " + p.model : ""}</option>`
      )
      .join("");
}

// Service requests
function loadRequests() {
  return loadArray(STORAGE_KEYS.requests);
}

function saveRequests(requests) {
  saveArray(STORAGE_KEYS.requests, requests);
}

function createServiceCode() {
  return `SR-${Date.now().toString().slice(-6)}`;
}

// Create service request (customer)
serviceForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user || user.role !== "customer") {
    alert("You must be logged in as a customer to submit a request.");
    return;
  }

  const productId = customerProductSelect.value || null;
  const requestDate = requestDateInput.value;
  const problemDesc = document.getElementById("problemDescription").value.trim();
  const serviceFee = document.getElementById("serviceFee").value;

  if (!problemDesc) {
    alert("Please describe the problem.");
    return;
  }

  const requests = loadRequests();
  const newRequest = {
    id: generateId("r"),
    serviceCode: createServiceCode(),
    customerId: user.id,
    productId,
    technicianId: null,
    requestDate,
    problemDesc,
    status: "Pending",
    serviceFee: serviceFee || null,
    notes: [],
  };

  requests.push(newRequest);
  saveRequests(requests);

  serviceForm.reset();
  const today = new Date().toISOString().split("T")[0];
  requestDateInput.value = today;

  renderCustomerRequests();
  renderAdminRequests();
  renderAdminStats();
  alert("Service request submitted successfully.");
});

// Status label
function statusLabel(status) {
  switch (status) {
    case "Pending":
      return "Pending";
    case "In Progress":
      return "In Progress";
    case "Completed":
      return "Completed";
    case "Cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

// عرض طلبات العميل
function renderCustomerRequests() {
  const user = getCurrentUser();
  if (!user) return;
  const products = loadArray(STORAGE_KEYS.products);
  const requests = loadRequests().filter((r) => r.customerId === user.id);

  customerRequestsTableBody.innerHTML = "";
  if (requests.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No requests yet.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    customerRequestsTableBody.appendChild(tr);
    return;
  }

  requests.forEach((r) => {
    const product = products.find((p) => p.id === r.productId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.serviceCode}</td>
      <td>${product ? product.name : "-"}</td>
      <td>${r.requestDate}</td>
      <td>${statusLabel(r.status)}</td>
      <td>${r.serviceFee || "-"}</td>
    `;
    customerRequestsTableBody.appendChild(tr);
  });
}

// عرض طلبات الفني
function renderTechnicianRequests() {
  const user = getCurrentUser();
  if (!user) return;
  const products = loadArray(STORAGE_KEYS.products);
  const users = loadArray(STORAGE_KEYS.users);
  const requests = loadRequests().filter((r) => r.technicianId === user.id);

  technicianRequestsTableBody.innerHTML = "";
  if (requests.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No requests assigned to you yet.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    technicianRequestsTableBody.appendChild(tr);
    return;
  }

  requests.forEach((r) => {
    const product = products.find((p) => p.id === r.productId);
    const customer = users.find((u) => u.id === r.customerId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.serviceCode}</td>
      <td>${customer ? customer.fullName : "-"}</td>
      <td>${product ? product.name : "-"}</td>
      <td>${r.problemDesc}</td>
      <td>${statusLabel(r.status)}</td>
      <td>
        <button class="btn small" data-action="update-status" data-id="${r.id}">
          Update status
        </button>
      </td>
    `;
    technicianRequestsTableBody.appendChild(tr);
  });
}

technicianRequestsTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='update-status']");
  if (!btn) return;
  const id = btn.dataset.id;
  const requests = loadRequests();
  const req = requests.find((r) => r.id === id);
  if (!req) return;

  const newStatus = prompt(
    "Status: Pending | In Progress | Completed | Cancelled (case/spaces flexible):",
    req.status
  );
  if (!newStatus) return;

  const normalized = normalizeServiceRequestStatus(newStatus);
  if (!normalized) {
    alert(
      'Invalid status. Use one of: Pending, In Progress, Completed, Cancelled (e.g. "in progress" works).'
    );
    return;
  }

  const noteText = prompt("Add service note (optional):", "");
  req.status = normalized;
  if (noteText && noteText.trim()) {
    req.notes.push({
      id: generateId("n"),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    });
  }

  saveRequests(requests);
  renderTechnicianRequests();
  renderCustomerRequests();
  renderAdminRequests();
  renderAdminStats();
});

// إدارة الفنيين (إضافة فقط)
addTechnicianForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fullName = document.getElementById("techName").value.trim();
  const email = document.getElementById("techEmail").value.trim();
  const password = document.getElementById("techPassword").value;

  const users = loadArray(STORAGE_KEYS.users);
  if (users.some((u) => u.email === email)) {
    alert("This email is already in use.");
    return;
  }

  const newTech = {
    id: generateId("u"),
    fullName,
    email,
    password,
    role: "technician",
  };
  users.push(newTech);
  saveArray(STORAGE_KEYS.users, users);

  addTechnicianForm.reset();
  renderAdminRequests();
  alert("تم إضافة الفني بنجاح.");
});

// إدارة المنتجات
addProductForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const model = document.getElementById("productModel").value.trim();
  const serial = document.getElementById("productSerial").value.trim();

  const products = loadArray(STORAGE_KEYS.products);
  products.push({
    id: generateId("p"),
    name,
    model,
    serial,
  });
  saveArray(STORAGE_KEYS.products, products);

  addProductForm.reset();
  renderAdminProducts();
  populateCustomerProducts();
});

function renderAdminProducts() {
  const products = loadArray(STORAGE_KEYS.products);
  adminProductsTableBody.innerHTML = "";
  if (products.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "No products.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    adminProductsTableBody.appendChild(tr);
    return;
  }

  products.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.model || "-"}</td>
      <td>${p.serial || "-"}</td>
    `;
    adminProductsTableBody.appendChild(tr);
  });
}

// عرض الطلبات للأدمن
function renderAdminRequests() {
  const users = loadArray(STORAGE_KEYS.users);
  const technicians = users.filter((u) => u.role === "technician");
  const products = loadArray(STORAGE_KEYS.products);
  const requests = loadRequests();

  adminRequestsTableBody.innerHTML = "";
  if (requests.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No service requests.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    adminRequestsTableBody.appendChild(tr);
    return;
  }

  requests.forEach((r) => {
    const customer = users.find((u) => u.id === r.customerId);
    const tech = users.find((u) => u.id === r.technicianId);
    const product = products.find((p) => p.id === r.productId);

    const tr = document.createElement("tr");
    const techOptions =
      '<option value="">Unassigned</option>' +
      technicians
        .map(
          (t) =>
            `<option value="${t.id}" ${
              r.technicianId === t.id ? "selected" : ""
            }>${t.fullName}</option>`
        )
        .join("");

    tr.innerHTML = `
      <td>${r.serviceCode}</td>
      <td>${customer ? customer.fullName : "-"}</td>
      <td>${product ? product.name : "-"}</td>
      <td>${tech ? tech.fullName : "-"}</td>
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
}

adminRequestsTableBody.addEventListener("change", (e) => {
  const select = e.target.closest("select[data-role='assign-tech']");
  if (!select) return;
  const id = select.dataset.id;
  const techId = select.value || null;
  const requests = loadRequests();
  const r = requests.find((req) => req.id === id);
  if (!r) return;
  r.technicianId = techId;
  saveRequests(requests);
  renderAdminRequests();
  renderTechnicianRequests();
});

adminRequestsTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-role='set-status']");
  if (!btn) return;
  const id = btn.dataset.id;
  const requests = loadRequests();
  const req = requests.find((r) => r.id === id);
  if (!req) return;

  const newStatus = prompt(
    "Status: Pending | In Progress | Completed | Cancelled (case/spaces flexible):",
    req.status
  );
  if (!newStatus) return;

  const normalized = normalizeServiceRequestStatus(newStatus);
  if (!normalized) {
    alert(
      'Invalid status. Use one of: Pending, In Progress, Completed, Cancelled (e.g. "in progress" works).'
    );
    return;
  }

  req.status = normalized;
  saveRequests(requests);
  renderAdminRequests();
  renderCustomerRequests();
  renderTechnicianRequests();
  renderAdminStats();
});

// إحصائيات بسيطة للأدمن
function renderAdminStats() {
  const users = loadArray(STORAGE_KEYS.users);
  const requests = loadRequests();
  const products = loadArray(STORAGE_KEYS.products);

  const customersCount = users.filter((u) => u.role === "customer").length;
  const techCount = users.filter((u) => u.role === "technician").length;
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const inProgressCount = requests.filter(
    (r) => r.status === "In Progress"
  ).length;
  const completedCount = requests.filter(
    (r) => r.status === "Completed"
  ).length;

  adminStatsContainer.innerHTML = "";

  const stats = [
    { label: "Customers", value: customersCount },
    { label: "Technicians", value: techCount },
    { label: "Products", value: products.length },
    { label: "Pending requests", value: pendingCount },
    { label: "In-progress requests", value: inProgressCount },
    { label: "Completed requests", value: completedCount },
  ];

  stats.forEach((s) => {
    const div = document.createElement("div");
    div.className = "stat-card";
    div.innerHTML = `
      <span class="stat-label">${s.label}</span>
      <span class="stat-value">${s.value}</span>
    `;
    adminStatsContainer.appendChild(div);
  });
}

// تشغيل التهيئة
initDemoData();
updateUIForRole();

