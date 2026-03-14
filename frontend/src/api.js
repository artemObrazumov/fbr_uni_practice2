
import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post('http://localhost:3001/api/auth/refresh', { refreshToken });
                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);
                apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
                return apiClient(originalRequest);
            } catch (err) {
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
