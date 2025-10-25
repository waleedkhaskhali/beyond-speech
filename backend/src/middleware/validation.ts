import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        error: error.details[0].message
      });
    }
    
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        error: error.details[0].message
      });
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  // User schemas
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    role: Joi.string().valid('FAMILY', 'SLP', 'OT', 'PT', 'OTA', 'PTA', 'SCHOOL', 'ADMIN').required(),
    dateOfBirth: Joi.date().optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required()
    }).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      relationship: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().optional()
    }).optional()
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().required()
    }).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      relationship: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().optional()
    }).optional(),
    preferences: Joi.object().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  // Provider schemas
  createProviderProfile: Joi.object({
    licenseNumber: Joi.string().required(),
    licenseState: Joi.string().required(),
    specialties: Joi.array().items(Joi.string()).required(),
    certifications: Joi.array().items(Joi.string()).optional(),
    experience: Joi.number().min(0).required(),
    education: Joi.array().items(Joi.object({
      degree: Joi.string().required(),
      institution: Joi.string().required(),
      year: Joi.number().required(),
      field: Joi.string().optional()
    })).optional(),
    bio: Joi.string().max(1000).optional(),
    hourlyRate: Joi.number().min(0).optional(),
    availability: Joi.object().optional(),
    timezone: Joi.string().optional(),
    remoteAvailable: Joi.boolean().optional(),
    inPersonAvailable: Joi.boolean().optional(),
    serviceAreas: Joi.array().items(Joi.string()).required(),
    languages: Joi.array().items(Joi.string()).required(),
    ageGroups: Joi.array().items(Joi.string()).required(),
    insuranceAccepted: Joi.boolean().optional(),
    privatePayOnly: Joi.boolean().optional()
  }),

  // Family schemas
  createFamilyProfile: Joi.object({
    primaryContact: Joi.boolean().optional(),
    relationship: Joi.string().optional(),
    preferredLanguage: Joi.string().optional(),
    culturalBackground: Joi.string().optional(),
    clientName: Joi.string().optional(),
    clientDateOfBirth: Joi.date().optional(),
    clientNeeds: Joi.array().items(Joi.string()).required(),
    clientGoals: Joi.string().optional(),
    previousTherapy: Joi.boolean().optional(),
    previousTherapist: Joi.string().optional(),
    preferredProvider: Joi.array().items(Joi.string()).optional(),
    schedulingPrefs: Joi.object().optional(),
    communicationPrefs: Joi.object().optional()
  }),

  // Appointment schemas
  createAppointment: Joi.object({
    providerId: Joi.string().required(),
    serviceType: Joi.string().valid('SPEECH_THERAPY', 'OCCUPATIONAL_THERAPY', 'PHYSICAL_THERAPY', 'LITERACY_SUPPORT', 'GROUP_SESSION', 'EVALUATION').required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    isRemote: Joi.boolean().optional(),
    location: Joi.string().optional(),
    notes: Joi.string().optional(),
    goals: Joi.string().optional(),
    materials: Joi.array().items(Joi.string()).optional()
  }),

  updateAppointment: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    startTime: Joi.date().optional(),
    endTime: Joi.date().optional(),
    status: Joi.string().valid('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW').optional(),
    isRemote: Joi.boolean().optional(),
    location: Joi.string().optional(),
    meetingLink: Joi.string().uri().optional(),
    notes: Joi.string().optional(),
    goals: Joi.string().optional(),
    materials: Joi.array().items(Joi.string()).optional(),
    homework: Joi.string().optional(),
    cancellationReason: Joi.string().optional()
  }),

  // Message schemas
  createMessage: Joi.object({
    receiverId: Joi.string().required(),
    content: Joi.string().required(),
    messageType: Joi.string().valid('text', 'image', 'document', 'system').optional(),
    attachments: Joi.array().items(Joi.string()).optional(),
    appointmentId: Joi.string().optional()
  }),

  // Review schemas
  createReview: Joi.object({
    appointmentId: Joi.string().optional(),
    revieweeId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(500).optional(),
    categories: Joi.object({
      communication: Joi.number().min(1).max(5).optional(),
      professionalism: Joi.number().min(1).max(5).optional(),
      effectiveness: Joi.number().min(1).max(5).optional(),
      punctuality: Joi.number().min(1).max(5).optional(),
      overall: Joi.number().min(1).max(5).optional()
    }).optional()
  }),

  // Common query schemas
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }),

  id: Joi.object({
    id: Joi.string().required()
  })
};



