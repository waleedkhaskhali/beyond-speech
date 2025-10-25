import express from 'express';
import prisma from '../config/database';
import { authenticateToken, requireRole, requireEmailVerification } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse, SearchProvidersRequest } from '../types';

const router = express.Router();

// Get all providers
router.get('/', asyncHandler(async (req, res) => {
  const { 
    specialties, 
    languages, 
    ageGroups, 
    serviceAreas, 
    remoteAvailable, 
    inPersonAvailable,
    minRate,
    maxRate,
    page = 1, 
    limit = 10 
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    user: {
      status: 'ACTIVE',
      emailVerified: true
    },
    licenseVerified: true,
    backgroundCheck: true
  };

  // Filter by specialties
  if (specialties) {
    const specialtyArray = Array.isArray(specialties) ? specialties : [specialties];
    where.specialties = {
      hasSome: specialtyArray
    };
  }

  // Filter by languages
  if (languages) {
    const languageArray = Array.isArray(languages) ? languages : [languages];
    where.languages = {
      hasSome: languageArray
    };
  }

  // Filter by age groups
  if (ageGroups) {
    const ageGroupArray = Array.isArray(ageGroups) ? ageGroups : [ageGroups];
    where.ageGroups = {
      hasSome: ageGroupArray
    };
  }

  // Filter by service areas
  if (serviceAreas) {
    const serviceAreaArray = Array.isArray(serviceAreas) ? serviceAreas : [serviceAreas];
    where.serviceAreas = {
      hasSome: serviceAreaArray
    };
  }

  // Filter by availability
  if (remoteAvailable === 'true') {
    where.remoteAvailable = true;
  }

  if (inPersonAvailable === 'true') {
    where.inPersonAvailable = true;
  }

  // Filter by rate
  if (minRate) {
    where.hourlyRate = {
      ...where.hourlyRate,
      gte: Number(minRate)
    };
  }

  if (maxRate) {
    where.hourlyRate = {
      ...where.hourlyRate,
      lte: Number(maxRate)
    };
  }

  const [providers, total] = await Promise.all([
    prisma.providerProfile.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            createdAt: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.providerProfile.count({ where })
  ]);

  // Calculate average ratings
  const providersWithRatings = providers.map(provider => {
    const ratings = provider.reviews.map(review => review.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    return {
      ...provider,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: ratings.length
    };
  });

  const response: ApiResponse = {
    success: true,
    message: 'Providers retrieved successfully',
    data: providersWithRatings,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
}));

// Get provider by ID
router.get('/:id', validateParams(schemas.id), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const provider = await prisma.providerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
          phone: true,
          createdAt: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!provider) {
    throw createError('Provider not found', 404);
  }

  // Calculate average rating
  const ratings = provider.reviews.map(review => review.rating);
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
    : 0;

  const providerWithRating = {
    ...provider,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: ratings.length
  };

  const response: ApiResponse = {
    success: true,
    message: 'Provider retrieved successfully',
    data: providerWithRating
  };

  res.json(response);
}));

// Create provider profile
router.post('/', authenticateToken, requireEmailVerification, validate(schemas.createProviderProfile), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const profileData = req.body;

  // Check if user already has a provider profile
  const existingProfile = await prisma.providerProfile.findUnique({
    where: { userId }
  });

  if (existingProfile) {
    throw createError('Provider profile already exists', 409);
  }

  // Check if user role is SLP, OT, or PT
  if (!['SLP', 'OT', 'PT'].includes(req.user!.role)) {
    throw createError('Only SLP, OT, and PT users can create provider profiles', 403);
  }

  const providerProfile = await prisma.providerProfile.create({
    data: {
      userId,
      ...profileData
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Provider profile created successfully',
    data: providerProfile
  };

  res.status(201).json(response);
}));

