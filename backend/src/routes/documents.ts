import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { authenticateToken, requireEmailVerification } from '../middleware/auth';
import { validateParams, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, GIF, and TXT files are allowed.'));
    }
  }
});

// Upload document
router.post('/upload', authenticateToken, requireEmailVerification, upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { category, description, appointmentId } = req.body;
  const userId = req.user!.id;

  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  if (!category) {
    throw createError('Category is required', 400);
  }

  // Validate appointment if provided
  if (appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
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

    // Check if user is part of this appointment
    const isParticipant = 
      appointment.clientId === userId ||
      appointment.provider.userId === userId;

    if (!isParticipant) {
      throw createError('You are not authorized to upload documents for this appointment', 403);
    }
  }

  const document = await prisma.document.create({
    data: {
      userId,
      appointmentId: appointmentId || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category,
      description: description || null
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Document uploaded successfully',
    data: document
  };

  res.status(201).json(response);
}));

// Get user documents
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, category, appointmentId } = req.query;
  const userId = req.user!.id;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = { userId };

  if (category) {
    where.category = category;
  }

  if (appointmentId) {
    where.appointmentId = appointmentId;
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take,
      include: {
        appointment: {
          select: {
            id: true,
            title: true,
            startTime: true,
            serviceType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.document.count({ where })
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Documents retrieved successfully',
    data: documents,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };

  res.json(response);
}));

// Get document by ID
router.get('/:id', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId
    },
    include: {
      appointment: {
        select: {
          id: true,
          title: true,
          startTime: true,
          serviceType: true
        }
      }
    }
  });

  if (!document) {
    throw createError('Document not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Document retrieved successfully',
    data: document
  };

  res.json(response);
}));

// Download document
router.get('/:id/download', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!document) {
    throw createError('Document not found', 404);
  }

  // Check if file exists
  if (!fs.existsSync(document.filePath)) {
    throw createError('File not found on server', 404);
  }

  // Set appropriate headers
  res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Length', document.fileSize);

  // Stream the file
  const fileStream = fs.createReadStream(document.filePath);
  fileStream.pipe(res);

  fileStream.on('error', (error) => {
    console.error('File stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading file'
      });
    }
  });
}));

// Update document
router.put('/:id', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { category, description } = req.body;
  const userId = req.user!.id;

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!document) {
    throw createError('Document not found', 404);
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: {
      category: category || document.category,
      description: description !== undefined ? description : document.description
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Document updated successfully',
    data: updatedDocument
  };

  res.json(response);
}));

// Delete document
router.delete('/:id', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!document) {
    throw createError('Document not found', 404);
  }

  // Delete file from filesystem
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  // Delete record from database
  await prisma.document.delete({
    where: { id }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Document deleted successfully'
  };

  res.json(response);
}));

// Get document categories
router.get('/categories/list', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const categories = [
    'assessment',
    'report',
    'homework',
    'progress_note',
    'evaluation',
    'treatment_plan',
    'discharge_summary',
    'insurance',
    'other'
  ];

  const response: ApiResponse = {
    success: true,
    message: 'Document categories retrieved successfully',
    data: categories
  };

  res.json(response);
}));

// Get document statistics
router.get('/stats/overview', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const [
    totalDocuments,
    documentsByCategory,
    recentDocuments,
    totalSize
  ] = await Promise.all([
    prisma.document.count({ where: { userId } }),
    prisma.document.groupBy({
      by: ['category'],
      where: { userId },
      _count: { category: true }
    }),
    prisma.document.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        category: true,
        createdAt: true
      }
    }),
    prisma.document.aggregate({
      where: { userId },
      _sum: { fileSize: true }
    })
  ]);

  const stats = {
    totalDocuments,
    documentsByCategory: documentsByCategory.map(item => ({
      category: item.category,
      count: item._count.category
    })),
    recentDocuments,
    totalSize: totalSize._sum.fileSize || 0
  };

  const response: ApiResponse = {
    success: true,
    message: 'Document statistics retrieved successfully',
    data: stats
  };

  res.json(response);
}));

export default router;



