import axios from 'axios';

// Allow dynamic API URL configuration (e.g. for Ngrok)
const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    const storedUrl = localStorage.getItem('api_url');
    const baseUrl = envUrl || storedUrl || '/api';
    console.log("FINAL BASE URL:", baseUrl);
    // Remove trailing slash if present to avoid double slashes
    return baseUrl.replace(/\/$/, '');
};

const api = axios.create({
    baseURL: getBaseUrl(), // Root URL to support multiple apps (common, scheduler)
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        // Bypass Ngrok warning page for free tier
        'ngrok-skip-browser-warning': 'true',
    },
    paramsSerializer: (params) => {
        const parts: string[] = [];
        for (const key in params) {
            const val = params[key];
            if (Array.isArray(val)) {
                val.forEach(v => parts.push(`${key}=${encodeURIComponent(v)}`));
            } else if (val !== undefined && val !== null) {
                parts.push(`${key}=${encodeURIComponent(val)}`);
            }
        }
        return parts.join('&');
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.log("API Interceptor Error:", error.message, "Status:", error.response?.status);
        if (error.response?.status === 401) {
            // Check if we are already on the login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
