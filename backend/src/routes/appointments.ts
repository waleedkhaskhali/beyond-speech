import express from 'express';
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';
import prisma from '../config/database';
import { authenticateToken, requireRole, requireEmailVerification } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse, SearchAppointmentsRequest } from '../types';
import { emailService } from '../services/emailService';

const router = express.Router();

// Get all appointments
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { 
    status, 
    serviceType, 
    startDate, 
    endDate, 
    providerId, 
    clientId,
    page = 1, 
    limit = 10 
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);
  const currentUser = req.user!;

  const where: any = {};

  // Users can only see their own appointments unless they're admin
  if (currentUser.role === 'ADMIN') {
    // Admin can see all appointments
  } else if (currentUser.role === 'SLP' || currentUser.role === 'OT' || currentUser.role === 'PT') {
    // Providers can see appointments where they are the provider
    where.providerId = currentUser.providerProfile?.id;
  } else {
    // Clients can see appointments where they are the client
    where.clientId = currentUser.id;
  }

  // Apply filters
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

  if (providerId && currentUser.role === 'ADMIN') {
    where.providerId = providerId;
  }

  if (clientId && currentUser.role === 'ADMIN') {
    where.clientId = clientId;
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
            email: true,
            phone: true,
            profileImage: true
          }
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true
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

// Get appointment by ID
router.get('/:id', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true
        }
      },
      provider: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              profileImage: true
            }
          }
        }
      },
      documents: true,
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  // Check if user has access to this appointment
  const hasAccess = 
    currentUser.role === 'ADMIN' ||
    appointment.clientId === currentUser.id ||
    appointment.provider.userId === currentUser.id;

  if (!hasAccess) {
    throw createError('Access denied', 403);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Appointment retrieved successfully',
    data: appointment
  };

  res.json(response);
}));

// Create appointment
router.post('/', authenticateToken, requireEmailVerification, validate(schemas.createAppointment), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const appointmentData = req.body;
  const currentUser = req.user!;

  // Validate provider exists and is verified
  const provider = await prisma.providerProfile.findUnique({
    where: { id: appointmentData.providerId },
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

  if (!provider) {
    throw createError('Provider not found', 404);
  }

  if (!provider.licenseVerified || !provider.backgroundCheck) {
    throw createError('Provider is not verified', 400);
  }

  // Validate date and time
  const startTime = new Date(appointmentData.startTime);
  const endTime = new Date(appointmentData.endTime);

  if (isBefore(startTime, new Date())) {
    throw createError('Cannot schedule appointments in the past', 400);
  }

  if (isAfter(startTime, addDays(new Date(), 90))) {
    throw createError('Cannot schedule appointments more than 90 days in advance', 400);
  }

  // Check for conflicts
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      providerId: appointmentData.providerId,
      status: {
        in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
      },
      OR: [
        {
          startTime: {
            gte: startTime,
            lt: endTime
          }
        },
        {
          endTime: {
            gt: startTime,
            lte: endTime
          }
        }
      ]
    }
  });

  if (conflictingAppointment) {
    throw createError('Provider has a conflicting appointment at this time', 400);
  }

  // Calculate duration and amount
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const hourlyRate = provider.hourlyRate || 0;
  const totalAmount = (hourlyRate * duration) / 60;

  const appointment = await prisma.appointment.create({
    data: {
      clientId: currentUser.id,
      providerId: appointmentData.providerId,
      serviceType: appointmentData.serviceType,
      title: appointmentData.title,
      description: appointmentData.description,
      startTime,
      endTime,
      duration,
      isRemote: appointmentData.isRemote || false,
      location: appointmentData.location,
      notes: appointmentData.notes,
      goals: appointmentData.goals,
      materials: appointmentData.materials || [],
      hourlyRate,
      totalAmount,
      status: 'SCHEDULED'
    },
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
    }
  });

  // Send confirmation emails
  try {
    await emailService.sendAppointmentConfirmation(
      currentUser.email,
      currentUser.firstName,
      {
        serviceType: appointment.serviceType,
        startTime: appointment.startTime.toLocaleString(),
        duration: appointment.duration,
        isRemote: appointment.isRemote,
        location: appointment.location,
        providerName: `${provider.user.firstName} ${provider.user.lastName}`
      }
    );

    await emailService.sendAppointmentConfirmation(
      provider.user.email,
      provider.user.firstName,
      {
        serviceType: appointment.serviceType,
        startTime: appointment.startTime.toLocaleString(),
        duration: appointment.duration,
        isRemote: appointment.isRemote,
        location: appointment.location,
        providerName: `${currentUser.firstName} ${currentUser.lastName}`
      }
    );
  } catch (error) {
    console.error('Failed to send confirmation emails:', error);
    // Don't fail the appointment creation if email fails
  }

  const response: ApiResponse = {
    success: true,
    message: 'Appointment created successfully',
    data: appointment
  };

  res.status(201).json(response);
}));