// Update provider profile
router.put('/:id', authenticateToken, validateParams(schemas.id), validate(schemas.createProviderProfile), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const updateData = req.body;

  // Check if provider profile exists
  const existingProfile = await prisma.providerProfile.findUnique({
    where: { id }
  });

  if (!existingProfile) {
    throw createError('Provider profile not found', 404);
  }

  // Users can only update their own profile unless they're admin
  if (req.user!.role !== 'ADMIN' && existingProfile.userId !== userId) {
    throw createError('Access denied', 403);
  }

  const updatedProfile = await prisma.providerProfile.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Provider profile updated successfully',
    data: updatedProfile
  };

  res.json(response);
}));

// Get my provider profile
router.get('/me/profile', authenticateToken, requireRole(['SLP', 'OT', 'PT']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
          phone: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      appointments: {
        where: {
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        orderBy: { startTime: 'asc' }
      }
    }
  });

  if (!providerProfile) {
    throw createError('Provider profile not found', 404);
  }

  // Calculate average rating
  const ratings = providerProfile.reviews.map(review => review.rating);
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
    : 0;

  const profileWithStats = {
    ...providerProfile,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: ratings.length,
    upcomingAppointments: providerProfile.appointments.length
  };

  const response: ApiResponse = {
    success: true,
    message: 'Provider profile retrieved successfully',
    data: profileWithStats
  };

  res.json(response);
}));

// Update provider verification status (Admin only)
router.patch('/:id/verify', authenticateToken, requireRole(['ADMIN']), validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { licenseVerified, backgroundCheck } = req.body;

  const provider = await prisma.providerProfile.findUnique({
    where: { id }
  });

  if (!provider) {
    throw createError('Provider profile not found', 404);
  }

  const updateData: any = {};
  if (licenseVerified !== undefined) updateData.licenseVerified = licenseVerified;
  if (backgroundCheck !== undefined) updateData.backgroundCheck = backgroundCheck;

  const updatedProvider = await prisma.providerProfile.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Provider verification status updated successfully',
    data: updatedProvider
  };

  res.json(response);
}));

// Get provider statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const [
    totalProviders,
    verifiedProviders,
    pendingVerification,
    providersBySpecialty,
    recentProviders
  ] = await Promise.all([
    prisma.providerProfile.count(),
    prisma.providerProfile.count({
      where: {
        licenseVerified: true,
        backgroundCheck: true
      }
    }),
    prisma.providerProfile.count({
      where: {
        OR: [
          { licenseVerified: false },
          { backgroundCheck: false }
        ]
      }
    }),
    prisma.providerProfile.findMany({
      select: {
        specialties: true
      }
    }),
    prisma.providerProfile.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })
  ]);

  // Count specialties
  const specialtyCount: { [key: string]: number } = {};
  providersBySpecialty.forEach(provider => {
    provider.specialties.forEach(specialty => {
      specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });
  });

  const stats = {
    totalProviders,
    verifiedProviders,
    pendingVerification,
    specialtyCount,
    recentProviders
  };

  const response: ApiResponse = {
    success: true,
    message: 'Provider statistics retrieved successfully',
    data: stats
  };

  res.json(response);
}));

// Search providers
router.get('/search/providers', asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    throw createError('Search query is required', 400);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {
    OR: [
      {
        user: {
          OR: [
            { firstName: { contains: q as string, mode: 'insensitive' } },
            { lastName: { contains: q as string, mode: 'insensitive' } }
          ]
        }
      },
      { specialties: { hasSome: [q as string] } },
      { bio: { contains: q as string, mode: 'insensitive' } }
    ],
    user: {
      status: 'ACTIVE',
      emailVerified: true
    },
    licenseVerified: true,
    backgroundCheck: true
  };

  const [providers, total] = await Promise.all([
    prisma.providerProfile.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.providerProfile.count({ where })
  ]);

  // Calculate average ratings
  const providersWithRatings = providers.map(provider => {
    const ratings = provider.reviews.map(review => review.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    return {
      ...provider,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: ratings.length
    };
  });

  const response: ApiResponse = {
    success: true,
    message: 'Search results retrieved successfully',
    data: providersWithRatings,
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



