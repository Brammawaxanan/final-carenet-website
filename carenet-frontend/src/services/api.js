// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || '1'; // Fallback to user ID 1 for testing

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(userId && { 'X-User-Id': userId }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        // Try to parse JSON error body for a cleaner message
        let parsedError = null;
        try { parsedError = JSON.parse(errorText); } catch (_) { /* ignore */ }
        const friendlyMessage = parsedError?.message || parsedError?.error || errorText || `HTTP ${response.status}`;
        console.warn(`API Error ${response.status} for ${endpoint}:`, friendlyMessage);
        
        // Return empty data structure for common endpoints instead of throwing
        if (endpoint.includes('/overview')) {
          return {
            tasks: [],
            ledger: [],
            counts: { total: 0, awaitingProof: 0, completed: 0, verified: 0 },
            progressPercent: 0,
            runningDueCents: 0
          };
        }
        if (endpoint.includes('/caregivers')) {
          console.warn('Caregivers endpoint failed, returning empty array');
          return { caregivers: [], isSubscribed: false };
        }
        if (endpoint.includes('/assignments/mine')) {
          return [];
        }
        
  const err = new Error(friendlyMessage);
  // attach HTTP status for callers to display
  err.status = response.status;
  err.statusText = response.statusText;
  throw err;
      }

      // handle empty response (204)
      if (response.status === 204) return null;

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);

      // If this was a low-level network/fetch error, wrap it with a clearer message
      if (error instanceof TypeError && error.message && error.message.includes('Failed to fetch')) {
        const netErr = new Error(`Network error contacting ${url}: ${error.message}`);
        netErr.status = null;
        console.error('🔌 Network error detected:', netErr.message);
        throw netErr;
      }

      // Return safe defaults for critical endpoints
      if (endpoint.includes('/overview')) {
        return {
          tasks: [],
          ledger: [],
          counts: { total: 0, awaitingProof: 0, completed: 0, verified: 0 },
          progressPercent: 0,
          runningDueCents: 0
        };
      }
      if (endpoint.includes('/caregivers')) {
        console.warn('Caregivers endpoint error, returning empty array');
        return { caregivers: [], isSubscribed: false };
      }
      if (endpoint.includes('/assignments/mine')) {
        return [];
      }
      if (endpoint.includes('/payments/history')) {
        console.warn('Payment history error, returning empty');
        return { payments: [], count: 0, userId: this.getUserId() };
      }
      if (endpoint.includes('/payments/upcoming')) {
        console.warn('Upcoming payments error, returning empty');
        return { upcomingPayments: [], count: 0, userId: this.getUserId() };
      }
      
      // If the error is a fetch/network error, ensure it includes a status when possible
      if (!error.status) {
        error.status = error.status || null;
      }
      throw error;
    }
  }

  // -------- HTTP Method Helpers --------
  
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // -------- Helper Methods --------
  getUserId() {
    return localStorage.getItem('userId') || '1';
  }

  // -------- User Context --------
  async getUserContext() {
    return this.request('/me/context');
  }

  // -------- Service & Caregivers --------
  async getCaregivers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/service/caregivers${queryString ? `?${queryString}` : ''}`);
  }

  async getCaregiverProfile(id) {
    return this.request(`/service/caregivers/${id}`);
  }

  async createServiceRequest(requestData) {
    return this.request('/service/request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async createBooking(bookingData) {
    return this.request('/service/book', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getMyAssignments(active = null) {
    const params = active !== null ? { active } : {};
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/service/assignments/mine${queryString ? `?${queryString}` : ''}`);
  }

  async getMyCaregiverAssignments(active = null) {
    const params = active !== null ? { active } : {};
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/service/assignments/caregiver/mine${queryString ? `?${queryString}` : ''}`);
  }

  // -------- Dashboard --------
  async getDashboard() {
    return this.request('/dashboard/user');
  }

  // -------- Activity & Tasks --------
  async getActivityOverview(assignmentId) {
    return this.request(`/activity/${assignmentId}/overview`);
  }

  async getTasks(assignmentId) {
    return this.request(`/activity/${assignmentId}/tasks`);
  }

  async createTask(taskData) {
    return this.request('/activity/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId, taskData) {
    return this.request(`/activity/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(taskId) {
    return this.request(`/activity/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async completeTask(taskId) {
    return this.request(`/activity/tasks/${taskId}/complete`, {
      method: 'POST',
    });
  }

  async verifyTask(taskId) {
    return this.request(`/activity/tasks/${taskId}/verify`, {
      method: 'POST',
    });
  }

  async uploadTaskProof(taskId, formData) {
    const url = `${API_BASE_URL}/activity/tasks/${taskId}/proof`;
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || '1';

    console.log('📤 Uploading proof for task:', taskId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'X-User-Id': userId,
        // DO NOT set Content-Type - let browser set it with boundary for multipart/form-data
      },
      body: formData, // Send FormData directly, not JSON
    });

    console.log('📡 Upload response:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('❌ Proof upload failed (JSON):', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        console.error('❌ Proof upload failed (Text):', errorText);
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`Upload failed (${response.status}): ${errorMessage}`);
    }

    const result = await response.json();
    console.log('✅ Proof uploaded successfully:', result);
    return result;
  }

  // Upload caregiver documents (ID, certificates, etc.)
  async uploadCaregiverDocuments(userId, formData) {
    // Assumes backend endpoint exists at /profile/caregiver/documents that accepts multipart/form-data
    const url = `${API_BASE_URL}/profile/caregiver/documents`;
    const token = localStorage.getItem('token');
    const uid = userId || localStorage.getItem('userId') || '';

    console.log('📤 Uploading caregiver documents for user:', uid);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(uid && { 'X-User-Id': uid }),
        // DO NOT set Content-Type for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      throw new Error(`Document upload failed (${response.status}): ${errorMessage}`);
    }

    const result = await response.json();
    console.log('✅ Caregiver documents uploaded:', result);
    return result;
  }

  // -------- Assignment Lifecycle --------
  async startAssignment(assignmentId) {
    return this.request(`/activity/${assignmentId}/start`, { method: 'POST' });
  }

  async completeAssignment(assignmentId) {
    return this.request(`/activity/${assignmentId}/complete`, { method: 'POST' });
  }

  // -------- Dashboards --------
  async getUserDashboard() {
    return this.request('/dashboard/user');
  }

  async getCaregiverDashboard() {
    return this.request('/dashboard/caregiver');
  }

  async getAdminDashboard() {
    return this.request('/dashboard/admin');
  }

  // Admin: list caregivers
  async listCaregiversAdmin() {
    return this.request('/admin/caregivers');
  }

  async getCaregiverDocuments(caregiverId) {
    return this.request(`/admin/caregivers/${caregiverId}/documents`);
  }

  async approveCaregiverDocument(documentId, adminName) {
    return this.request(`/admin/caregivers/documents/${documentId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminName })
    });
  }

  // -------- Profiles --------
  async getUserProfile() {
    return this.request('/profile/user');
  }

  async updateUserProfile(profileData) {
    return this.request('/profile/user', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getMyCaregiverProfile() {
    return this.request('/profile/caregiver');
  }

  async updateCaregiverProfile(profileData) {
    return this.request('/profile/caregiver', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // -------- Payments --------
  async processPayment(paymentData) {
    // Legacy method - kept for backward compatibility
    return this.request('/payment/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async confirmPayment(bookingId, paymentData) {
    return this.request(`/api/payments/confirm/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getBillingHistory(userId = null) {
    const query = userId ? `?userId=${userId}` : '';
    return this.request(`/api/payments/history${query}`);
  }

  async getUpcomingPayments(userId = null) {
    const query = userId ? `?userId=${userId}` : '';
    return this.request(`/api/payments/upcoming${query}`);
  }

  async getInvoice(transactionId) {
    // Legacy method - maps to receipt download
    return this.request(`/api/payments/receipt/${transactionId}`);
  }

  async downloadReceipt(paymentId) {
    return `${this.baseURL}/api/payments/receipt/${paymentId}`;
  }

  async refundPayment(paymentId, reason) {
    return this.request(`/api/payments/refund/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Get payment summary for a booking (Activity page)
  async getPaymentSummary(bookingId) {
    return this.request(`/api/payments/summary?bookingId=${bookingId}`);
  }

  // Resend receipt email
  async resendReceipt(paymentId) {
    return this.request(`/api/payments/resend-receipt/${paymentId}`, {
      method: 'POST',
    });
  }

  // -------- Reports --------
  async getUserActivityReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/user-activity${queryString ? `?${queryString}` : ''}`);
  }

  // -------- Reviews & Ratings --------
  async getReviews(userId = null) {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request(`/reviews${query}`);
  }

  async submitReview(reviewData) {
    // reviewData: { assignmentId, rating, comment }
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async updateReview(reviewId, reviewData) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async deleteReview(reviewId) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }

  async getCaregiverPerformanceReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/caregiver-performance${queryString ? `?${queryString}` : ''}`);
  }

  async getFinancialSummaryReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/financial-summary${queryString ? `?${queryString}` : ''}`);
  }

  async getAssignmentAnalyticsReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/assignment-analytics${queryString ? `?${queryString}` : ''}`);
  }

  async exportReport(reportType, format, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports/export/${reportType}/${format}${queryString ? `?${queryString}` : ''}`);
  }

  // -------- Subscription --------
  async activateSubscription(subscriptionData) {
    return this.request('/subscribe/activate', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  async subscribe(subscriptionData) {
    console.log('API: Subscribing with data:', subscriptionData);
    console.log('API: Full URL:', `${this.baseURL}/subscribe`);
    try {
      const result = await this.request('/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });
      console.log('API: Subscribe result:', result);
      return result;
    } catch (error) {
      console.error('API: Subscribe error:', error);
      throw error;
    }
  }

  async cancelSubscription() {
    console.log('API: Cancelling subscription');
    try {
      const result = await this.request('/subscribe/cancel', {
        method: 'POST',
      });
      console.log('API: Cancel subscription result:', result);
      return result;
    } catch (error) {
      console.error('API: Cancel subscription error:', error);
      throw error;
    }
  }


  // -------- Reports --------
  async generateUserReport(userId) {
    const url = `${API_BASE_URL}/reports/users/${userId}`;
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId') || '1';

    console.log('🔍 API: Requesting user report:', {
      url,
      userId,
      currentUserId,
      hasToken: !!token
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'X-User-Id': currentUserId,
      },
    });

    console.log('📡 API: Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API: Report generation failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to generate report (${response.status}): ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ API: Report blob received:', blob.size, 'bytes');
    return blob;
  }

  async generateCaregiverReport(caregiverId) {
    const url = `${API_BASE_URL}/reports/caregivers/${caregiverId}`;
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId') || '1';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'X-User-Id': currentUserId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return response.blob();
  }

  async generateTaskReport(assignmentId) {
    const url = `${API_BASE_URL}/reports/assignments/${assignmentId}`;
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId') || '1';

    console.log('🔍 API: Requesting assignment task report:', {
      url,
      assignmentId,
      currentUserId
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'X-User-Id': currentUserId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API: Task report generation failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to generate task report (${response.status}): ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ API: Task report blob received:', blob.size, 'bytes');
    return blob;
  }

  // -------- Caregiver Application --------
  async applyCaregiver(applicationData) {
    // applicationData: plain object
    return this.request('/api/caregivers/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async applyCaregiverWithFiles(userId, formData) {
    // formData: instance of FormData
    const url = `${API_BASE_URL}/api/caregivers/apply-with-files`;
    const token = localStorage.getItem('token');
    const uid = userId || localStorage.getItem('userId') || '';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(uid && { 'User-ID': uid }),
        // DO NOT set Content-Type for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }

    return await response.json();
  }

  // ============ Authentication ============
  
  async login(credentials) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // Check if response contains error (even if status was 200)
      if (response.error || response.requiresVerification) {
        const err = new Error(response.message || response.error);
        err.status = response.requiresVerification ? 403 : 401;
        err.requiresVerification = response.requiresVerification;
        err.email = response.email;
        err.userId = response.userId;
        throw err;
      }
      
      // Store auth data in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('userRole', response.role);
        localStorage.setItem('userName', response.name);
        localStorage.setItem('isSubscribed', response.isSubscribed || response.isPremium);
        
        console.log('✅ Login successful:', {
          email: credentials.email,
          role: response.role,
          userId: response.userId
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login error:', error.message);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      // Store auth data if token is returned (auto-login after registration)
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('userRole', response.role);
        localStorage.setItem('userName', response.name);
        localStorage.setItem('isSubscribed', response.isSubscribed || response.isPremium || false);
        
        console.log('✅ Registration successful (auto-login):', {
          email: userData.email,
          role: response.role,
          userId: response.userId
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      throw error;
    }
  }

  // ============ Email Verification (OTP) ==========
  async sendOtp({ email }) {
    // Try backend endpoint first; if unavailable, fallback to mock in DEV
    try {
      return await this.request('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.warn('sendOtp failed, falling back to mock in DEV:', err.message);
      if (import.meta.env.DEV) {
        // Mock: pretend OTP was sent
        return { success: true };
      }
      throw err;
    }
  }

  async verifyOtp({ email, otp }) {
    try {
      return await this.request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code: otp }),
      });
    } catch (err) {
      console.warn('verifyOtp failed, falling back to mock in DEV:', err.message);
      if (import.meta.env.DEV) {
        // Mock verification: accept common test codes
        const okCodes = ['0000', '1111', '1234', '000000', '123456'];
        if (okCodes.includes(otp)) return { verified: true, success: true };
        return { verified: false, success: false };
      }
      throw err;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
      
      this.clearAuthData();
      console.log('✅ Logout successful');
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear auth data anyway
      this.clearAuthData();
      throw error;
    }
  }

  // ============ Token Management ============
  
  getToken() {
    return localStorage.getItem('token');
  }

  getUserId() {
    return localStorage.getItem('userId');
  }

  getUserRole() {
    return localStorage.getItem('userRole');
  }

  getUserName() {
    return localStorage.getItem('userName');
  }

  getSubscriptionStatus() {
    return localStorage.getItem('isSubscribed') === 'true';
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('isSubscribed');
    localStorage.removeItem('userCurrentAssignmentId');
    console.log('🔓 Auth data cleared');
  }

  // ============ CARD MANAGEMENT ============

  /**
   * Get all saved cards for a user
   * GET /api/cards/user/{userId}
   */
  async getUserCards(userId) {
    return this.get(`/api/cards/user/${userId}`);
  }

  /**
   * Save a new card
   * POST /api/cards/save
   */
  async saveCard(userId, cardData) {
    const payload = {
      userId: userId,
      cardHolder: cardData.cardHolder,
      cardNumber: cardData.cardNumber,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      cvv: cardData.cvv,
      setAsDefault: cardData.setAsDefault || false
    };
    return this.post('/api/cards/save', payload);
  }

  /**
   * Delete a saved card
   * DELETE /api/cards/{cardId}?userId={userId}
   */
  async deleteCard(userId, cardId) {
    return this.delete(`/api/cards/${cardId}?userId=${userId}`);
  }

  /**
   * Set a card as default
   * PUT /api/cards/{cardId}/set-default?userId={userId}
   */
  async setDefaultCard(userId, cardId) {
    return this.put(`/api/cards/${cardId}/set-default?userId=${userId}`, {});
  }

  // ============ ENHANCED PAYMENT METHODS ============

  /**
   * Process Credit Card Payment
   * POST /api/payments/credit-card/{bookingId}
   */
  async processCreditCardPayment(bookingId, paymentData, userId) {
    const endpoint = `/api/payments/credit-card/${bookingId}`;
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(paymentData),
      headers: {
        'X-User-Id': userId || this.getUserId()
      }
    });
  }

  /**
   * Process Bank Transfer Payment
   * POST /api/payments/bank-transfer/{bookingId}
   */
  async processBankTransferPayment(bookingId, paymentData, userId) {
    const endpoint = `/api/payments/bank-transfer/${bookingId}`;
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(paymentData),
      headers: {
        'X-User-Id': userId || this.getUserId()
      }
    });
  }

  /**
   * Process COD Payment
   * POST /api/payments/cod/{bookingId}
   */
  async processCODPayment(bookingId, paymentData, userId) {
    const endpoint = `/api/payments/cod/${bookingId}`;
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(paymentData),
      headers: {
        'X-User-Id': userId || this.getUserId()
      }
    });
  }

  /**
   * Generic POST helper with userId
   */
  async post(endpoint, data, userId) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'X-User-Id': userId || this.getUserId()
      }
    });
  }

  /**
   * POST helper for multipart/form-data (file uploads)
   */
  async postMultipart(endpoint, formData, userId) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const uid = userId || localStorage.getItem('userId') || '1';

    const config = {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'X-User-Id': uid
        // Note: Don't set Content-Type for FormData, browser sets it automatically with boundary
      }
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = null;
        try { parsedError = JSON.parse(errorText); } catch (_) { /* ignore */ }
        const friendlyMessage = parsedError?.message || parsedError?.error || errorText || `HTTP ${response.status}`;
        console.warn(`API Error ${response.status} for ${endpoint}:`, friendlyMessage);
        
        const err = new Error(friendlyMessage);
        err.status = response.status;
        err.statusText = response.statusText;
        throw err;
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      console.error(`API multipart request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // -------- Admin Task Management --------
  async getAdminTasks() {
    return this.request('/admin/tasks');
  }

  async getAdminTaskById(taskId) {
    return this.request(`/admin/tasks/${taskId}`);
  }

  async createAdminTask(taskData) {
    return this.request('/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  async updateAdminTask(taskId, taskData) {
    return this.request(`/admin/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  }

  async deleteAdminTask(taskId) {
    return this.request(`/admin/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }

  async getAdminClients() {
    return this.request('/admin/clients');
  }

  async getAdminCaregivers() {
    return this.request('/admin/caregivers');
  }
}

export default new ApiService();