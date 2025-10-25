import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticateToken, requireRole, requireEmailVerification } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse, PaginationOptions } from '../types';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, role, status, search } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  
  if (role) {
    where.role = role;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Users retrieved successfully',
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
}));

// Get user by ID
router.get('/:id', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUser = req.user!;

  // Users can only view their own profile unless they're admin
  if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
    throw createError('Access denied', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id },
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
    message: 'User retrieved successfully',
    data: user
  };

  res.json(response);
}));

// Update user profile
router.put('/:id', authenticateToken, validateParams(schemas.id), validate(schemas.updateUser), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUser = req.user!;
  const updateData = req.body;

  // Users can only update their own profile unless they're admin
  if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
    throw createError('Access denied', 403);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw createError('User not found', 404);
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      emailVerified: true,
      profileImage: true,
      dateOfBirth: true,
      address: true,
      emergencyContact: true,
      preferences: true,
      updatedAt: true
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'User updated successfully',
    data: updatedUser
  };

  res.json(response);
}));

// Update user status (Admin only)
router.patch('/:id/status', authenticateToken, requireRole(['ADMIN']), validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'].includes(status)) {
    throw createError('Invalid status', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      updatedAt: true
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'User status updated successfully',
    data: updatedUser
  };

  res.json(response);
}));

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Prevent admin from deleting themselves
  if (req.user!.id === id) {
    throw createError('Cannot delete your own account', 400);
  }

  await prisma.user.delete({
    where: { id }
  });

  const response: ApiResponse = {
    success: true,
    message: 'User deleted successfully'
  };

  res.json(response);
}));

// Upload profile image
router.post('/:id/profile-image', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUser = req.user!;

  // Users can only update their own profile image unless they're admin
  if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
    throw createError('Access denied', 403);
  }

  // This would typically handle file upload using multer
  // For now, we'll just return a placeholder response
  const response: ApiResponse = {
    success: true,
    message: 'Profile image upload endpoint - implement with multer',
    data: { message: 'File upload functionality needs to be implemented' }
  };

  res.json(response);
}));

// Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    usersByRole,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'PENDING_VERIFICATION' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })
  ]);

  const stats = {
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    usersByRole: usersByRole.map(item => ({
      role: item.role,
      count: item._count.role
    })),
    recentUsers
  };

  const response: ApiResponse = {
    success: true,
    message: 'User statistics retrieved successfully',
    data: stats
  };

  res.json(response);
}));

// Search users (Admin only)
router.get('/search/users', authenticateToken, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { q, role, status, page = 1, limit = 10 } = req.query;

  if (!q) {
    throw createError('Search query is required', 400);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    OR: [
      { firstName: { contains: q as string, mode: 'insensitive' } },
      { lastName: { contains: q as string, mode: 'insensitive' } },
      { email: { contains: q as string, mode: 'insensitive' } }
    ]
  };

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Search results retrieved successfully',
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
}));

export default router;



