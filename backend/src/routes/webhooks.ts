import express from 'express';
import Stripe from 'stripe';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw createError('Invalid signature', 400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_method.attached':
      await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Webhook processed successfully'
  };

  res.json(response);
}));

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const userId = paymentIntent.metadata?.userId;
    const appointmentId = paymentIntent.metadata?.appointmentId;

    if (!userId) {
      console.error('No userId in payment intent metadata');
      return;
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id }
    });

    if (existingPayment) {
      console.log('Payment already processed:', paymentIntent.id);
      return;
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        appointmentId: appointmentId || null,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: 'COMPLETED',
        stripePaymentId: paymentIntent.id,
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

    console.log('Payment processed successfully:', paymentIntent.id);
  } catch (error) {
    console.error('Error processing payment intent succeeded:', error);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const userId = paymentIntent.metadata?.userId;
    const appointmentId = paymentIntent.metadata?.appointmentId;

    if (!userId) {
      console.error('No userId in payment intent metadata');
      return;
    }

    // Create or update payment record
    await prisma.payment.upsert({
      where: { stripePaymentId: paymentIntent.id },
      update: {
        status: 'FAILED'
      },
      create: {
        userId,
        appointmentId: appointmentId || null,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'FAILED',
        stripePaymentId: paymentIntent.id,
        description: paymentIntent.metadata?.description || 'Beyond Speech Payment',
        metadata: paymentIntent.metadata
      }
    });

    // Update appointment payment status if applicable
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { paymentStatus: 'FAILED' }
      });
    }

    console.log('Payment failed processed:', paymentIntent.id);
  } catch (error) {
    console.error('Error processing payment intent failed:', error);
  }
}

// Handle payment method attached
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    const customerId = paymentMethod.customer as string;
    
    if (!customerId) {
      console.error('No customer ID in payment method');
      return;
    }

    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (user) {
      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Payment Method Added',
          message: 'A new payment method has been added to your account',
          type: 'payment',
          actionUrl: '/profile/payment-methods'
        }
      });

      console.log('Payment method attached notification sent to user:', user.id);
    }
  } catch (error) {
    console.error('Error processing payment method attached:', error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    if (!customerId) {
      console.error('No customer ID in subscription');
      return;
    }

    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (user) {
      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Created',
          message: 'Your subscription has been successfully created',
          type: 'subscription',
          actionUrl: '/profile/subscription'
        }
      });

      console.log('Subscription created notification sent to user:', user.id);
    }
  } catch (error) {
    console.error('Error processing subscription created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    if (!customerId) {
      console.error('No customer ID in subscription');
      return;
    }

    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (user) {
      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Updated',
          message: 'Your subscription has been updated',
          type: 'subscription',
          actionUrl: '/profile/subscription'
        }
      });

      console.log('Subscription updated notification sent to user:', user.id);
    }
  } catch (error) {
    console.error('Error processing subscription updated:', error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    if (!customerId) {
      console.error('No customer ID in subscription');
      return;
    }

    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (user) {
      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled',
          type: 'subscription',
          actionUrl: '/profile/subscription'
        }
      });

      console.log('Subscription deleted notification sent to user:', user.id);
    }
  } catch (error) {
    console.error('Error processing subscription deleted:', error);
  }
}

export default router;



