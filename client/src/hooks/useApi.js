import { useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Custom hook for making API calls with consistent error handling
 * @returns {Object} API methods
 */
export const useApi = () => {
    /**
     * Get the authorization header with JWT token
     */
    const getAuthHeader = useCallback(() => {
        const token = localStorage.getItem('usertoken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }, []);

    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} options - Additional fetch options
     */
    const get = useCallback(async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error(`GET ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }, [getAuthHeader]);

    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} body - Request body
     * @param {Object} options - Additional fetch options
     */
    const post = useCallback(async (endpoint, body, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                    ...options.headers
                },
                body: JSON.stringify(body),
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error(`POST ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }, [getAuthHeader]);

    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} body - Request body
     * @param {Object} options - Additional fetch options
     */
    const put = useCallback(async (endpoint, body, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                    ...options.headers
                },
                body: JSON.stringify(body),
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error(`PUT ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }, [getAuthHeader]);

    /**
     * Make a PATCH request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} body - Request body
     * @param {Object} options - Additional fetch options
     */
    const patch = useCallback(async (endpoint, body, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                    ...options.headers
                },
                body: JSON.stringify(body),
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error(`PATCH ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }, [getAuthHeader]);

    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} options - Additional fetch options
     */
    const del = useCallback(async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error(`DELETE ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }, [getAuthHeader]);

    /**
     * Upload a file
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {FormData} formData - Form data with file
     * @param {Object} options - Additional fetch options
     */
    const uploadFile = useCallback(async (endpoint, formData, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                    ...options.headers
                },
                body: formData,
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Upload failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error(`UPLOAD ${endpoint} error:`, error);
            return { success: false, error: error.message };
        }
    }, [getAuthHeader]);

    return {
        get,
        post,
        put,
        patch,
        delete: del,
        uploadFile,
        getAuthHeader,
        API_BASE_URL
    };
};

export default useApi;
