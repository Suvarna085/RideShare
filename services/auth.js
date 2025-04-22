import axios from 'axios';
import jwt from 'jsonwebtoken';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Add verifyToken function used in the API route
export const verifyToken = (token) => {
  try {
    // Verify the token using the JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

export const registerUser = async (userData) => {
  try {
    const { name, email, password, role, additionalInfo } = userData;
    
    // Prepare payload to match what the backend expects
    const payload = {
      name,
      email,
      password,
      role,
      ...additionalInfo
    };
    
    console.log('Sending registration payload:', { ...payload, password: '***' });
    const response = await axios.post(`${API_URL}/auth/register`, payload);
    
    // Handle successful registration
    if (response.data && response.data.success) {
      return { success: true, user: response.data.user };
    } else {
      return { error: { message: response.data.message || 'Registration failed' } };
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle error responses from API
    if (error.response && error.response.data) {
      return { error: error.response.data };
    }
    
    // Generic error message
    return {
      error: {
        message: 'Unable to register. Please check your information and try again.'
      }
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data && response.data.token) {
      // Return token and user
      return { success: true, token: response.data.token, user: response.data.user };
    } else {
      return { success: false, error: { message: response.data.message || 'Login failed' } };
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // Add this return statement for error cases
    return { 
      success: false, 
      error: error.response?.data || { message: 'Login failed. Please try again.' } 
    };
  }
};
export const logout = () => {
  localStorage.removeItem('rideshareToken');
  localStorage.removeItem('rideshareUser');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('rideshareUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
};

export const isAuthenticated = () => {
  return localStorage.getItem('rideshareToken') !== null;
};

export const getAuthToken = () => {
  return localStorage.getItem('rideshareToken');
};

// Configure axios interceptors to include auth token with requests
axios.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const debugToken = () => {
  const token = localStorage.getItem('rideshareToken');
  if (!token) {
    console.log("No token found in localStorage");
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token contents:", decoded);
    console.log("User ID field exists:", !!decoded.userId);
    console.log("Alternative ID fields:", {
      id: !!decoded.id,
      _id: !!decoded._id,
      sub: !!decoded.sub
    });
  } catch (err) {
    console.error("Failed to decode token:", err);
  }
};
