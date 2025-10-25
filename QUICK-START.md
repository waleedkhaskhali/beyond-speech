# 🚀 Beyond Speech - Quick Start Guide

## 🎯 **The Issue You're Facing**

You're getting a Prisma client error because the database isn't set up yet. Here's how to fix it:

## ⚡ **Quick Fix (2 minutes)**

### **Step 1: Start PostgreSQL**
```bash
# macOS (if you have Homebrew)
brew services start postgresql

# macOS (if you installed PostgreSQL manually)
pg_ctl -D /usr/local/var/postgres start

# Linux
sudo service postgresql start

# Windows
# Start PostgreSQL service from Services panel
```

### **Step 2: Run the Setup Script**
```bash
cd backend
./start-backend.sh
```

That's it! The script will:
- ✅ Check if PostgreSQL is running
- ✅ Create the database
- ✅ Generate Prisma client
- ✅ Set up the database schema
- ✅ Add sample data
- ✅ Start the backend server

## 🔧 **Manual Setup (if script doesn't work)**

### **1. Create Database**
```bash
# Create the database
createdb -h localhost -U postgres beyond_speech_db
```

### **2. Generate Prisma Client**
```bash
cd backend
npm run db:generate
```

### **3. Push Schema**
```bash
npm run db:push
```

### **4. Seed Database**
```bash
npm run db:seed
```

### **5. Start Backend**
```bash
npm run dev
```

## 🎉 **Test Your Setup**

### **1. Check Backend Health**
```bash
curl http://localhost:3001/health
```
Should return: `{"status":"OK","timestamp":"...","uptime":...}`

### **2. Test Your Contact Form**
1. Go to `http://localhost:3000`
2. Fill out the contact form
3. Submit it
4. See success message!

### **3. View Database**
```bash
cd backend
npm run db:studio
# Opens at http://localhost:5555
```

## 🗄️ **What Happens When You Submit the Form**

1. **Form data** → Backend API (`/api/contact/submit`)
2. **Creates user account** in PostgreSQL database
3. **Creates role-specific profile** (family/provider/school)
4. **Sends welcome email** (if email is configured)
5. **Shows success message** to user

## 📧 **Email Setup (Optional)**

To receive real emails, edit `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@beyondspeech.com
```

## 🐛 **Common Issues & Solutions**

### **"PostgreSQL is not running"**
```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start
```

### **"Database does not exist"**
```bash
createdb -h localhost -U postgres beyond_speech_db
```

### **"Prisma client not initialized"**
```bash
cd backend
npm run db:generate
```

### **"Permission denied" on script**
```bash
chmod +x start-backend.sh
```

## 🎯 **Your Contact Form is Now:**

- ✅ **Connected to backend API**
- ✅ **Saving data to PostgreSQL**
- ✅ **Creating user accounts**
- ✅ **Handling different user types**
- ✅ **Sending email notifications**
- ✅ **Showing success/error messages**

## 🚀 **Next Steps**

1. **Test with different user types** (family, SLP, school)
2. **Set up email** for real notifications
3. **Add authentication** pages
4. **Create user dashboards**

Your Beyond Speech platform is now fully functional! 🎉

---

**Need help?** The setup script (`./start-backend.sh`) will guide you through everything automatically!



