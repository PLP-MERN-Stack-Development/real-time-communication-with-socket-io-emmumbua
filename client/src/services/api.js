import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || error.message || 'Something went wrong with the request';
    return Promise.reject(new Error(message));
  }
);

export default api;

