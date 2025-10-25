import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@beyondspeech.com' },
    update: {},
    create: {
      email: 'admin@beyondspeech.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample SLP provider
  const slpPassword = await bcrypt.hash('password123', 12);
  const slpUser = await prisma.user.upsert({
    where: { email: 'slp@example.com' },
    update: {},
    create: {
      email: 'slp@example.com',
      password: slpPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1-555-0123',
      role: 'SLP',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    }
  });

  const slpProfile = await prisma.providerProfile.upsert({
    where: { userId: slpUser.id },
    update: {},
    create: {
      userId: slpUser.id,
      licenseNumber: 'SLP-12345',
      licenseState: 'NY',
      specialties: ['Articulation', 'Language Development', 'Fluency'],
      certifications: ['ASHA Certified', 'PROMPT Trained'],
      experience: 8,
      education: [
        {
          degree: 'Master of Science',
          institution: 'New York University',
          year: 2015,
          field: 'Speech-Language Pathology'
        }
      ],
      bio: 'Experienced speech-language pathologist specializing in pediatric language development and articulation disorders.',
      hourlyRate: 120,
      availability: {
        monday: [{ start: '09:00', end: '17:00', available: true }],
        tuesday: [{ start: '09:00', end: '17:00', available: true }],
        wednesday: [{ start: '09:00', end: '17:00', available: true }],
        thursday: [{ start: '09:00', end: '17:00', available: true }],
        friday: [{ start: '09:00', end: '15:00', available: true }],
        saturday: [],
        sunday: []
      },
      timezone: 'America/New_York',
      remoteAvailable: true,
      inPersonAvailable: true,
      serviceAreas: ['New York', 'New Jersey', 'Connecticut'],
      languages: ['English', 'Spanish'],
      ageGroups: ['Preschool', 'School Age', 'Adolescent'],
      insuranceAccepted: true,
      privatePayOnly: false,
      licenseVerified: true,
      backgroundCheck: true
    }
  });

  console.log('✅ SLP provider created:', slpUser.email);

  // Create sample family
  const familyPassword = await bcrypt.hash('password123', 12);
  const familyUser = await prisma.user.upsert({
    where: { email: 'family@example.com' },
    update: {},
    create: {
      email: 'family@example.com',
      password: familyPassword,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1-555-0456',
      role: 'FAMILY',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      address: {
        street: '456 Oak Ave',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        country: 'USA'
      }
    }
  });

  const familyProfile = await prisma.familyProfile.upsert({
    where: { userId: familyUser.id },
    update: {},
    create: {
      userId: familyUser.id,
      primaryContact: true,
      relationship: 'Parent',
      preferredLanguage: 'English',
      culturalBackground: 'American',
      clientName: 'Emma Smith',
      clientDateOfBirth: new Date('2018-03-15'),
      clientNeeds: ['Articulation', 'Language Development'],
      clientGoals: 'Improve speech clarity and expand vocabulary',
      previousTherapy: false,
      schedulingPrefs: {
        preferredDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTimes: ['After 3:00 PM'],
        remotePreferred: true
      },
      communicationPrefs: {
        method: 'email',
        frequency: 'weekly',
        language: 'English'
      }
    }
  });

  console.log('✅ Family profile created:', familyUser.email);

  // Create sample appointment
  const appointment = await prisma.appointment.create({
    data: {
      clientId: familyUser.id,
      providerId: slpProfile.id,
      serviceType: 'SPEECH_THERAPY',
      title: 'Initial Assessment - Emma Smith',
      description: 'Initial speech and language assessment for 5-year-old client',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
      duration: 60,
      status: 'SCHEDULED',
      isRemote: true,
      location: 'Virtual Session',
      notes: 'Client shows interest in books and enjoys interactive activities',
      goals: 'Assess current speech and language abilities, establish baseline',
      materials: ['Assessment tools', 'Picture books', 'Interactive games'],
      hourlyRate: 120,
      totalAmount: 120,
      paymentStatus: 'PENDING'
    }
  });

  console.log('✅ Sample appointment created');

  // Create sample message
  const message = await prisma.message.create({
    data: {
      senderId: slpUser.id,
      receiverId: familyUser.id,
      appointmentId: appointment.id,
      content: 'Hi! I\'m looking forward to meeting Emma next week. Please make sure you have a quiet space for our virtual session.',
      messageType: 'text',
      isRead: false
    }
  });

  console.log('✅ Sample message created');

  // Create system settings
  const settings = [
    {
      key: 'platform_name',
      value: 'Beyond Speech',
      description: 'The name of the platform'
    },
    {
      key: 'default_hourly_rate',
      value: 100,
      description: 'Default hourly rate for providers'
    },
    {
      key: 'max_appointment_duration',
      value: 120,
      description: 'Maximum appointment duration in minutes'
    },
    {
      key: 'cancellation_policy_hours',
      value: 24,
      description: 'Hours before appointment when cancellation is allowed'
    },
    {
      key: 'email_notifications_enabled',
      value: true,
      description: 'Whether email notifications are enabled'
    }
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting
    });
  }

  console.log('✅ System settings created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample accounts created:');
  console.log('Admin: admin@beyondspeech.com / admin123');
  console.log('SLP Provider: slp@example.com / password123');
  console.log('Family: family@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



