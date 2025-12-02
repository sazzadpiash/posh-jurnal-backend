import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return null;
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Log specific error for debugging
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Invalid token format');
    } else {
      console.error('Token verification error:', error.message);
    }
    return null;
  }
};

