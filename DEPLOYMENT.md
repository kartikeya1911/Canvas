# ColabCanvas - Network Deployment Guide

## 🌐 Access from Other Devices on Same Network

Your ColabCanvas application is now configured to be accessible from other devices on your local network.

### 📍 Network Configuration

- **Your Computer IP**: `192.168.1.19`
- **Frontend URL**: `http://192.168.1.19:3000`
- **Backend URL**: `http://192.168.1.19:5000`

---

## 🚀 Quick Start Guide

### 1️⃣ Start MongoDB
Ensure MongoDB is running on your computer:
```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

If MongoDB is not running, start it:
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or run mongod manually
mongod --dbpath="C:\data\db"
```

### 2️⃣ Start the Backend Server
```bash
cd server
npm install  # Only needed first time
npm run dev
```

You should see:
```
🚀 ColabCanvas server running on port 5000
🌐 Client URL: http://192.168.1.19:3000
📡 Socket.IO ready for real-time collaboration
🔗 Access from other devices: http://192.168.1.19:5000
```

### 3️⃣ Start the Frontend Application
Open a new terminal:
```bash
cd client
npm install  # Only needed first time
npm start
```

The app will start and show:
```
Local:            http://localhost:3000
On Your Network:  http://192.168.1.19:3000
```

---

## 📱 Access from Other Devices

### From Mobile Phones, Tablets, or Other Computers on Same WiFi:

1. **Make sure all devices are on the same WiFi network**

2. **Open browser on the other device and navigate to:**
   ```
   http://192.168.1.19:3000
   ```

3. **That's it!** You can now:
   - Create an account
   - Create boards
   - Share boards with others
   - Collaborate in real-time

---

## 🔒 Firewall Configuration

If other devices cannot connect, you may need to allow the ports through Windows Firewall:

### Allow Ports 3000 and 5000:

**Option 1: Using PowerShell (Run as Administrator)**
```powershell
# Allow port 3000 (React Frontend)
New-NetFirewallRule -DisplayName "ColabCanvas Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow port 5000 (Backend Server)
New-NetFirewallRule -DisplayName "ColabCanvas Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**Option 2: Using Windows Firewall UI**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `3000` → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name it "ColabCanvas Frontend" → Finish
9. Repeat for port `5000` naming it "ColabCanvas Backend"

---

## 🌍 Testing the Connection

### Test Backend API:
From any device on your network, open browser and go to:
```
http://192.168.1.19:5000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "ColabCanvas server is running",
  "timestamp": "2025-11-29T..."
}
```

### Test Frontend:
Open browser and go to:
```
http://192.168.1.19:3000
```

You should see the ColabCanvas landing page.

---

## 📊 Sharing Boards

### Real-time Collaboration:
1. Create a board on any device
2. Click the "Share" button
3. Copy the invite link (it will use your network IP)
4. Share the link with others on the same network
5. Multiple users can draw and collaborate in real-time!

---

## 🔧 Troubleshooting

### Problem: Cannot access from other devices

**Solution 1: Check Firewall**
- Make sure ports 3000 and 5000 are allowed (see Firewall Configuration above)

**Solution 2: Verify IP Address**
```powershell
ipconfig | Select-String "IPv4"
```
If your IP has changed, update `.env` files with the new IP.

**Solution 3: Restart Services**
1. Stop both frontend and backend (Ctrl+C)
2. Restart backend first
3. Then restart frontend

### Problem: "Connection refused" or "CORS error"

**Solution:**
1. Make sure `.env` files are correctly updated
2. Restart both servers
3. Clear browser cache on the device accessing the app

### Problem: Socket connection fails

**Solution:**
1. Check that backend server is running
2. Verify Socket.IO logs in backend terminal
3. Check browser console for WebSocket errors
4. Ensure antivirus isn't blocking connections

---

## 🌐 Internet Deployment (Optional)

To make your app accessible from anywhere on the internet:

### Recommended Hosting Platforms:

**Frontend (React):**
- Vercel (Free tier available)
- Netlify (Free tier available)
- GitHub Pages
- AWS Amplify

**Backend (Node.js):**
- Render (Free tier available)
- Railway (Free tier available)
- Heroku (Paid)
- DigitalOcean
- AWS EC2

**Database (MongoDB):**
- MongoDB Atlas (Free tier: 512MB)
- DigitalOcean Managed MongoDB

### Quick Deploy to Render + MongoDB Atlas:

1. **Create MongoDB Atlas Database:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string
   - Update `MONGODB_URI` in server `.env`

2. **Deploy Backend to Render:**
   - Go to https://render.com
   - Connect your GitHub repository
   - Create new Web Service
   - Set build command: `cd server && npm install`
   - Set start command: `cd server && npm start`
   - Add environment variables from `server/.env`

3. **Deploy Frontend to Vercel:**
   - Go to https://vercel.com
   - Connect your GitHub repository
   - Set root directory: `client`
   - Update `REACT_APP_BACKEND_URL` to your Render backend URL
   - Deploy!

---

## 📝 Important Notes

1. **Network Security**: This configuration is for local network use only. For production, implement proper security measures.

2. **IP Address Changes**: If your computer's IP changes (common with DHCP), you'll need to update the `.env` files and restart the servers.

3. **Performance**: For best performance, ensure all devices are on a 5GHz WiFi network if available.

4. **MongoDB**: The MongoDB instance must be running on your computer for the app to work.

5. **Keep Terminals Open**: Both server and client terminals must remain open while using the app.

---

## 🎯 Access Summary

**From Your Computer:**
- Frontend: http://localhost:3000 or http://192.168.1.19:3000
- Backend: http://localhost:5000 or http://192.168.1.19:5000

**From Other Devices on Same Network:**
- Frontend: http://192.168.1.19:3000
- Backend: http://192.168.1.19:5000

---

## ✅ Checklist Before Sharing

- [ ] MongoDB is running
- [ ] Backend server is running (port 5000)
- [ ] Frontend app is running (port 3000)
- [ ] Firewall allows ports 3000 and 5000
- [ ] All devices are on the same WiFi network
- [ ] Tested health check: http://192.168.1.19:5000/api/health
- [ ] Tested frontend access: http://192.168.1.19:3000

---

**Need Help?** Check the main README.md for more information or refer to the troubleshooting section above.

**Happy Collaborating! 🎨✨**
