# HEJ PAPA - Tata W Akcji

Educational application for expectant fathers, partners, and co-parents to prepare for and understand pregnancy, birth, and the postpartum period.

**Available in Polish** | "Hej Papa" (Hey Papa) | "Tata W Akcji" (Dad In Action)

## Features

### Comprehensive Pregnancy Guide
- **Week-by-week tracking** - Follow fetal development across all 40+ weeks
- **Partner insights** - Understand what your partner experiences each week
- **Father tips** - Practical advice specific to dads' needs and roles
- **Trimester organization** - Structure information by pregnancy phase

### Dad Module - Emotional Support
- **Emotions exploration** - 6 common emotional states during and after pregnancy
- **Statistics** - Clinical data on postpartum depression in fathers
- **Internal conflicts** - Address common dilemmas and contradictions
- **Warning signs** - Identify symptoms requiring professional help
- **Relationship guidance** - Intimacy, communication, and partnership
- **Professional resources** - When and where to seek help

### Medical Information
- **Checkup calendar** - Expected medical appointments by trimester
- **Birth preparation** - What to expect and how to support your partner
- **Hospital bag checklist** - Comprehensive packing guide
- **Fourth trimester guide** - First 12 weeks postpartum

### Planning Tools
- **Cost calculator** - Track and estimate pregnancy-related expenses
- **Shopping list** - Complete maternity and newborn shopping checklist
- **Budget breakdown** - Costs organized by trimester and category

## Tech Stack

- **Framework:** React Native 0.81 with Expo 54
- **Language:** TypeScript 5.8
- **Auth & Database:** Supabase (PostgreSQL + Auth)
- **Navigation:** React Navigation 7.x
- **State Management:** React Context API + TanStack React Query
- **Forms:** React Hook Form + Zod validation
- **Styling:** React Native StyleSheet with custom theme system (light/dark)

## Project Structure

```
/
├── mobile/                     # React Native/Expo app (separate git repo for EAS)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth & Theme context
│   │   ├── screens/           # App screens
│   │   ├── services/          # API layer (bundled JSON data)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── data/              # Bundled JSON content files
│   │   ├── config/            # Environment config
│   │   ├── lib/               # Supabase client & validation
│   │   ├── theme/             # Design system & tokens
│   │   └── types/             # TypeScript type definitions
│   ├── App.tsx                # Entry point
│   ├── app.json               # Expo configuration
│   └── package.json
│
├── scripts/                   # Utility scripts
│   ├── generate-weekly-fetus-svgs.py  # Generate SVG TypeScript file
│   ├── export-to-json.js             # Export DB data to JSON (legacy)
│   └── SUPABASE_SETUP.sql            # Supabase schema reference
│
├── fetus_weekly_realistic_svgs/  # Weekly fetus SVG/PNG assets
└── icon.svg                      # App icon source
```

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo Go app (for mobile development)

### Setup

```bash
cd mobile
npm install
npm start             # Start Expo development server
```

**Platforms:**
```bash
npm run web           # Web browser
npm run android       # Android device/emulator
npm run ios           # iOS simulator
```

### Environment Variables

Create `mobile/.env.local` from the template:
```bash
cp mobile/.env.example mobile/.env.local
```

Required variables:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key

## Architecture

The app uses **Supabase** for authentication and user profiles, with all educational content **bundled as JSON files** in the app for offline access. Data was originally managed in SQLite and exported via `scripts/export-to-json.js`.

## Mobile App Store Builds

Uses Expo EAS Build:
- **iOS App Store** - `eas build --platform ios`
- **Google Play** - `eas build --platform android`

## License

Educational use - Contact for licensing details

---

**Status:** In development
**Version:** 1.0.0
