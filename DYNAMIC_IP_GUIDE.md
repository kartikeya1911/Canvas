# 🎨 ColabCanvas - Dynamic IP Address Support

## ✅ What Changed?

The server now **automatically detects your device's IP address** when it starts, so you don't need to hardcode it!

## 🚀 How It Works

1. **Auto IP Detection**: When you start the server, it scans your network interfaces and finds your local IP address
2. **Dynamic CORS**: Automatically allows requests from both `localhost` and your detected IP
3. **Smart Share Links**: All share links automatically use your current IP address
4. **Multi-Device Support**: Works on any WiFi network, anywhere!

## 📱 Quick Start

### Option 1: Use the Startup Script (Easiest!)

**Windows (CMD):**
```bash
start.bat
```

**Windows (PowerShell):**
```powershell
.\start.ps1
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## 🌐 Server Startup Info

When the server starts, you'll see:

```
╔═══════════════════════════════════════════════════════════╗
║         🎨 ColabCanvas Server Started Successfully       ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on port: 5000
📍 Local IP Address: 192.168.1.19

📱 Access URLs:
   • Local:    http://localhost:5000
   • Network:  http://192.168.1.19:5000

🌐 Frontend URLs:
   • Local:    http://localhost:3000
   • Network:  http://192.168.1.19:3000

📡 Socket.IO ready for real-time collaboration
🔗 Share links will use: http://192.168.1.19:3000

✅ Ready to accept connections!
```

## 📤 Sharing with Other Devices

1. **Open the board** you want to share
2. **Click the Share button** (🔗 icon)
3. **Copy the link** - it will automatically have your current IP address
4. **Paste on any device** connected to the same WiFi network
5. **Collaborate in real-time!** ✨

## 🔧 Technical Details

### Auto IP Detection
- Uses Node.js `os.networkInterfaces()` to scan network adapters
- Filters for IPv4, non-loopback addresses
- Automatically updates CORS and share links

### Global Variables
- `global.CLIENT_URL` - Stores the detected IP-based frontend URL
- Used across all controllers for consistent share links

### Fallback Chain
```javascript
// Priority order:
1. global.CLIENT_URL (auto-detected)
2. process.env.CLIENT_URL (from .env)
3. 'http://localhost:3000' (fallback)
```

## 🎯 Benefits

✅ **No Configuration** - Works out of the box  
✅ **Any Network** - Adapts to different WiFi networks  
✅ **Any Device** - Phone, tablet, laptop, desktop  
✅ **Real-time Collaboration** - See online members and changes instantly  
✅ **Easy Sharing** - One-click copy and share  

## 🔒 Security Notes

- Only devices on the **same WiFi network** can access
- Anonymous access can be disabled per board
- Permission levels: Viewer (read-only) or Editor (full access)

## 💡 Pro Tips

- **Moving between networks?** Just restart the server - it will auto-detect the new IP!
- **Want to disable anonymous access?** Toggle it off in the Share modal settings
- **Need to change permissions?** Update the default permission level before sharing

Enjoy collaborating! 🎨✨
