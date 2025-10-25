import { Request } from 'express';
import { User, UserRole, UserStatus, AppointmentStatus, PaymentStatus, ServiceType } from '@prisma/client';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  dateOfBirth?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferences?: UserPreferences;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  language: string;
  timezone: string;
  communicationMethod: 'email' | 'phone' | 'sms';
}

// Provider types
export interface CreateProviderProfileRequest {
  licenseNumber: string;
  licenseState: string;
  specialties: string[];
  certifications: string[];
  experience: number;
  education?: Education[];
  bio?: string;
  hourlyRate?: number;
  availability?: Availability;
  timezone?: string;
  remoteAvailable?: boolean;
  inPersonAvailable?: boolean;
  serviceAreas: string[];
  languages: string[];
  ageGroups: string[];
  insuranceAccepted?: boolean;
  privatePayOnly?: boolean;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
  field?: string;
}

export interface Availability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  available: boolean;
}

// Family types
export interface CreateFamilyProfileRequest {
  primaryContact?: boolean;
  relationship?: string;
  preferredLanguage?: string;
  culturalBackground?: string;
  clientName?: string;
  clientDateOfBirth?: string;
  clientNeeds: string[];
  clientGoals?: string;
  previousTherapy?: boolean;
  previousTherapist?: string;
  preferredProvider?: string[];
  schedulingPrefs?: SchedulingPreferences;
  communicationPrefs?: CommunicationPreferences;
}

export interface SchedulingPreferences {
  preferredDays: string[];
  preferredTimes: string[];
  maxDistance?: number;
  remotePreferred?: boolean;
}

export interface CommunicationPreferences {
  method: 'email' | 'phone' | 'sms';
  frequency: 'immediate' | 'daily' | 'weekly';
  language: string;
}

// School types
export interface CreateSchoolProfileRequest {
  schoolName: string;
  schoolType: string;
  district?: string;
  address?: Address;
  contactPerson?: string;
  contactTitle?: string;
  serviceNeeds: string[];
  studentCount?: number;
  ageRange?: string;
  specialPrograms: string[];
  backgroundCheck?: boolean;
  liabilityInsurance?: boolean;
  contractTerms?: any;
}

// Appointment types
export interface CreateAppointmentRequest {
  providerId: string;
  serviceType: ServiceType;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isRemote?: boolean;
  location?: string;
  notes?: string;
  goals?: string;
  materials?: string[];
}

export interface UpdateAppointmentRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  isRemote?: boolean;
  location?: string;
  meetingLink?: string;
  notes?: string;
  goals?: string;
  materials?: string[];
  homework?: string;
  cancellationReason?: string;
}

// Message types
export interface CreateMessageRequest {
  receiverId: string;
  content: string;
  messageType?: 'text' | 'image' | 'document' | 'system';
  attachments?: string[];
  appointmentId?: string;
}

// Payment types
export interface CreatePaymentRequest {
  appointmentId?: string;
  amount: number;
  description?: string;
  metadata?: any;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// Document types
export interface UploadDocumentRequest {
  appointmentId?: string;
  category: string;
  description?: string;
}

// Review types
export interface CreateReviewRequest {
  appointmentId?: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  categories?: ReviewCategories;
}

export interface ReviewCategories {
  communication: number;
  professionalism: number;
  effectiveness: number;
  punctuality: number;
  overall: number;
}

// Search and filter types
export interface SearchProvidersRequest {
  specialties?: string[];
  languages?: string[];
  ageGroups?: string[];
  serviceAreas?: string[];
  remoteAvailable?: boolean;
  inPersonAvailable?: boolean;
  minRate?: number;
  maxRate?: number;
  availability?: {
    day: string;
    time: string;
  };
  page?: number;
  limit?: number;
}

export interface SearchAppointmentsRequest {
  status?: AppointmentStatus[];
  serviceType?: ServiceType[];
  startDate?: string;
  endDate?: string;
  providerId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

// Notification types
export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
}

// Email types
export interface EmailTemplate {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Database query types
export interface WhereClause {
  [key: string]: any;
}

export interface OrderByClause {
  [key: string]: 'asc' | 'desc';
}



