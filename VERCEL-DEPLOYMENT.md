# 🚀 Vercel Deployment Guide for Beyond Speech

## Prerequisites
- GitHub account
- Vercel account (free at [vercel.com](https://vercel.com))
- Your domain name

## Step 1: Push to GitHub

### 1.1 Initialize Git (if not already done)
```bash
# In your project root
git init
git add .
git commit -m "Initial commit - Beyond Speech app"
```

### 1.2 Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `beyond-speech`
4. Make it **Public** (required for free Vercel)
5. Don't initialize with README (you already have files)
6. Click "Create repository"

### 1.3 Push to GitHub
```bash
# Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/beyond-speech.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your `beyond-speech` repository
5. Vercel will auto-detect it's a Next.js project

### 2.2 Configure Build Settings
Vercel should auto-detect these settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

### 2.3 Set Environment Variables
In Vercel dashboard, go to your project → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

### 2.4 Deploy
Click "Deploy" and wait for the build to complete!

## Step 3: Deploy Backend to Railway

### 3.1 Prepare Backend for Railway
```bash
# Create a railway.json in your backend folder
cd backend
```

### 3.2 Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `beyond-speech` repository
5. Choose "Deploy from folder" → Select `backend` folder
6. Railway will auto-detect Node.js

### 3.3 Configure Railway Environment Variables
In Railway dashboard, add these variables:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-app.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### 3.4 Get Backend URL
After deployment, Railway will give you a URL like:
`https://beyond-speech-production.up.railway.app`

## Step 4: Update Frontend API URL

### 4.1 Update Vercel Environment Variables
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` to your Railway backend URL
3. Redeploy your frontend

### 4.2 Update API Configuration
Update your frontend API calls to use the new backend URL.

## Step 5: Connect Your Domain

### 5.1 Add Domain in Vercel
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain name (e.g., `yourdomain.com`)
4. Click "Add"

### 5.2 Configure DNS
Vercel will show you DNS records to add:

**For your domain registrar:**
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### 5.3 Wait for DNS Propagation
- DNS changes can take 5 minutes to 48 hours
- Check with: `nslookup yourdomain.com`

## Step 6: SSL Certificate
Vercel automatically provides SSL certificates for your domain!

## Step 7: Test Your Deployment

### 7.1 Test Frontend
- Visit `https://yourdomain.com`
- Check if the site loads correctly
- Test the contact form

### 7.2 Test Backend
- Visit `https://your-backend-url.railway.app/health`
- Should return: `{"status":"ok","timestamp":"..."}`

### 7.3 Test Full Flow
1. Fill out the contact form on your site
2. Check if it submits successfully
3. Check your email for notifications

## Troubleshooting

### Common Issues:

**1. Build Fails:**
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Check for TypeScript errors

**2. API Not Working:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Test backend URL directly

**3. Domain Not Loading:**
- Check DNS propagation: `nslookup yourdomain.com`
- Verify DNS records are correct
- Wait for DNS propagation (up to 48 hours)

**4. SSL Issues:**
- Vercel handles SSL automatically
- If issues persist, check domain configuration

## Next Steps After Deployment

1. **Set up monitoring** (UptimeRobot)
2. **Configure backups** for your database
3. **Set up analytics** (Google Analytics)
4. **Configure production email** settings
5. **Set up error tracking** (Sentry)

## Cost Breakdown

- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Railway**: $5/month for backend hosting
- **Domain**: $10-15/year (depending on provider)
- **Total**: ~$5-10/month

Your Beyond Speech platform will be live! 🎉
