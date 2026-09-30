/**
 * Drinko Centralized Frontend API Client
 * Manages HTTP requests, JWT token storage, error handling, and session state.
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.DRINKO_API_URL) return window.DRINKO_API_URL.replace(/\/+$/, '');
    try {
      const stored = localStorage.getItem('drinko_api_url');
      if (stored) return stored.replace(/\/+$/, '');
    } catch (e) {}
    if (window.location.origin.startsWith('http')) {
      return `${window.location.origin}/api`;
    }
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const DrinkoAPI = {
  // Token management
  getToken() {
    return localStorage.getItem('drinko_token') || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('drinko_token', token);
    } else {
      localStorage.removeItem('drinko_token');
    }
  },

  // Base request handler
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type if sending FormData (browser sets boundary automatically)
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If unauthorized and has expired token, clear it
        if (response.status === 401 && token) {
          this.setToken(null);
          localStorage.removeItem('drinko_current_user');
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[DrinkoAPI] Error at ${endpoint}:`, err.message);
      throw err;
    }
  },

  // HTTP Shortcuts
  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  },

  // ------------------------------------------------------------------------
  // Auth API
  // ------------------------------------------------------------------------
  auth: {
    async register(data) {
      const res = await DrinkoAPI.post('/auth/register', data);
      if (res.token) DrinkoAPI.setToken(res.token);
      return res;
    },

    async login(email, password) {
      const res = await DrinkoAPI.post('/auth/login', { email, password });
      if (res.token) DrinkoAPI.setToken(res.token);
      return res;
    },

    async logout() {
      DrinkoAPI.setToken(null);
      try {
        await DrinkoAPI.post('/auth/logout', {});
      } catch (e) {}
    },

    getMe() {
      return DrinkoAPI.get('/auth/me');
    },

    forgotPassword(email) {
      return DrinkoAPI.post('/auth/forgot-password', { email });
    },

    async resetPassword(tokenOrPayload, password, confirmPassword, email) {
      let body;
      let endpoint = '/auth/reset-password';

      if (typeof tokenOrPayload === 'object' && tokenOrPayload !== null) {
        body = tokenOrPayload;
      } else {
        body = {
          code: tokenOrPayload,
          password: password,
          confirmPassword: confirmPassword,
          email: email
        };
        endpoint = `/auth/reset-password/${tokenOrPayload}`;
      }

      const res = await DrinkoAPI.put(endpoint, body);
      return res;
    }
  },

  // ------------------------------------------------------------------------
  // Profile API
  // ------------------------------------------------------------------------
  profile: {
    get() {
      return DrinkoAPI.get('/profile');
    },

    update(data) {
      return DrinkoAPI.put('/profile', data);
    },

    changePassword(currentPassword, newPassword, confirmPassword) {
      return DrinkoAPI.put('/profile/password', { currentPassword, newPassword, confirmPassword });
    },

    uploadAvatar(formData) {
      return DrinkoAPI.post('/profile/avatar', formData);
    },

    deleteAvatar() {
      return DrinkoAPI.delete('/profile/avatar');
    },

    getAddresses() {
      return DrinkoAPI.get('/profile/addresses');
    },

    addAddress(addressData) {
      return DrinkoAPI.post('/profile/addresses', addressData);
    },

    updateAddress(id, addressData) {
      return DrinkoAPI.put(`/profile/addresses/${id}`, addressData);
    },

    deleteAddress(id) {
      return DrinkoAPI.delete(`/profile/addresses/${id}`);
    },

    setDefaultAddress(id) {
      return DrinkoAPI.put(`/profile/addresses/${id}/default`, {});
    },

    getFavourites() {
      return DrinkoAPI.get('/profile/favourites');
    },

    addFavourite(productId) {
      return DrinkoAPI.post(`/profile/favourites/${productId}`, {});
    },

    removeFavourite(productId) {
      return DrinkoAPI.delete(`/profile/favourites/${productId}`);
    },

    getLoyalty() {
      return DrinkoAPI.get('/profile/loyalty');
    },

    updatePreferences(preferences) {
      return DrinkoAPI.put('/profile/preferences', preferences);
    },

    updateNotifications(notifications) {
      return DrinkoAPI.put('/profile/notifications', notifications);
    },

    deleteAccount(password) {
      return DrinkoAPI.request('/profile/account', {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
    }
  },

  // ------------------------------------------------------------------------
  // Products & Menu API
  // ------------------------------------------------------------------------
  products: {
    getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      return DrinkoAPI.get(`/products${query ? `?${query}` : ''}`);
    },

    getById(id) {
      return DrinkoAPI.get(`/products/${id}`);
    },

    getByCategory(category) {
      return DrinkoAPI.get(`/products/category/${category}`);
    }
  },

  // ------------------------------------------------------------------------
  // Categories API
  // ------------------------------------------------------------------------
  categories: {
    getAll() {
      return DrinkoAPI.get('/categories');
    }
  },

  // ------------------------------------------------------------------------
  // Orders API
  // ------------------------------------------------------------------------
  orders: {
    create(orderData) {
      return DrinkoAPI.post('/orders', orderData);
    },

    getMyOrders() {
      return DrinkoAPI.get('/orders/my-orders');
    },

    getById(id) {
      return DrinkoAPI.get(`/orders/${id}`);
    },

    cancel(id) {
      return DrinkoAPI.put(`/orders/${id}/cancel`, {});
    },

    reorder(id) {
      return DrinkoAPI.post(`/orders/${id}/reorder`, {});
    }
  },

  // ------------------------------------------------------------------------
  // Coupons API
  // ------------------------------------------------------------------------
  coupons: {
    validate(code, subtotal) {
      return DrinkoAPI.post('/coupons/validate', { code, subtotal });
    }
  },

  // ------------------------------------------------------------------------
  // Payments API
  // ------------------------------------------------------------------------
  payments: {
    getPaytmConfig() {
      return DrinkoAPI.get('/payment/paytm-config');
    },

    initiatePaytmUpi(orderId) {
      return DrinkoAPI.post('/payment/paytm-upi/initiate', { orderId });
    },

    submitPaytmUtr(orderId, utr, payerVpa = '') {
      return DrinkoAPI.post('/payment/paytm-upi/submit-utr', { orderId, utr, payerVpa });
    },

    updatePaytmSettings(settings) {
      return DrinkoAPI.put('/payment/paytm-settings', settings);
    },

    createOrder(orderId) {
      return DrinkoAPI.post('/payment/create-order', { orderId });
    },

    verify(paymentData) {
      return DrinkoAPI.post('/payment/verify', paymentData);
    }
  },

  // ------------------------------------------------------------------------
  // Reviews API
  // ------------------------------------------------------------------------
  reviews: {
    getAll(category) {
      const query = category && category !== 'all' ? `?category=${category}` : '';
      return DrinkoAPI.get(`/reviews${query}`);
    },

    submit(reviewData) {
      return DrinkoAPI.post('/reviews', reviewData);
    }
  },

  // ------------------------------------------------------------------------
  // Tables / QR Dining API
  // ------------------------------------------------------------------------
  tables: {
    getByNumber(tableNumber) {
      return DrinkoAPI.get(`/tables/${tableNumber}`);
    }
  },

  // ------------------------------------------------------------------------
  // Admin API
  // ------------------------------------------------------------------------
  admin: {
    getOverview() {
      return DrinkoAPI.get('/admin/overview');
    },

    getOrders(params = {}) {
      const query = new URLSearchParams(params).toString();
      return DrinkoAPI.get(`/admin/orders${query ? `?${query}` : ''}`);
    },

    updateOrderStatus(orderId, status, note) {
      return DrinkoAPI.put(`/admin/orders/${orderId}/status`, { status, note });
    },

    getKitchenOrders() {
      return DrinkoAPI.get('/admin/kitchen');
    },

    getAnalytics() {
      return DrinkoAPI.get('/admin/analytics');
    },

    getCustomers() {
      return DrinkoAPI.get('/admin/customers');
    },

    getInventory() {
      return DrinkoAPI.get('/inventory');
    },

    updateInventory(id, data) {
      return DrinkoAPI.put(`/inventory/${id}`, data);
    },

    getCoupons() {
      return DrinkoAPI.get('/coupons/admin');
    },

    createCoupon(data) {
      return DrinkoAPI.post('/coupons/admin', data);
    }
  }
};

window.DrinkoAPI = DrinkoAPI;
