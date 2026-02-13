import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const userString = localStorage.getItem('user');

        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user && user.token) {
                    const tokenValue = `Bearer ${user.token}`;

                    // Direct assignment for older Axios
                    config.headers['Authorization'] = tokenValue;
                    config.headers['authorization'] = tokenValue;

                    // Support for newer Axios (AxiosHeaders object)
                    if (config.headers && typeof config.headers.set === 'function') {
                        config.headers.set('Authorization', tokenValue);
                        config.headers.set('authorization', tokenValue);
                    }
                }
            } catch (e) {
                console.error(`[API AUTH] Parse error`, e);
            }
        }
        return config;
    },
    (error) => {
        console.error('[API REQ ERROR]', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('401 Unauthorized at:', error.config.url);
            // Auto-logout if unauthorized (token expired/invalid)
            // localStorage.removeItem('user');
            // localStorage.removeItem('selectedClubId');
            // window.location.href = '/login';
            console.warn('Auto-logout suppressed to fix loop.');
        }
        return Promise.reject(error);
    }
);

export default api;
