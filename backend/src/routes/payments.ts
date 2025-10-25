import express from 'express';
import Stripe from 'stripe';
import prisma from '../config/database';
import { authenticateToken, requireRole, requireEmailVerification } from '../middleware/auth';
import { validate, validateParams, schemas } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create payment intent
router.post('/create-intent', authenticateToken, requireEmailVerification, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { amount, appointmentId, description } = req.body;
  const userId = req.user!.id;

  if (!amount || amount <= 0) {
    throw createError('Invalid amount', 400);
  }

  // Get or create Stripe customer
  let customerId = req.user!.stripeCustomerId;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user!.email,
      name: `${req.user!.firstName} ${req.user!.lastName}`,
      metadata: {
        userId: userId
      }
    });

    customerId = customer.id;

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId }
    });
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    metadata: {
      userId,
      appointmentId: appointmentId || '',
      description: description || 'Beyond Speech Payment'
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  const response: ApiResponse = {
    success: true,
    message: 'Payment intent created successfully',
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }
  };

  res.json(response);
}));

// Confirm payment
router.post('/confirm', authenticateToken, requireEmailVerification, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { paymentIntentId, appointmentId } = req.body;
  const userId = req.user!.id;

  if (!paymentIntentId) {
    throw createError('Payment intent ID is required', 400);
  }

  // Retrieve payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw createError('Payment not completed', 400);
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findFirst({
    where: { stripePaymentId: paymentIntentId }
  });

  if (existingPayment) {
    throw createError('Payment already processed', 400);
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId,
      appointmentId: appointmentId || null,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: 'COMPLETED',
      stripePaymentId: paymentIntentId,
      stripeChargeId: paymentIntent.latest_charge as string,
      description: paymentIntent.metadata?.description || 'Beyond Speech Payment',
      metadata: paymentIntent.metadata
    }
  });

  // Update appointment payment status if applicable
  if (appointmentId) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentStatus: 'COMPLETED' }
    });
  }

  const response: ApiResponse = {
    success: true,
    message: 'Payment confirmed successfully',
    data: payment
  };

  res.json(response);
}));

// Get payment history
router.get('/history', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user!.id;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
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
    prisma.payment.count({ where: { userId } })
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Payment history retrieved successfully',
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

// Get payment by ID
router.get('/:id', authenticateToken, validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const payment = await prisma.payment.findFirst({
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

  if (!payment) {
    throw createError('Payment not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Payment retrieved successfully',
    data: payment
  };

  res.json(response);
}));

// Refund payment (Admin only)
router.post('/:id/refund', authenticateToken, requireRole(['ADMIN']), validateParams(schemas.id), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = await prisma.payment.findUnique({
    where: { id }
  });

  if (!payment) {
    throw createError('Payment not found', 404);
  }

  if (payment.status !== 'COMPLETED') {
    throw createError('Only completed payments can be refunded', 400);
  }

  // Process refund with Stripe
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentId,
    reason: reason || 'requested_by_customer'
  });

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status: 'REFUNDED',
      metadata: {
        ...payment.metadata,
        refundId: refund.id,
        refundReason: reason
      }
    }
  });

  // Update appointment payment status if applicable
  if (payment.appointmentId) {
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: 'REFUNDED' }
    });
  }

  const response: ApiResponse = {
    success: true,
    message: 'Payment refunded successfully',
    data: updatedPayment
  };

  res.json(response);
}));

// Get payment statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireRole(['ADMIN']), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const [
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    totalRevenue,
    paymentsByMonth,
    recentPayments
  ] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.count({ where: { status: 'REFUNDED' } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.payment.groupBy({
      by: ['createdAt'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      orderBy: { createdAt: 'desc' },
      take: 12
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        appointment: {
          select: {
            title: true,
            serviceType: true
          }
        }
      }
    })
  ]);

  const stats = {
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    totalRevenue: totalRevenue._sum.amount || 0,
    paymentsByMonth,
    recentPayments
  };

  const response: ApiResponse = {
    success: true,
    message: 'Payment statistics retrieved successfully',
    data: stats
  };

  res.json(response);
}));

// Create setup intent for saving payment methods
router.post('/setup-intent', authenticateToken, requireEmailVerification, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // Get or create Stripe customer
  let customerId = req.user!.stripeCustomerId;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user!.email,
      name: `${req.user!.firstName} ${req.user!.lastName}`,
      metadata: {
        userId: userId
      }
    });

    customerId = customer.id;

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId }
    });
  }

  // Create setup intent
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session'
  });

  const response: ApiResponse = {
    success: true,
    message: 'Setup intent created successfully',
    data: {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    }
  };

  res.json(response);
}));

// Get saved payment methods
router.get('/payment-methods', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  if (!req.user!.stripeCustomerId) {
    const response: ApiResponse = {
      success: true,
      message: 'No payment methods found',
      data: []
    };
    return res.json(response);
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: req.user!.stripeCustomerId,
    type: 'card'
  });

  const response: ApiResponse = {
    success: true,
    message: 'Payment methods retrieved successfully',
    data: paymentMethods.data
  };

  res.json(response);
}));

export default router;



