// Authentication Module

// Handle customer login
async function handleCustomerLogin(event) {
    event.preventDefault();

    const username = document.getElementById('customer-login-username').value;
    const password = document.getElementById('customer-login-password').value;

    try {
        const response = await loginCustomer(username, password);

        setAuth(response.token, 'customer');

        // Store customer info
        localStorage.setItem('customerInfo', JSON.stringify(response.customer));

        // Show customer dashboard
        window.location.reload();
    } catch (error) {
        showMessage('customerLoginMessage', error.message || 'Login failed', 'error');
    }
}

// Handle admin login
async function handleAdminLogin(event) {
    event.preventDefault();

    const username = document.getElementById('admin-login-username').value;
    const password = document.getElementById('admin-login-password').value;

    try {
        const response = await loginAdmin(username, password);

        setAuth(response.token, 'admin');

        // Show admin dashboard
        window.location.reload();
    } catch (error) {
        showMessage('adminLoginMessage', error.message || 'Login failed', 'error');
    }
}

// Logout
function logout() {
    clearAuth();
    localStorage.removeItem('customerInfo');
    window.location.reload();
}

// Check if user is authenticated
function checkAuth() {
    const token = getToken();
    const role = getUserRole();

    return { token, role, isAuthenticated: !!token };
}

// Redirect if not authenticated
function requireAuth(allowedRole) {
    const { token, role } = checkAuth();

    if (!token) {
        window.location.href = '/';
        return false;
    }

    if (allowedRole && role !== allowedRole) {
        window.location.href = '/';
        return false;
    }

    return true;
}

// Switch tabs (for login page)
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
}

// Initialize authentication on page load
function initAuth() {
    const { token, role, isAuthenticated } = checkAuth();

    if (!isAuthenticated) {
        // Show login page
        document.getElementById('authSection')?.classList.remove('d-none');
        document.getElementById('customerDashboard')?.classList.add('d-none');
        document.getElementById('adminDashboard')?.classList.add('d-none');
    } else {
        // Hide login, show appropriate dashboard
        document.getElementById('authSection')?.classList.add('d-none');

        if (role === 'customer') {
            document.getElementById('customerDashboard')?.classList.remove('d-none');
        } else if (role === 'admin') {
            document.getElementById('adminDashboard')?.classList.remove('d-none');
        }
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleCustomerLogin,
        handleAdminLogin,
        logout,
        checkAuth,
        requireAuth,
        switchTab,
        initAuth
    };
}
