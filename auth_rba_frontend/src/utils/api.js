import axios from 'axios';

// Set the base URL to where your FastAPI microservice is running
const apiClient = axios.create({
  baseURL: 'http://localhost:8002', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject the JWT token into every authenticated request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default apiClient;
