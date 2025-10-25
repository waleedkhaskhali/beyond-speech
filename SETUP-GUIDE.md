# 🚀 Beyond Speech - Quick Setup Guide

## ⚡ **Quick Start (5 minutes)**

### 1. **Set up the Backend**

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# The .env file is already created - you can edit it if needed
# For now, the default settings will work for testing

# Set up the database (choose one option below)
```

### 2. **Database Setup Options**

#### **Option A: Use SQLite (Easiest - No PostgreSQL needed)**
```bash
# Edit the .env file and change DATABASE_URL to:
DATABASE_URL="file:./dev.db"

# Then run:
npm run db:push
npm run db:seed
```

#### **Option B: Use PostgreSQL (Production-ready)**
```bash
# Make sure PostgreSQL is running
brew services start postgresql  # macOS
# or
sudo service postgresql start   # Linux

# Create database
createdb beyond_speech_db

# The .env file already has the correct DATABASE_URL
# Just run:
npm run db:push
npm run db:seed
```

### 3. **Start the Backend**
```bash
npm run dev
```

### 4. **Set up the Frontend**
```bash
# Open a new terminal and go to the root directory
cd ..

# Install dependencies (if not already done)
npm install

# Create environment file
cp env.local.example .env.local

# Start the frontend
npm run dev
```

## 🎯 **Test Your Setup**

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test the Contact Form:**
   - Go to `http://localhost:3000`
   - Fill out the contact form
   - Submit it
   - Check the success message!

3. **View the Database:**
   ```bash
   cd backend
   npm run db:studio
   # Opens at http://localhost:5555
   ```

## 🗄️ **What's Stored in the Database**

When someone fills out your contact form, it creates:

- **User account** with email and basic info
- **Role-specific profile** (family/provider/school)
- **Welcome email** sent to user
- **Admin notification** sent to you

## 📧 **Email Setup (Optional)**

To receive real emails, edit `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@beyondspeech.com
```

## 🎉 **You're Ready!**

Your contact form is now:
- ✅ **Connected to backend API**
- ✅ **Saving data to database**
- ✅ **Sending email notifications**
- ✅ **Creating user accounts**
- ✅ **Handling different user types**

## 🐛 **Troubleshooting**

### **"Prisma client not initialized" error:**
```bash
cd backend
npm run db:generate
```

### **Database connection error:**
- For SQLite: Make sure the file path is correct
- For PostgreSQL: Make sure PostgreSQL is running

### **Form submission fails:**
- Check if backend is running on port 3001
- Check browser console for errors
- Verify .env.local has correct API URL

## 🚀 **Next Steps**

1. **Test with different user types** (family, SLP, school)
2. **Set up email** for real notifications
3. **Add authentication** pages
4. **Create user dashboards**
5. **Add provider search**

Your Beyond Speech platform is now fully functional! 🎉



