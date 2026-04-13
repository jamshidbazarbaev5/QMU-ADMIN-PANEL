import axios from 'axios';

// Create axios instance with base configuration
const api2 = axios.create({
  baseURL: 'https://karsu.uz/api',
  headers: {
    // 'Content-Type': 'application/json',
  },
});

// Add these helper functions at the top of the file
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiryTime;
  } catch {
    return true;
  }
};

const shouldRefreshToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    // Refresh if token will expire in less than 5 minutes
    return (expiryTime - Date.now()) < 5 * 60 * 1000;
  } catch {
    return true;
  }
};

// Modify the request interceptor
api2.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      if (isTokenExpired(token)) {
        // Token is expired, try to refresh
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post('https://karsu.uz/api/token/refresh/', {
            refresh: refreshToken
          });

          const { access } = response.data;
          localStorage.setItem('accessToken', access);
          config.headers.Authorization = `Bearer ${access}`;
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/karsu-admin-panel/login';
          return Promise.reject(error);
        }
      } else if (shouldRefreshToken(token)) {
        // Token will expire soon, refresh in background
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            axios.post('https://karsu.uz/api/token/refresh/', {
              refresh: refreshToken
            }).then(response => {
              localStorage.setItem('accessToken', response.data.access);
            });
          }
        } catch (error) {
          console.error('Background token refresh failed:', error);
        }
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api2.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('https://karsu.uz/api/token/refresh/', {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api2(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Redirect to login or handle authentication error
        window.location.href = '/karsu-admin-panel/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api2;