# Development Setup Guide

Complete instructions for setting up the HEJ PAPA application for local development.

## Prerequisites

**System Requirements:**
- Node.js 16+ (recommended: 18 LTS)
- npm or yarn package manager
- Git
- For iOS: Mac with Xcode
- For Android: Android Studio or Android SDK

**Verify Installation:**
```bash
node --version     # Should be v16+
npm --version      # Should be 8+
```

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secure-random-key-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006
DB_PATH=./data/tata.db
```

**To generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Initialize Database

On first run, seed the database with content:
```bash
npm run seed
```

This creates `data/tata.db` with:
- Database schema (users, weeks, checkups, shopping, etc.)
- All pregnancy week data (40+ weeks)
- Medical checkup information
- Shopping lists and costs
- Birth preparation guide
- 4th trimester postpartum info

### 5. Start Development Server

```bash
npm run dev
```

Expected output:
```
HEJ PAPA Backend uruchomiony na porcie 3000
API: http://localhost:3000/api
```

### 6. Verify Backend is Running

Test health endpoint:
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","app":"HEJ PAPA","version":"1.0.0"}
```

## Mobile App Setup

### 1. Navigate to Mobile Directory
```bash
cd mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Edit `src/config/env.ts` to match your backend setup:

**For local machine with Expo Go:**
```typescript
development: {
  apiBaseUrl: 'http://192.168.0.36:3000/api',  // YOUR machine's IP
  apiTimeout: 30000,
  logLevel: 'debug',
}
```

**Finding your machine's IP:**
```bash
# macOS/Linux:
ifconfig | grep "inet "

# Windows:
ipconfig | findstr "IPv4"
```

### 4. Install Expo CLI (Optional but Recommended)

```bash
npm install -g expo-cli
```

### 5. Start Development Server

```bash
npm start
```

Expected output:
```
To open the app:
  - Press 's' to open Expo Go and scan the QR code
  - Press 'w' to open in web browser
  - Press 'a' to open Android emulator
  - Press 'i' to open iOS Simulator
```

### 6. Open App

**Option A: Web Browser (Recommended for PC development)**
```bash
npm run web
# or press 'w' in the Expo CLI menu
```
- Opens automatically at http://localhost:19006

**Option B: Expo Go (Physical Device)**
1. Install Expo Go on your phone (iPhone or Android)
2. Press 's' in CLI
3. Scan QR code with phone
4. App opens in Expo Go

**Option C: Android Emulator**
1. Open Android Studio
2. Start a virtual device
3. Press 'a' in CLI

**Option D: iOS Simulator (macOS only)**
1. Press 'i' in CLI
2. Recommended: Build with Xcode for better control

## Verify Full Stack

### 1. Backend Running ✓
```bash
curl http://localhost:3000/api/health
```

### 2. Mobile App Running ✓
- Web: http://localhost:19006
- Or: App opened in emulator/device

### 3. Test Login Flow
1. Go to app's Register screen
2. Create test account:
   - Email: `test@example.com`
   - Password: `password123`
   - Partner conception date: Pick a date ~20 weeks ago
3. Should see home screen with pregnancy progress
4. Navigate between tabs (Home, Week Detail, Action Cards, Dad Module)

### 4. Test Data Endpoints
```bash
# Get all weeks
curl http://localhost:3000/api/weeks/all

# Get week 20
curl http://localhost:3000/api/weeks/20

# Get checkups
curl http://localhost:3000/api/checkups

# Get shopping list
curl http://localhost:3000/api/shopping
```

## Troubleshooting

### Backend Issues

**Port Already in Use**
```bash
# Change PORT in .env or kill the process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

**Database Error**
```bash
# Delete and recreate database
rm data/tata.db
npm run seed
```

**JWT Secret Error**
```bash
# Make sure JWT_SECRET is set in .env
# Don't use special shell characters without quotes
JWT_SECRET="your-secret-key"
```

### Mobile App Issues

**Can't Connect to Backend**
1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check IP address in `src/config/env.ts` matches your machine
3. Ensure device/emulator is on same network
4. Try `http://10.0.2.2:3000/api` for Android emulator

**Blank White Screen**
```bash
# Clear cache and restart
npm start -- --clear

# Or manually:
rm -rf node_modules/.cache
npm start
```

**Module Not Found Error**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm start
```

**Hot Reload Not Working**
1. Save file again (sometimes needs 2 saves)
2. Manually reload app (R key in CLI)
3. Restart: Ctrl+C and `npm start`

## Development Tips

### Hot Reload
- Mobile: Saves automatically reflect in 1-2 seconds
- Just keep editing and watch the app update

### Debug Logs
- Mobile: Open Metro Bundler logs in CLI
- Backend: Logs appear in terminal
- Browser DevTools: F12 in web version

### Database Inspection
```bash
# Install sqlite3 CLI
npm install -g sqlite3

# Open database
sqlite3 data/tata.db

# View tables
.tables

# Query data
SELECT * FROM users;
SELECT * FROM weeks WHERE week_number = 20;
```

### Restart Everything
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Mobile
cd mobile
npm start

# Terminal 3 (optional): Database management
sqlite3 data/tata.db
```

## Environment-Specific Setup

### Staging Environment
```bash
# Backend
NODE_ENV=staging npm start

# Mobile src/config/env.ts
staging: {
  apiBaseUrl: 'https://staging-api.yourdomain.com/api',
  apiTimeout: 30000,
  logLevel: 'info',
}
```

### Production
See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Common Configuration Mistakes

❌ Not updating API URL in `src/config/env.ts`
✅ Set to your machine's IP or localhost based on platform

❌ Frontend/backend on different machines without public IP
✅ Use same machine or ensure network connectivity

❌ Forgetting `.env` file setup
✅ Always copy `.env.example` and modify values

❌ Old database causing schema errors
✅ Delete `data/tata.db` and re-seed

## Next Steps

1. **Explore codebase:** Look at `/backend/src/routes` and `/mobile/src/screens`
2. **Make changes:** Start with small UI changes in screens
3. **Test flow:** Register → Login → Browse content
4. **Read code:** Understand theme system in `/mobile/src/theme/`
5. **Check API:** Browse `/backend/src/routes/` to see available endpoints

## Getting Help

- Check logs: `npm start` shows detailed error messages
- Test backend directly: `curl` commands in "Verify Full Stack"
- Restart services: Sometimes things get stuck
- Clear cache: `npm start -- --clear`

---

**Need Help?** Check the [README.md](./README.md) or contact the development team.
