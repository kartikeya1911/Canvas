# 🚀 ColabCanvas Deployment Guide - Vercel + Railway

## ✅ Deployment Status

### Frontend (Vercel)
- **Status**: ✅ DEPLOYED
- **URL**: https://collab-canvas-9mo2qnika-jainkartikeya9-gmailcoms-projects.vercel.app
- **Platform**: Vercel
- **Auto-deploys**: Yes (on git push to main)

### Backend (Railway/Render)
- **Status**: ⏳ PENDING (Follow steps below)
- **Platform Options**: Railway.app or Render.com
- **Required**: MongoDB Atlas + Environment Variables

---

## 📋 Backend Deployment Steps

### Option 1: Deploy on Railway (Recommended)

#### 1. Set up MongoDB Atlas (Free)
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (choose free tier)
4. Set up database access:
   - Go to "Database Access"
   - Add New Database User
   - Username: colabcanvas
   - Password: Generate a secure password (save it!)
   - Database User Privileges: Read and write to any database

5. Set up network access:
   - Go to "Network Access"
   - Add IP Address: 0.0.0.0/0 (Allow from anywhere)

6. Get connection string:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace <password> with your database password
   - Example: mongodb+srv://colabcanvas:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/colabcanvas?retryWrites=true&w=majority
```

#### 2. Deploy Backend on Railway
```
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository: kartikeya1911/Canvas
6. Railway will auto-detect and deploy

7. Add Environment Variables:
   - Click on your deployment
   - Go to "Variables" tab
   - Add these variables:

   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=colabcanvas_super_secret_key_2024_production
   CLIENT_URL=https://collab-canvas-9mo2qnika-jainkartikeya9-gmailcoms-projects.vercel.app
   NODE_ENV=production

8. Get your Railway URL:
   - Click "Settings" → "Domains"
   - Generate domain
   - Copy the URL (e.g., https://canvas-production.up.railway.app)
```

#### 3. Update Frontend Environment Variables on Vercel
```
1. Go to https://vercel.com/dashboard
2. Select your project: collab-canvas
3. Go to "Settings" → "Environment Variables"
4. Add/Update:
   Name: REACT_APP_BACKEND_URL
   Value: <your-railway-url>
   Environment: Production

5. Redeploy:
   - Go to "Deployments"
   - Click ⋯ on latest deployment
   - Select "Redeploy"
```

---

### Option 2: Deploy on Render

#### 1. Set up MongoDB Atlas (Same as above)

#### 2. Deploy Backend on Render
```
1. Go to https://render.com
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository: kartikeya1911/Canvas
5. Configure:
   - Name: colabcanvas-backend
   - Root Directory: server
   - Environment: Node
   - Build Command: npm install
   - Start Command: npm start
   - Plan: Free

6. Add Environment Variables:
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=colabcanvas_super_secret_key_2024_production
   CLIENT_URL=https://collab-canvas-9mo2qnika-jainkartikeya9-gmailcoms-projects.vercel.app
   NODE_ENV=production
   PORT=5000

7. Click "Create Web Service"
8. Copy the deployment URL (e.g., https://colabcanvas-backend.onrender.com)
```

#### 3. Update Frontend on Vercel (Same as Railway Option 3)

---

## 🔄 Automatic Deployments

### Frontend (Already Set Up)
- Pushes to `main` branch automatically deploy to Vercel
- Preview deployments for pull requests

### Backend
- **Railway**: Auto-deploys on git push
- **Render**: Auto-deploys on git push

---

## 🧪 Testing Your Deployment

### 1. Test Backend API
```bash
# Replace <backend-url> with your Railway/Render URL
curl https://<backend-url>/api/auth/me

# Expected response:
{"message":"Not authorized, no token"}
```

### 2. Test Frontend
```
1. Open: https://collab-canvas-9mo2qnika-jainkartikeya9-gmailcoms-projects.vercel.app
2. Click "Sign Up"
3. Create an account
4. Should successfully register and redirect to dashboard
```

---

## 📊 Monitoring

### Frontend (Vercel)
- Dashboard: https://vercel.com/dashboard
- View logs, analytics, performance metrics

### Backend (Railway)
- Dashboard: https://railway.app/dashboard
- View logs, metrics, deployments

### Backend (Render)
- Dashboard: https://dashboard.render.com
- View logs, metrics, deployments (Note: Free tier sleeps after 15min inactivity)

---

## 🐛 Troubleshooting

### Frontend can't reach backend
- Check CORS settings in server/server.js
- Verify REACT_APP_BACKEND_URL is correct on Vercel
- Ensure backend is deployed and running

### Backend won't start
- Check MongoDB connection string is correct
- Verify all environment variables are set
- Check logs on Railway/Render dashboard

### MongoDB connection issues
- Verify IP whitelist includes 0.0.0.0/0
- Check username and password in connection string
- Ensure database user has correct permissions

---

## 💡 Tips

1. **Always use environment variables for secrets**
2. **MongoDB Atlas free tier is sufficient for development**
3. **Railway free tier: $5 credit/month**
4. **Render free tier: Sleeps after 15min (upgrade for 24/7)**
5. **Monitor your usage to avoid unexpected costs**

---

## 🔗 Useful Links

- **Frontend**: https://collab-canvas-9mo2qnika-jainkartikeya9-gmailcoms-projects.vercel.app
- **GitHub Repo**: https://github.com/kartikeya1911/Canvas
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## ✅ Deployment Checklist

- [x] Frontend deployed on Vercel
- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed on Railway or Render
- [ ] Environment variables configured on backend
- [ ] Backend URL updated on Vercel
- [ ] Frontend redeployed with new backend URL
- [ ] Test registration and login
- [ ] Test board creation and real-time collaboration

---

**Need help?** Check the logs on each platform's dashboard or open an issue on GitHub.
