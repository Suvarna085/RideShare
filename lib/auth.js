// File: /lib/auth.js
import jwt from 'jsonwebtoken';

// Secret key for JWT - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token for authenticated users
export function generateToken(user) {
  // Extract user data, excluding password
  const userData = user.toObject ? user.toObject() : { ...user };
  if (userData.password) delete userData.password;
  
  return jwt.sign(
    userData, 
    JWT_SECRET, 
    { expiresIn: '7d' }  // Token expires in 7 days
  );
}

// Verify JWT token
export const verifyToken = (token) => {
  try {
    if (!token) {
      console.error('No token provided');
      return null;
    }
    
    // Verify the token using the JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded); // Log what's inside the token
    
    // Check if we have something resembling a user ID (could be in different formats)
    if (!decoded || (!decoded.userId && !decoded.id && !decoded._id && !decoded.sub)) {
      console.error('Token does not contain user identifier');
      return null;
    }
    
    // If userId doesn't exist but another ID field does, normalize it
    if (!decoded.userId) {
      decoded.userId = decoded.id || decoded._id || decoded.sub;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Middleware to protect API routes
export function authMiddleware(handler) {
  return async (req, res) => {
    // Get token from authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Verify token
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Add user to request object
    req.user = user;
    
    // Call the original handler
    return handler(req, res);
  };
}