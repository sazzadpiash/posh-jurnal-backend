import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    // Get token from cookie OR Authorization header (for mobile fallback)
    let token = req.cookies.token;
    
    // Fallback to Authorization header if cookie is not present (mobile browsers)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('Token verification failed: Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.error(`User not found for token: ${decoded.userId}`);
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

