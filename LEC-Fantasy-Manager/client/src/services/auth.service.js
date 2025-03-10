import axios from "axios";

const API_URL = process.env.REACT_APP_SERVER_URL;

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Register user
  async register(username, email, password, name) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        name: name || username, // Use name or fallback to username
        email,
        password,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem("token");
  }
}

export default new AuthService();