// Update appointment
router.put('/:id', authenticateToken, validateParams(schemas.id), validate(schemas.updateAppointment), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const currentUser = req.user!;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      provider: {
        include: {
          user: true
        }
      }
    }
  });

  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  // Check if user has permission to update this appointment
  const canUpdate = 
    currentUser.role === 'ADMIN' ||
    appointment.clientId === currentUser.id ||
    appointment.provider.userId === currentUser.id;

  if (!canUpdate) {
    throw createError('Access denied', 403);
  }

  // Validate status transitions
  if (updateData.status) {
    const validTransitions: { [key: string]: string[] } = {
      'SCHEDULED': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [],
      'CANCELLED': [],
      'NO_SHOW': []
    };

    if (!validTransitions[appointment.status]?.includes(updateData.status)) {
      throw createError(`Cannot change status from ${appointment.status} to ${updateData.status}`, 400);
    }
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...updateData,
      ...(updateData.startTime && { startTime: new Date(updateData.startTime) }),
      ...(updateData.endTime && { endTime: new Date(updateData.endTime) }),
      ...(updateData.status === 'CANCELLED' && { cancelledAt: new Date() })
    },
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
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Appointment updated successfully',
    data: updatedAppointment
  };

  res.json(response);
}));

// Cancel appointment
router.patch('/:id/cancel', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const currentUser = req.user!;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      provider: {
        include: {
          user: true
        }
      }
    }
  });

  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  // Check if user has permission to cancel this appointment
  const canCancel = 
    currentUser.role === 'ADMIN' ||
    appointment.clientId === currentUser.id ||
    appointment.provider.userId === currentUser.id;

  if (!canCancel) {
    throw createError('Access denied', 403);
  }

  // Check if appointment can be cancelled
  if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
    throw createError('Appointment cannot be cancelled', 400);
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason
    },
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
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Appointment cancelled successfully',
    data: updatedAppointment
  };

  res.json(response);
}));

// Get appointment statistics
router.get('/stats/overview', authenticateToken, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const [
    totalAppointments,
    scheduledAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    appointmentsByServiceType,
    recentAppointments
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
    prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    prisma.appointment.groupBy({
      by: ['serviceType'],
      _count: { serviceType: true }
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
    })
  ]);

  const stats = {
    totalAppointments,
    scheduledAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    appointmentsByServiceType: appointmentsByServiceType.map(item => ({
      serviceType: item.serviceType,
      count: item._count.serviceType
    })),
    recentAppointments
  };

  const response: ApiResponse = {
    success: true,
    message: 'Appointment statistics retrieved successfully',
    data: stats
  };

  res.json(response);
}));

// Get upcoming appointments
router.get('/upcoming/list', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { limit = 5 } = req.query;
  const currentUser = req.user!;

  const where: any = {
    startTime: {
      gte: new Date()
    },
    status: {
      in: ['SCHEDULED', 'CONFIRMED']
    }
  };

  // Users can only see their own appointments unless they're admin
  if (currentUser.role === 'ADMIN') {
    // Admin can see all appointments
  } else if (currentUser.role === 'SLP' || currentUser.role === 'OT' || currentUser.role === 'PT') {
    where.providerId = currentUser.providerProfile?.id;
  } else {
    where.clientId = currentUser.id;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    take: Number(limit),
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true
        }
      },
      provider: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        }
      }
    },
    orderBy: { startTime: 'asc' }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Upcoming appointments retrieved successfully',
    data: appointments
  };

  res.json(response);
}));

export default router;



