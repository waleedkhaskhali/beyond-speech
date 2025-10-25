import express from 'express';
import { validate } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import { emailService } from '../services/emailService';
import Joi from 'joi';

const router = express.Router();

// Validation schema for contact form
const contactFormSchema = Joi.object({
  role: Joi.string().valid('family', 'slp', 'ot', 'pt', 'ota', 'pta', 'school').required(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow('').optional(),
  
  // Family-specific fields
  clientName: Joi.string().allow('').optional(),
  age: Joi.string().allow('').optional(),
  goals: Joi.string().allow('').optional(),
  
  // Provider-specific fields
  state: Joi.string().allow('').optional(),
  availability: Joi.string().allow('').optional(),
  expertise: Joi.string().allow('').optional(),
  
  // School-specific fields
  orgName: Joi.string().allow('').optional(),
  need: Joi.string().allow('').optional(),
  
  // General message
  message: Joi.string().allow('').optional()
});

// Submit contact form
router.post('/submit', validate(contactFormSchema), asyncHandler(async (req, res) => {
  const formData = req.body;
  
  try {
    // Log the submission for debugging
    console.log('New contact form submission:', {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      timestamp: new Date().toISOString()
    });

    // Send notification to admin about new signup (skip if email not configured)
    try {
      await emailService.sendAdminNotification(
        formData.email,
        formData.name,
        formData.role,
        formData.message
      );
      console.log('Admin notification email sent successfully');
    } catch (emailError) {
      console.log('Email service not configured, skipping admin notification:', emailError.message);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Thank you for your interest! We\'ll be in touch within 1-2 business days.',
      data: { 
        role: formData.role,
        nextSteps: getNextSteps(formData.role)
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Contact form submission error:', error);
    throw createError('Failed to process your request. Please try again.', 500);
  }
}));

// Helper function to get next steps based on role
function getNextSteps(role: string): string[] {
  switch (role) {
    case 'family':
      return [
        'Complete your profile with client details',
        'Browse available providers in your area',
        'Schedule a consultation call',
        'Begin therapy sessions'
      ];
    case 'slp':
    case 'ot':
    case 'pt':
    case 'ota':
    case 'pta':
      return [
        'Complete your professional profile',
        'Upload license and certifications',
        'Set your availability and rates',
        'Start receiving client referrals'
      ];
    case 'school':
      return [
        'Complete your organization profile',
        'Specify your service needs',
        'Review provider matches',
        'Schedule consultation calls'
      ];
    default:
      return ['We\'ll contact you soon with next steps'];
  }
}

export default router;