import express from 'express';
import prisma from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// All admin routes require ADMIN role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Dashboard overview
router.get('/dashboard', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const [
    totalUsers,
    totalProviders,
    totalAppointments,
    totalPayments,
    recentUsers,
    recentAppointments,
    pendingVerifications,
    systemStats
  ] = await Promise.all([
    prisma.user.count(),
    prisma.providerProfile.count(),
    prisma.appointment.count(),
    prisma.payment.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
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
    prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'PENDING_VERIFICATION' THEN 1 END) as pending_users,
        COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN "emailVerified" = true THEN 1 END) as verified_users
      FROM users
    `
  ]);

  const dashboard = {
    overview: {
      totalUsers,
      totalProviders,
      totalAppointments,
      totalPayments,
      pendingVerifications
    },
    recentActivity: {
      users: recentUsers,
      appointments: recentAppointments
    },
    systemStats: systemStats[0]
  };

  const response: ApiResponse = {
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: dashboard
  };

  res.json(response);
}));

// User management
router.get('/users', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query;
  
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
      include: {
        providerProfile: {
          select: {
            id: true,
            licenseVerified: true,
            backgroundCheck: true
          }
        },
        familyProfile: {
          select: {
            id: true
          }
        },
        schoolProfile: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            appointments: true,
            payments: true
          }
        }
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

// Provider management
router.get('/providers', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, verified, specialty } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  
  if (verified === 'true') {
    where.licenseVerified = true;
    where.backgroundCheck = true;
  } else if (verified === 'false') {
    where.OR = [
      { licenseVerified: false },
      { backgroundCheck: false }
    ];
  }
  
  if (specialty) {
    where.specialties = {
      has: specialty as string
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
            status: true,
            createdAt: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            appointments: true
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

// Appointment management
router.get('/appointments', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, status, serviceType, startDate, endDate } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  
  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    where.status = { in: statusArray };
  }
  
  if (serviceType) {
    const serviceTypeArray = Array.isArray(serviceType) ? serviceType : [serviceType];
    where.serviceType = { in: serviceTypeArray };
  }
  
  if (startDate) {
    where.startTime = {
      ...where.startTime,
      gte: new Date(startDate as string)
    };
  }
  
  if (endDate) {
    where.startTime = {
      ...where.startTime,
      lte: new Date(endDate as string)
    };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        provider: {
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
        }
      },
      orderBy: { startTime: 'desc' }
    }),
    prisma.appointment.count({ where })
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Appointments retrieved successfully',
    data: appointments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
}));

// Payment management
router.get('/payments', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (startDate) {
    where.createdAt = {
      ...where.createdAt,
      gte: new Date(startDate as string)
    };
  }
  
  if (endDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(endDate as string)
    };
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        appointment: {
          select: {
            id: true,
            title: true,
            serviceType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.payment.count({ where })
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Payments retrieved successfully',
    data: payments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
}));

// System settings
router.get('/settings', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const settings = await prisma.systemSettings.findMany({
    orderBy: { key: 'asc' }
  });

  const response: ApiResponse = {
    success: true,
    message: 'System settings retrieved successfully',
    data: settings
  };

  res.json(response);
}));

// Update system settings
router.put('/settings/:key', validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  const setting = await prisma.systemSettings.upsert({
    where: { key },
    update: {
      value,
      description: description || undefined
    },
    create: {
      key,
      value,
      description
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'System setting updated successfully',
    data: setting
  };

  res.json(response);
}));

// Analytics
router.get('/analytics/overview', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { period = '30' } = req.query;
  const days = Number(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    userGrowth,
    appointmentTrends,
    revenueData,
    providerStats,
    topSpecialties
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.appointment.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.providerProfile.groupBy({
      by: ['licenseVerified', 'backgroundCheck'],
      _count: { id: true }
    }),
    prisma.providerProfile.findMany({
      select: {
        specialties: true
      }
    })
  ]);

  // Calculate specialty counts
  const specialtyCount: { [key: string]: number } = {};
  topSpecialties.forEach(provider => {
    provider.specialties.forEach(specialty => {
      specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });
  });

  const topSpecialtiesList = Object.entries(specialtyCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([specialty, count]) => ({ specialty, count }));

  const analytics = {
    userGrowth,
    appointmentTrends,
    revenue: {
      total: revenueData._sum.amount || 0,
      count: revenueData._count.id || 0,
      average: revenueData._count.id > 0 ? (revenueData._sum.amount || 0) / revenueData._count.id : 0
    },
    providerStats,
    topSpecialties: topSpecialtiesList
  };

  const response: ApiResponse = {
    success: true,
    message: 'Analytics data retrieved successfully',
    data: analytics
  };

  res.json(response);
}));

// Export data
router.get('/export/:type', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { type } = req.params;
  const { startDate, endDate } = req.query;

  const where: any = {};
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  let data: any[] = [];

  switch (type) {
    case 'users':
      data = await prisma.user.findMany({
        where,
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
      break;
    case 'appointments':
      data = await prisma.appointment.findMany({
        where,
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          provider: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });
      break;
    case 'payments':
      data = await prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      break;
    default:
      throw createError('Invalid export type', 400);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Data exported successfully',
    data
  };

  res.json(response);
}));

export default router;



