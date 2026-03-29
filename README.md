# HEJ PAPA - Tata W Akcji

Educational application for expectant fathers, partners, and co-parents to prepare for and understand pregnancy, birth, and the postpartum period.

**Available in Polish** | "Hej Papa" (Hey Papa) | "Tata W Akcji" (Dad In Action)

## Features

### 📚 Comprehensive Pregnancy Guide
- **Week-by-week tracking** - Follow fetal development across all 40+ weeks
- **Partner insights** - Understand what your partner experiences each week
- **Father tips** - Practical advice specific to dads' needs and roles
- **Trimester organization** - Structure information by pregnancy phase

### 👨‍👩‍👧 Dad Module - Emotional Support
- **Emotions exploration** - 6 common emotional states during and after pregnancy
- **Statistics** - Clinical data on postpartum depression in fathers
- **Internal conflicts** - Address common dilemmas and contradictions
- **Warning signs** - Identify symptoms requiring professional help
- **Relationship guidance** - Intimacy, communication, and partnership
- **Professional resources** - When and where to seek help

### 🏥 Medical Information
- **Checkup calendar** - Expected medical appointments by trimester
- **Birth preparation** - What to expect and how to support your partner
- **Hospital bag checklist** - Comprehensive packing guide
- **Fourth trimester guide** - First 12 weeks postpartum

### 💰 Planning Tools
- **Cost calculator** - Track and estimate pregnancy-related expenses
- **Shopping list** - Complete maternity and newborn shopping checklist
- **Budget breakdown** - Costs organized by trimester and category

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 4.21
- **Database:** SQLite 3 (better-sqlite3)
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Security:** bcryptjs (2.4.3)

### Mobile/Web Frontend
- **Framework:** React Native 0.77
- **Build tool:** Expo 54.0
- **Language:** TypeScript 5.8
- **Navigation:** React Navigation 6.x
- **State Management:** React Context API
- **Styling:** React Native StyleSheet with custom theme system
- **Storage:** AsyncStorage (token persistence)

### Deployment
- **Web:** Expo (Expo Go, EAS Build, or web export)
- **Backend:** Node.js server (Heroku, AWS, self-hosted)
- **Database:** SQLite (local file) or PostgreSQL (production)

## Project Structure

```
Aplikacja/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── db/                # Database schema & seeding
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # API endpoints
│   │   └── server.js          # Express app entry point
│   ├── .env                   # Environment configuration
│   ├── .env.example           # Configuration template
│   ├── Procfile               # Heroku deployment config
│   └── package.json
│
├── mobile/                     # React Native/Expo app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth & Theme context
│   │   ├── screens/           # App screens
│   │   ├── services/          # API client
│   │   ├── config/            # Environment config
│   │   └── theme/             # Design system
│   ├── App.tsx                # Entry point
│   ├── app.json               # Expo configuration
│   └── package.json
│
└── [Documentation files]
```

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo Go (for mobile development)

### Backend Setup

```bash
cd backend
npm install
npm run seed          # Initialize database
npm run dev           # Start development server (port 3000)
```

For production:
```bash
NODE_ENV=production npm start
```

See [SETUP.md](./SETUP.md) for detailed instructions.

### Mobile App Setup

```bash
cd mobile
npm install
npm start             # Start Expo development server
```

**For web (local development):**
```bash
npm run web
```

**For Android:**
```bash
npm run android
```

**For iOS:**
```bash
npm run ios
```

## Configuration

### Environment Variables

**Backend (.env):**
- `NODE_ENV` - development/staging/production
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT signing (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
- `DB_PATH` - SQLite database file path

**Mobile (src/config/env.ts):**
- API URLs per environment
- Request timeout configuration
- Log levels per environment

See `.env.example` for template.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Data Endpoints
- `GET /api/weeks/current` - Current pregnancy week
- `GET /api/weeks/:weekNumber` - Specific week data
- `GET /api/weeks/all` - All weeks (40-42)
- `GET /api/checkups` - All medical checkups
- `GET /api/shopping` - Shopping list items
- `GET /api/birth/preparation` - Birth preparation guide
- `GET /api/fourth-trimester` - Postpartum guidance

See [API.md](./API.md) for complete documentation.

## Security

- **Passwords:** Hashed with bcryptjs (salt rounds: 10)
- **Authentication:** JWT tokens with 30-day expiration
- **API Communication:** HTTPS (enforced in production)
- **CORS:** Whitelist allowed origins
- **Headers:** Security headers (Content-Type, X-Frame-Options, HSTS)
- **Input Validation:** Client and server-side validation

## Deployment

### Web Deployment Options

1. **Expo Web** (quick demo)
   ```bash
   cd mobile
   npm run web
   ```

2. **Heroku** (backend + Expo web)
   - See [DEPLOYMENT.md](./DEPLOYMENT.md)

3. **AWS/Self-hosted**
   - See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Mobile App Store Builds

- **iOS App Store** - Use Expo EAS Build
- **Google Play** - Use Expo EAS Build

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.

## Testing

```bash
# Backend
cd backend
npm test

# Mobile
cd mobile
npm test
```

## Development Workflow

1. **Start backend:** `cd backend && npm run dev`
2. **Start mobile:** `cd mobile && npm start`
3. **Pick platform:** web, ios, android
4. **Make changes** - Both hot-reload

## Environment Setup

| Environment | API URL | Purpose |
|------------|---------|---------|
| **development** | http://192.168.0.36:3000 | Local machine IP (configure for your network) |
| **staging** | https://staging-api.hejpapa.com | Testing before production |
| **production** | https://api.hejpapa.com | Live application |

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## License

Educational use - Contact for licensing details

## Support

For issues, questions, or feature requests, please open an GitHub issue or contact the development team.

---

**Status:** ✅ Production-ready
**Last Updated:** March 2026
**Version:** 1.0.0
