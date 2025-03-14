import axios from "axios";

//const API_URL = process.env.REACT_APP_SERVER_URL;
const API_URL = process.env.REACT_APP_SERVER_URL || "https://your-api-url.com";

// Create an instance of axios
const api = axios.create({
  baseURL: API_URL
});

// Add a request interceptor
api.interceptors.request.use(
  config => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 responses (unauthorized)
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized request detected");
      // You can add additional logic here (e.g., redirect to login)
    }
    return Promise.reject(error);
  }
);

export default api;