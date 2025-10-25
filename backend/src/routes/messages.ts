import express from 'express';
import prisma from '../config/database';
import { authenticateToken, requireEmailVerification } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Get messages for a conversation
router.get('/conversation/:userId', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;
  const { page = 1, limit = 50 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Get messages between current user and the specified user
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: currentUserId,
          receiverId: userId
        },
        {
          senderId: userId,
          receiverId: currentUserId
        }
      ]
    },
    skip,
    take,
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
      },
      appointment: {
        select: {
          id: true,
          title: true,
          startTime: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      senderId: userId,
      receiverId: currentUserId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Messages retrieved successfully',
    data: messages.reverse() // Reverse to show oldest first
  };

  res.json(response);
}));

// Get all conversations for current user
router.get('/conversations', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user!.id;

  // Get unique conversation partners
  const conversations = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          role: true
        }
      },
      receiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group by conversation partner and get latest message
  const conversationMap = new Map();
  
  conversations.forEach(message => {
    const partnerId = message.senderId === currentUserId ? message.receiverId : message.senderId;
    const partner = message.senderId === currentUserId ? message.receiver : message.sender;
    
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partner,
        lastMessage: message,
        unreadCount: 0
      });
    }
    
    // Count unread messages
    if (message.receiverId === currentUserId && !message.isRead) {
      conversationMap.get(partnerId).unreadCount++;
    }
  });

  const conversationList = Array.from(conversationMap.values());

  const response: ApiResponse = {
    success: true,
    message: 'Conversations retrieved successfully',
    data: conversationList
  };

  res.json(response);
}));

// Send message
router.post('/', authenticateToken, requireEmailVerification, validate(schemas.createMessage), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const messageData = req.body;
  const senderId = req.user!.id;

  // Validate that receiver exists
  const receiver = await prisma.user.findUnique({
    where: { id: messageData.receiverId }
  });

  if (!receiver) {
    throw createError('Receiver not found', 404);
  }

  // Validate appointment if provided
  if (messageData.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: messageData.appointmentId },
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
      appointment.clientId === senderId ||
      appointment.provider.userId === senderId;

    if (!isParticipant) {
      throw createError('You are not authorized to send messages for this appointment', 403);
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId: messageData.receiverId,
      content: messageData.content,
      messageType: messageData.messageType || 'text',
      attachments: messageData.attachments || [],
      appointmentId: messageData.appointmentId
    },
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
      },
      appointment: {
        select: {
          id: true,
          title: true,
          startTime: true
        }
      }
    }
  });

  // Create notification for receiver
  await prisma.notification.create({
    data: {
      userId: messageData.receiverId,
      title: 'New Message',
      message: `You have a new message from ${req.user!.firstName} ${req.user!.lastName}`,
      type: 'message',
      actionUrl: `/messages/conversation/${senderId}`
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Message sent successfully',
    data: message
  };

  res.status(201).json(response);
}));

// Mark message as read
router.patch('/:id/read', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUserId = req.user!.id;

  const message = await prisma.message.findUnique({
    where: { id }
  });

  if (!message) {
    throw createError('Message not found', 404);
  }

  // Only the receiver can mark as read
  if (message.receiverId !== currentUserId) {
    throw createError('Access denied', 403);
  }

  const updatedMessage = await prisma.message.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Message marked as read',
    data: updatedMessage
  };

  res.json(response);
}));

// Mark all messages in conversation as read
router.patch('/conversation/:userId/read-all', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;

  await prisma.message.updateMany({
    where: {
      senderId: userId,
      receiverId: currentUserId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'All messages marked as read'
  };

  res.json(response);
}));

// Delete message
router.delete('/:id', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const currentUserId = req.user!.id;

  const message = await prisma.message.findUnique({
    where: { id }
  });

  if (!message) {
    throw createError('Message not found', 404);
  }

  // Only the sender can delete their message
  if (message.senderId !== currentUserId) {
    throw createError('Access denied', 403);
  }

  await prisma.message.delete({
    where: { id }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Message deleted successfully'
  };

  res.json(response);
}));

// Get unread message count
router.get('/unread/count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user!.id;

  const unreadCount = await prisma.message.count({
    where: {
      receiverId: currentUserId,
      isRead: false
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Unread count retrieved successfully',
    data: { unreadCount }
  };

  res.json(response);
}));

export default router;



