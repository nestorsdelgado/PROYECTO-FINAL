import axios from 'axios';
import authService from './auth.service';

// Request interceptor for API calls
axios.interceptors.request.use(
    config => {
        const token = authService.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
axios.interceptors.response.use(
    response => {
        return response;
    },
    async error => {
        const originalRequest = error.config;

        // If the error is 401 Unauthorized and not already retrying
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Clear user data on auth error
            authService.logout();

            // You could redirect to login page here if needed
            // window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default axios;