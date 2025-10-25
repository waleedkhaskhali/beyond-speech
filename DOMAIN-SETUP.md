# 🌐 Domain Connection Guide

## Step-by-Step Domain Setup

### 1. **Choose Your Deployment Strategy**

#### **Option A: Vercel (Recommended)**
- ✅ Easiest setup
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier available

#### **Option B: Netlify + Backend Service**
- ✅ Good for static sites
- ✅ Easy domain setup
- ⚠️ Need separate backend hosting

#### **Option C: VPS/Server**
- ✅ Full control
- ✅ Can host both frontend and backend
- ⚠️ More complex setup

---

## 🚀 **Quick Setup with Vercel**

### Step 1: Deploy Frontend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy your app:**
   ```bash
   # From your project root
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Choose your framework (Next.js)
   - Set build settings

### Step 2: Deploy Backend

**Option A: Railway (Recommended for backend)**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Select the `backend` folder
4. Add environment variables
5. Deploy

**Option B: Render**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your repo
4. Set build command: `cd backend && npm install && npm run build`
5. Set start command: `cd backend && npm start`

### Step 3: Connect Your Domain

#### **For Vercel:**
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain name
6. Follow DNS instructions

#### **DNS Configuration:**
You'll need to add these DNS records:

**For Vercel:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

**For your backend (if using Railway/Render):**
```
Type: CNAME
Name: api
Value: your-backend-url.railway.app
```

### Step 4: Update Environment Variables

#### **Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
```

#### **Backend (.env):**
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
# ... other production variables
```

---

## 🔧 **Alternative: Full VPS Setup**

If you prefer full control, here's how to set up on a VPS:

### 1. **Server Setup (Ubuntu/Debian)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

### 2. **Deploy Your Application**
```bash
# Clone your repo
git clone https://github.com/yourusername/beyond-speech.git
cd beyond-speech

# Install dependencies
npm install
cd backend && npm install

# Build the application
npm run build
cd backend && npm run build
```

### 3. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. **Start Services**
```bash
# Start with PM2
pm2 start npm --name "frontend" -- start
pm2 start backend/index.js --name "backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. **SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📋 **Domain DNS Settings**

### **Common DNS Records:**

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ | Your server IP | Root domain |
| CNAME | www | yourdomain.com | WWW subdomain |
| CNAME | api | your-backend-url.com | API subdomain |

### **Popular Domain Providers:**

**Cloudflare (Recommended):**
1. Add your domain to Cloudflare
2. Update nameservers at your domain registrar
3. Add DNS records in Cloudflare dashboard

**GoDaddy:**
1. Go to DNS Management
2. Add/Edit DNS records
3. Save changes

**Namecheap:**
1. Go to Advanced DNS
2. Add new records
3. Save changes

---

## ✅ **Testing Your Setup**

1. **Check DNS propagation:**
   ```bash
   nslookup yourdomain.com
   ```

2. **Test your site:**
   - Visit `https://yourdomain.com`
   - Test contact form
   - Check API endpoints

3. **SSL Check:**
   - Visit `https://www.ssllabs.com/ssltest/`
   - Enter your domain

---

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Domain not loading:**
   - Check DNS propagation (can take 24-48 hours)
   - Verify DNS records are correct
   - Check if your app is running

2. **SSL issues:**
   - Ensure SSL certificate is installed
   - Check certificate expiration
   - Verify HTTPS redirects

3. **API not working:**
   - Check CORS settings
   - Verify backend URL in frontend
   - Check environment variables

### **Need Help?**
- Check your hosting provider's documentation
- Verify all environment variables are set
- Test locally first before deploying
- Check server logs for errors

---

## 🎯 **Next Steps After Domain Setup**

1. **Set up monitoring** (UptimeRobot, Pingdom)
2. **Configure backups** for your database
3. **Set up analytics** (Google Analytics)
4. **Configure email** for production
5. **Set up error tracking** (Sentry)

Your Beyond Speech platform will be live at your domain! 🚀
