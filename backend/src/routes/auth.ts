import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { authenticateToken, requireEmailVerification } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse, JWTPayload } from '../types';
import { emailService } from '../services/emailService';

const router = express.Router();

// Register
router.post('/register', validate(schemas.createUser), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role, dateOfBirth, address, emergencyContact } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address,
      emergencyContact
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true
    }
  });

  // Generate email verification token
  const verificationToken = uuidv4();
  
  // Store verification token (you might want to create a separate table for this)
  // For now, we'll use a simple approach with environment variables or a separate service

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  const response: ApiResponse = {
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: user
  };

  res.status(201).json(response);
}));

// Login
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      providerProfile: true,
      familyProfile: true,
      schoolProfile: true
    }
  });

  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError('Invalid credentials', 401);
  }

  // Check if user is active
  if (user.status === 'SUSPENDED') {
    throw createError('Account suspended', 403);
  }

  // Generate JWT token
  const tokenPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  const response: ApiResponse = {
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  };

  res.json(response);
}));

// Verify email
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw createError('Verification token required', 400);
  }

  // In a real implementation, you'd verify the token from your database
  // For now, we'll simulate verification
  const user = await prisma.user.findFirst({
    where: {
      email: 'user@example.com' // This would be extracted from the token
    }
  });

  if (!user) {
    throw createError('Invalid verification token', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Email verified successfully'
  };

  res.json(response);
}));

// Resend verification email
router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError('Email required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.emailVerified) {
    throw createError('Email already verified', 400);
  }

  // Generate new verification token
  const verificationToken = uuidv4();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw createError('Failed to send verification email', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Verification email sent'
  };

  res.json(response);
}));

// Forgot password
router.post('/forgot-password', validate(schemas.resetPassword), asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if user exists or not
    const response: ApiResponse = {
      success: true,
      message: 'If an account with that email exists, we sent a password reset link'
    };
    return res.json(response);
  }

  // Generate reset token
  const resetToken = uuidv4();
  
  // In a real implementation, store the reset token with expiration
  // For now, we'll simulate sending the email

  try {
    await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw createError('Failed to send password reset email', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'If an account with that email exists, we sent a password reset link'
  };

  res.json(response);
}));

// Reset password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw createError('Token and new password required', 400);
  }

  if (newPassword.length < 8) {
    throw createError('Password must be at least 8 characters long', 400);
  }

  // In a real implementation, verify the reset token
  // For now, we'll simulate finding the user
  const user = await prisma.user.findFirst({
    where: {
      email: 'user@example.com' // This would be extracted from the token
    }
  });

  if (!user) {
    throw createError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Password reset successfully'
  };

  res.json(response);
}));

// Change password
router.post('/change-password', authenticateToken, validate(schemas.changePassword), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw createError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Password changed successfully'
  };

  res.json(response);
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      providerProfile: true,
      familyProfile: true,
      schoolProfile: true
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      emailVerified: true,
      emailVerifiedAt: true,
      profileImage: true,
      dateOfBirth: true,
      address: true,
      emergencyContact: true,
      preferences: true,
      createdAt: true,
      updatedAt: true,
      providerProfile: true,
      familyProfile: true,
      schoolProfile: true
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'User profile retrieved successfully',
    data: user
  };

  res.json(response);
}));

// Logout (client-side token removal)
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  // In a stateless JWT system, logout is handled client-side
  // You might want to implement a token blacklist for enhanced security
  
  const response: ApiResponse = {
    success: true,
    message: 'Logged out successfully'
  };

  res.json(response);
}));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true
    }
  });

  if (!user || user.status === 'SUSPENDED') {
    throw createError('User not found or suspended', 401);
  }

  // Generate new token
  const tokenPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const response: ApiResponse = {
    success: true,
    message: 'Token refreshed successfully',
    data: { token }
  };

  res.json(response);
}));

export default router;



