// API Helper Functions

const API_URL = window.location.origin;

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Get user role from localStorage
function getUserRole() {
    return localStorage.getItem('userRole');
}

// Set authentication data
function setAuth(token, role) {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
}

// Clear authentication data
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
}

// Generic API call function
async function apiCall(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (requiresAuth) {
        const token = getToken();
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Auth API calls
async function loginCustomer(username, password) {
    return apiCall('/api/customer/login', 'POST', { username, password }, false);
}

async function loginAdmin(username, password) {
    return apiCall('/api/admin/login', 'POST', { username, password }, false);
}

// Customer API calls
async function getCustomerProducts() {
    return apiCall('/api/customer/products');
}

async function updateOrder(productId, orderAmount) {
    return apiCall('/api/orders/update', 'POST', { productId, orderAmount });
}

async function updateAllDrafts(orders) {
    return apiCall('/api/orders/update-all', 'POST', { orders });
}

async function submitAllOrders(orders) {
    return apiCall('/api/orders/submit-all', 'POST', { orders });
}

async function getCustomerOrderHistory() {
    return apiCall('/api/customer/order-history');
}

async function updateCustomerPassword(currentPassword, newPassword) {
    return apiCall('/api/customer/password', 'PUT', { currentPassword, newPassword });
}

// Admin API calls
async function getAdminProducts() {
    return apiCall('/api/admin/products');
}

async function getAllCustomers() {
    return apiCall('/api/admin/customers');
}

async function addCustomer(username, password, companyName, contactPerson) {
    return apiCall('/api/admin/customers', 'POST', { username, password, companyName, contactPerson });
}

async function updateCustomer(id, data) {
    return apiCall(`/api/admin/customers/${id}`, 'PUT', data);
}

async function deleteCustomer(id) {
    return apiCall(`/api/admin/customers/${id}`, 'DELETE');
}

async function addProduct(customerId, sku, name, price, unit) {
    return apiCall('/api/admin/products', 'POST', { customerId, sku, name, price, unit });
}

async function getCustomerProducts(customerId) {
    return apiCall(`/api/admin/products/customer/${customerId}`);
}

async function updateProduct(id, data) {
    return apiCall(`/api/admin/products/${id}`, 'PUT', data);
}

async function deleteProduct(id) {
    return apiCall(`/api/admin/products/${id}`, 'DELETE');
}

async function getMasterProducts() {
    return apiCall('/api/admin/manage-products');
}

async function addMasterProduct(sku, name, price, unit) {
    return apiCall('/api/admin/manage-products', 'POST', { sku, name, price, unit });
}

async function updateMasterProduct(id, data) {
    return apiCall(`/api/admin/manage-products/${id}`, 'PUT', data);
}

async function deleteMasterProduct(id) {
    return apiCall(`/api/admin/manage-products/${id}`, 'DELETE');
}

async function getOrderHistory(customerId) {
    return apiCall(`/api/admin/order-history/${customerId}`);
}

async function archiveOrder(customerId, submittedAt) {
    return apiCall(`/api/admin/archive-order/${customerId}/${encodeURIComponent(submittedAt)}`, 'POST');
}

async function changeAdminPassword(currentPassword, newPassword) {
    return apiCall('/api/admin/change-password', 'PUT', { currentPassword, newPassword });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getToken,
        getUserRole,
        setAuth,
        clearAuth,
        loginCustomer,
        loginAdmin,
        getCustomerProducts,
        updateOrder,
        updateAllDrafts,
        submitAllOrders,
        getCustomerOrderHistory,
        updateCustomerPassword,
        getAdminProducts,
        getAllCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        getMasterProducts,
        addMasterProduct,
        updateMasterProduct,
        deleteMasterProduct,
        getOrderHistory,
        archiveOrder,
        changeAdminPassword
    };
}
