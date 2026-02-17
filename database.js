/**
 * database.js
 * Centralized API client for the Barangay Sibulan Portal.
 * This file has been refactored to communicate with a backend API instead of using LocalStorage.
 * The backend is responsible for connecting to the PostgreSQL database.
 */

class WebDatabase {
    constructor(apiUrl = '/api') {
        this.apiUrl = apiUrl;
    }

    async _fetch(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const config = { ...options, headers };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", { status: response.status, statusText: response.statusText, body: errorText });
                try {
                    const errorData = JSON.parse(errorText);
                    return { success: false, message: errorData.message || `API error: ${response.statusText}` };
                } catch (e) {
                    return { success: false, message: `An API error occurred (Status: ${response.status}). Check the developer console for details.` };
                }
            }
            if (response.status === 204) {
                return { success: true };
            }
            const data = await response.json();
            // For GET requests, return the data directly.
            // For other requests, the backend should return a success object.
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            return { success: false, message: error.message || 'Network or server error.' };
        }
    }

    // --- USER MANAGEMENT ---
    
    async getAllUsers() {
        const users = await this._fetch('/users', { method: 'GET' });
        return Array.isArray(users) ? users : [];
    }

    async register(username, password, role) {
        return this._fetch('/users/register', { method: 'POST', body: JSON.stringify({ username, password, role }) });
    }

    async login(username, password) {
        return this._fetch('/users/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    }

    async deleteUser(username) {
        return this._fetch(`/users/${username}`, { method: 'DELETE' });
    }

    async updatePassword(username, newPassword) {
        return this._fetch(`/users/${username}/password`, { method: 'PUT', body: JSON.stringify({ password: newPassword }) });
    }

    async toggleRole(username) {
        return this._fetch(`/users/${username}/role`, { method: 'PUT' });
    }

    // --- REQUESTS MANAGEMENT ---

    async getRequests() {
        const reqs = await this._fetch('/requests', { method: 'GET' });
        return Array.isArray(reqs) ? reqs : [];
    }

    async addRequest(req) {
        return this._fetch('/requests', { method: 'POST', body: JSON.stringify(req) });
    }

    async updateRequestStatus(id, status) {
        return this._fetch(`/requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    }

    async deleteRequest(id) {
        return this._fetch(`/requests/${id}`, { method: 'DELETE' });
    }

    // --- OFFICIALS MANAGEMENT ---

    async getOfficials() {
        const offs = await this._fetch('/officials', { method: 'GET' });
        return Array.isArray(offs) ? offs : [];
    }

    async addOfficial(data) {
        // Note: File uploads require special handling (e.g., FormData) on the backend.
        // This implementation assumes the image is sent as a data URL string.
        return this._fetch('/officials', { method: 'POST', body: JSON.stringify(data) });
    }

    async updateOfficial(id, data) {
        return this._fetch(`/officials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteOfficial(id) {
        return this._fetch(`/officials/${id}`, { method: 'DELETE' });
    }

    // --- SETTINGS ---

    async getFooter() {
        const settings = await this._fetch('/settings/footer', { method: 'GET' });
        // Check if it's a valid object and not an error response from _fetch
        if (settings && typeof settings === 'object' && settings.success !== false) {
            return settings;
        }
        return null;
    }
    
    async saveFooter(data) {
        return this._fetch('/settings/footer', { method: 'POST', body: JSON.stringify(data) });
    }
}

// Initialize the database instance globally
window.db = new WebDatabase();