# Google & Facebook Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native Google and Facebook sign-in to the existing email/password auth flow, routing new social users to a profile setup screen for the required conception date. Existing email users can link/unlink Google and Facebook from Settings.

**Architecture:** Native SDK tokens (`@react-native-google-signin/google-signin` + `react-native-fbsdk-next`) are passed to Supabase via `signInWithIdToken` (for login) and `linkIdentity({ provider, token, access_token })` (for linking from Settings). New social users get a minimal profile with `conception_date: null`; AppNavigator detects `!user.conceptionDate` and routes to `ProfileSetupScreen` before Onboarding. Existing email users can link social providers in Settings — after linking, the next social sign-in routes to their existing account. No deep linking / URL scheme required — native SDKs bypass the browser entirely.

**Tech Stack:** `@react-native-google-signin/google-signin`, `react-native-fbsdk-next`, Supabase `signInWithIdToken`, EAS builds (required — native modules don't run in Expo Go)

---

## Prerequisite: Manual Console Setup (before writing code)

### A. Google Cloud Console
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 credentials — three types:
   - **iOS** → note the Client ID and the **reversed Client ID** (format: `com.googleusercontent.apps.XXXXXX`)
   - **Android** (SHA-1 from `eas credentials`) → note the Client ID
   - **Web application** → note the Client ID and Client Secret
3. Save all values — you will need them in Task 1 and Task 5

### B. Facebook Developer Console
1. Go to developers.facebook.com → Your App (or create new)
2. Add "Facebook Login" product
3. Note: **App ID** (shown in top bar) and **Client Token** (Settings → Advanced → Security → Client token)

### C. Supabase Dashboard
1. Authentication → Providers → Enable **Google**: paste Web Client ID + Web Client Secret
2. Authentication → Providers → Enable **Facebook**: paste App ID + App Secret

### D. Database Migration
Run in Supabase Dashboard → SQL Editor:

```sql
ALTER TABLE profiles
  ALTER COLUMN conception_date DROP NOT NULL,
  ALTER COLUMN partner_name DROP NOT NULL;
```

---

## File Map

### New Files
- `mobile/src/services/socialAuth.ts` — Google + Facebook native SDK wrappers returning tokens
- `mobile/src/services/__tests__/socialAuth.test.ts` — unit tests for token helpers
- `mobile/src/components/SocialAuthButtons.tsx` — branded Google + Facebook buttons
- `mobile/src/components/__tests__/SocialAuthButtons.test.tsx` — component tests
- `mobile/src/screens/ProfileSetupScreen.tsx` — conception date form for new social users
- `mobile/src/context/__tests__/AuthContext.social.test.tsx` — tests for social login methods

### Modified Files
- `mobile/app.json` — add `scheme`, Google Sign-In + Facebook SDK plugins
- `mobile/src/config/env.ts` — add `GOOGLE_WEB_CLIENT_ID`
- `mobile/src/lib/supabase.ts` — `conception_date: string | null`, `partner_name: string | null`
- `mobile/src/types/navigation.ts` — add `ProfileSetup` to `RootStackParamList`
- `mobile/src/context/AuthContext.tsx` — `User.conceptionDate: string | null`, `signInWithGoogle`, `signInWithFacebook`, `linkGoogleAccount`, `linkFacebookAccount`, handle new social users in SIGNED_IN handler
- `mobile/src/navigation/AppNavigator.tsx` — add ProfileSetup route, check `!user.conceptionDate`
- `mobile/src/screens/LoginScreen.tsx` — add `<SocialAuthButtons />`
- `mobile/src/screens/RegisterScreen.tsx` — add `<SocialAuthButtons />`
- `mobile/src/screens/SettingsScreen.tsx` — add "Połączone konta" section
- `mobile/src/services/socialAuth.ts` — add `getGoogleTokens` for linking flow

---

## Task 1: Install packages and configure app.json

**Files:**
- Modify: `mobile/app.json`

- [ ] **Step 1: Install native auth packages**

```bash
cd mobile
npm install @react-native-google-signin/google-signin react-native-fbsdk-next
```

Expected: packages added, no install errors

- [ ] **Step 2: Add `scheme` and plugins to app.json**

Current `app.json` has `"plugins": ["expo-font", "expo-asset", "expo-splash-screen"]`. Replace the entire `plugins` array and add `scheme`:

```json
{
  "expo": {
    "scheme": "readydaddy",
    "plugins": [
      "expo-font",
      "expo-asset",
      "expo-splash-screen",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_REVERSED_CLIENT_ID"
        }
      ],
      [
        "react-native-fbsdk-next",
        {
          "appID": "YOUR_FACEBOOK_APP_ID",
          "clientToken": "YOUR_FACEBOOK_CLIENT_TOKEN",
          "displayName": "Ready Daddy",
          "scheme": "fbYOUR_FACEBOOK_APP_ID",
          "advertiserIDCollectionEnabled": false,
          "autoLogAppEventsEnabled": false,
          "isAutoInitEnabled": true
        }
      ]
    ]
  }
}
```

Replace `YOUR_IOS_REVERSED_CLIENT_ID`, `YOUR_FACEBOOK_APP_ID`, `YOUR_FACEBOOK_CLIENT_TOKEN` with real values from the prerequisites.

- [ ] **Step 3: Commit**

```bash
cd mobile
git add app.json package.json package-lock.json
git commit -m "feat: install Google Sign-In and Facebook SDK, configure app.json plugins"
```

---

## Task 2: Update env config and Supabase types

**Files:**
- Modify: `mobile/src/config/env.ts`
- Modify: `mobile/src/lib/supabase.ts`

- [ ] **Step 1: Add GOOGLE_WEB_CLIENT_ID to env.ts**

Open `mobile/src/config/env.ts`. Add after the existing exports:

```typescript
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
```

- [ ] **Step 2: Add env var to .env.local**

If `mobile/.env.local` exists, add:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_FROM_GOOGLE_CLOUD
```

If it doesn't exist, create `mobile/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=<copy from existing env>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<copy from existing env>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_FROM_GOOGLE_CLOUD
```

- [ ] **Step 3: Update Profile type in supabase.ts**

In `mobile/src/lib/supabase.ts`, change the `Profile` type:

```typescript
export type Profile = {
  id: string;
  email: string;
  conception_date: string | null;
  partner_name: string | null;
  baby_name_1?: string | null;
  baby_name_2?: string | null;
  baby_gender?: 'boy' | 'girl' | null;
  created_at: string;
};
```

- [ ] **Step 4: Type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: errors in `AuthContext.tsx` about `conceptionDate` type mismatch — these are fixed in Task 3.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/config/env.ts mobile/src/lib/supabase.ts
git commit -m "feat: add GOOGLE_WEB_CLIENT_ID env var, update Profile type to allow null conception_date"
```

---

## Task 3: Create socialAuth service

**Files:**
- Create: `mobile/src/services/socialAuth.ts`
- Create: `mobile/src/services/__tests__/socialAuth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/services/__tests__/socialAuth.test.ts`:

```typescript
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: {
    logInWithPermissions: jest.fn(),
    logOut: jest.fn(),
  },
  AccessToken: {
    getCurrentAccessToken: jest.fn(),
  },
}));

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { getGoogleIdToken, getFacebookAccessToken } from '../socialAuth';

describe('getGoogleIdToken', () => {
  it('returns idToken on successful sign in', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      data: { idToken: 'mock-google-token' },
    });
    const token = await getGoogleIdToken();
    expect(token).toBe('mock-google-token');
  });

  it('throws when sign in returns no idToken', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: { idToken: null } });
    await expect(getGoogleIdToken()).rejects.toThrow('Brak tokenu Google');
  });

  it('propagates sign in error', async () => {
    (GoogleSignin.signIn as jest.Mock).mockRejectedValue(new Error('Anulowano'));
    await expect(getGoogleIdToken()).rejects.toThrow('Anulowano');
  });
});

describe('getFacebookAccessToken', () => {
  it('returns access token on successful login', async () => {
    (LoginManager.logInWithPermissions as jest.Mock).mockResolvedValue({ isCancelled: false });
    (AccessToken.getCurrentAccessToken as jest.Mock).mockResolvedValue({
      accessToken: 'mock-fb-token',
    });
    const token = await getFacebookAccessToken();
    expect(token).toBe('mock-fb-token');
  });

  it('returns null when user cancels', async () => {
    (LoginManager.logInWithPermissions as jest.Mock).mockResolvedValue({ isCancelled: true });
    const token = await getFacebookAccessToken();
    expect(token).toBeNull();
  });

  it('throws when no access token after login', async () => {
    (LoginManager.logInWithPermissions as jest.Mock).mockResolvedValue({ isCancelled: false });
    (AccessToken.getCurrentAccessToken as jest.Mock).mockResolvedValue(null);
    await expect(getFacebookAccessToken()).rejects.toThrow('Brak tokenu Facebook');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd mobile
npm test -- --testPathPattern="src/services/__tests__/socialAuth"
```

Expected: FAIL — `getGoogleIdToken` not found

- [ ] **Step 3: Create socialAuth.ts**

Create `mobile/src/services/socialAuth.ts`:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

export function configureGoogleSignIn(webClientId: string): void {
  GoogleSignin.configure({ webClientId, offlineAccess: false });
}

export async function getGoogleIdToken(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const token = response.data?.idToken;
  if (!token) throw new Error('Brak tokenu Google');
  return token;
}

export async function signOutGoogle(): Promise<void> {
  await GoogleSignin.signOut();
}

export async function getFacebookAccessToken(): Promise<string | null> {
  const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
  if (result.isCancelled) return null;
  const data = await AccessToken.getCurrentAccessToken();
  if (!data) throw new Error('Brak tokenu Facebook');
  return data.accessToken;
}

export async function signOutFacebook(): Promise<void> {
  LoginManager.logOut();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd mobile
npm test -- --testPathPattern="src/services/__tests__/socialAuth"
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add mobile/src/services/socialAuth.ts mobile/src/services/__tests__/socialAuth.test.ts
git commit -m "feat: add Google and Facebook token helpers"
```

---

## Task 4: Update AuthContext

**Files:**
- Modify: `mobile/src/context/AuthContext.tsx`
- Create: `mobile/src/context/__tests__/AuthContext.social.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/context/__tests__/AuthContext.social.test.tsx`:

```typescript
jest.mock('../../services/socialAuth', () => ({
  configureGoogleSignIn: jest.fn(),
  getGoogleIdToken: jest.fn(),
  getFacebookAccessToken: jest.fn(),
  signOutGoogle: jest.fn().mockResolvedValue(undefined),
  signOutFacebook: jest.fn(),
}));

const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  insert: mockInsert,
  update: mockUpdate,
}));

const mockSignInWithIdToken = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: mockSignInWithIdToken,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { getGoogleIdToken, getFacebookAccessToken } from '../../services/socialAuth';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const mockProfile = {
  id: 'user-1',
  email: 'test@test.com',
  conception_date: '2025-01-01',
  partner_name: 'Anna',
  baby_name_1: null,
  baby_name_2: null,
  baby_gender: null,
  created_at: '2025-01-01T00:00:00Z',
};

describe('signInWithGoogle', () => {
  beforeEach(() => {
    mockSignInWithIdToken.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
      error: null,
    });
  });

  it('calls signInWithIdToken with google provider and token', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('google-token');
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'google-token',
    });
  });

  it('sets user with null conceptionDate and isFirstLogin for new social user', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('google-token');
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(result.current.user?.conceptionDate).toBeNull();
    expect(result.current.isFirstLogin).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', email: 'test@test.com', conception_date: null })
    );
  });

  it('sets user with profile data for existing social user', async () => {
    (getGoogleIdToken as jest.Mock).mockResolvedValue('google-token');
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(result.current.user?.conceptionDate).toBe('2025-01-01');
    expect(result.current.isFirstLogin).toBe(false);
  });

  it('throws when getGoogleIdToken throws', async () => {
    (getGoogleIdToken as jest.Mock).mockRejectedValue(new Error('Anulowano'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => { await result.current.signInWithGoogle(); })
    ).rejects.toThrow('Anulowano');
  });
});

describe('signInWithFacebook', () => {
  beforeEach(() => {
    mockSignInWithIdToken.mockResolvedValue({
      data: { user: { id: 'user-2', email: 'fb@test.com' } },
      error: null,
    });
  });

  it('calls signInWithIdToken with facebook provider and token', async () => {
    (getFacebookAccessToken as jest.Mock).mockResolvedValue('fb-token');
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithFacebook();
    });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'facebook',
      token: 'fb-token',
    });
  });

  it('does nothing when user cancels Facebook login', async () => {
    (getFacebookAccessToken as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signInWithFacebook();
    });

    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd mobile
npm test -- --testPathPattern="src/context/__tests__/AuthContext.social"
```

Expected: FAIL — `signInWithGoogle`, `signInWithFacebook` not in AuthContext

- [ ] **Step 3: Update AuthContext.tsx — imports and interfaces**

In `mobile/src/context/AuthContext.tsx`:

**a) Add imports at the top** (after existing imports):

```typescript
import {
  configureGoogleSignIn,
  getGoogleIdToken,
  getFacebookAccessToken,
  signOutGoogle,
  signOutFacebook,
} from '../services/socialAuth';
import { GOOGLE_WEB_CLIENT_ID } from '../config/env';
```

**b) Update `User` interface** — make `conceptionDate` and `partnerName` nullable:

```typescript
export interface User {
  id: string;
  email: string;
  conceptionDate: string | null;
  partnerName: string | null;
  babyName1?: string | null;
  babyName2?: string | null;
  babyGender?: 'boy' | 'girl' | null;
}
```

**c) Add `signInWithGoogle`, `signInWithFacebook`, `linkGoogleAccount`, `linkFacebookAccount` to `AuthContextType`**:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirstLogin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, conceptionDate: string, partnerName?: string, babyName1?: string, babyName2?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearFirstLogin: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  linkFacebookAccount: () => Promise<void>;
}
```

- [ ] **Step 4: Update AuthContext.tsx — profileToUser and useEffect**

**a) Update `profileToUser`** — handle nullable fields:

```typescript
function profileToUser(profile: Profile): User {
  return {
    id: profile.id,
    email: profile.email,
    conceptionDate: profile.conception_date ?? null,
    partnerName: profile.partner_name ?? null,
    babyName1: profile.baby_name_1 || null,
    babyName2: profile.baby_name_2 || null,
    babyGender: profile.baby_gender || null,
  };
}
```

**b) Add `configureGoogleSignIn` call** to the existing `useEffect`. Inside the `useEffect` callback, add as the very first line before `supabase.auth.getSession()`:

```typescript
configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
```

- [ ] **Step 5: Add social login methods to AuthProvider**

Inside `AuthProvider`, after the `clearFirstLogin` function, add:

```typescript
const signInWithGoogle = async (): Promise<void> => {
  const idToken = await getGoogleIdToken();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Brak danych użytkownika');
  await handleSocialUser(data.user.id, data.user.email ?? '');
};

const signInWithFacebook = async (): Promise<void> => {
  const accessToken = await getFacebookAccessToken();
  if (!accessToken) return;
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'facebook',
    token: accessToken,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Brak danych użytkownika');
  await handleSocialUser(data.user.id, data.user.email ?? '');
};
```

Add the `handleSocialUser` helper inside `AuthProvider` (before `signInWithGoogle`):

```typescript
const handleSocialUser = async (userId: string, email: string): Promise<void> => {
  const profile = await fetchProfile(userId);
  if (profile) {
    setIsFirstLogin(false);
    setUser(profileToUser(profile));
    AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)).catch((e) =>
      logError('AuthContext:socialCacheWrite', e)
    );
    return;
  }
  // New social user — create minimal profile, require setup
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    email,
    conception_date: null,
    partner_name: null,
  });
  if (error) throw new Error(error.message);
  setIsFirstLogin(true);
  setUser({ id: userId, email, conceptionDate: null, partnerName: null });
};
```

- [ ] **Step 6: Update logout to sign out from Google/Facebook**

Replace the existing `logout` function:

```typescript
const logout = async () => {
  await signOutGoogle().catch(() => {});
  signOutFacebook();
  await supabase.auth.signOut();
  AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch((e) => logError('AuthContext:cacheRemove', e));
  setUser(null);
};
```

- [ ] **Step 7: Add new methods to context Provider value**

Update the `AuthContext.Provider` `value` prop to include the new methods:

```typescript
<AuthContext.Provider value={{
  user, loading, isFirstLogin,
  login, register, logout, updateUser, clearFirstLogin,
  signInWithGoogle, signInWithFacebook,
}}>
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
cd mobile
npm test -- --testPathPattern="src/context/__tests__/AuthContext.social"
```

Expected: PASS — all tests passing

- [ ] **Step 9: Type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: fix any remaining type errors from `conceptionDate: string | null`. Anywhere `user.conceptionDate` is used as a `string`, add `?? ''` or a null guard. Common pattern:

```typescript
// before
someFunction(user.conceptionDate)
// after
someFunction(user.conceptionDate ?? '')
```

- [ ] **Step 10: Commit**

```bash
git add mobile/src/context/AuthContext.tsx mobile/src/context/__tests__/AuthContext.social.test.tsx
git commit -m "feat: add signInWithGoogle and signInWithFacebook to AuthContext"
```

---

## Task 5: Add ProfileSetupScreen

**Files:**
- Modify: `mobile/src/types/navigation.ts`
- Create: `mobile/src/screens/ProfileSetupScreen.tsx`

- [ ] **Step 1: Add ProfileSetup to navigation types**

In `mobile/src/types/navigation.ts`, add `ProfileSetup` to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Onboarding: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  ProfileSetup: undefined;
};
```

- [ ] **Step 2: Create ProfileSetupScreen.tsx**

Create `mobile/src/screens/ProfileSetupScreen.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import type { Theme } from '../theme/types';

const setupSchema = z.object({
  conceptionDate: z
    .string()
    .min(1, 'Podaj datę poczęcia')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format daty: RRRR-MM-DD'),
  partnerName: z.string().optional(),
});

type SetupForm = z.infer<typeof setupSchema>;

export default function ProfileSetupScreen() {
  const { user, updateUser, clearFirstLogin } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: { conceptionDate: '', partnerName: '' },
  });

  const onSubmit = async (data: SetupForm) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          conception_date: data.conceptionDate,
          partner_name: data.partnerName ?? null,
        })
        .eq('id', user.id);
      if (error) throw new Error(error.message);

      updateUser({ conceptionDate: data.conceptionDate, partnerName: data.partnerName ?? null });
      // conceptionDate is now set → AppNavigator routes to Onboarding (isFirstLogin is true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Coś poszło nie tak';
      Alert.alert('Błąd', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Uzupełnij profil</Text>
        <Text style={styles.subtitle}>
          Podaj datę poczęcia, żeby spersonalizować treści dla Ciebie i Twojej partnerki.
        </Text>

        <Text style={styles.label}>Data poczęcia *</Text>
        <Controller
          control={control}
          name="conceptionDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.conceptionDate && styles.inputError]}
              placeholder="np. 2025-06-15"
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="numeric"
              maxLength={10}
              autoCorrect={false}
            />
          )}
        />
        {errors.conceptionDate && (
          <Text style={styles.errorText}>{errors.conceptionDate.message}</Text>
        )}

        <Text style={styles.label}>Imię partnerki (opcjonalnie)</Text>
        <Controller
          control={control}
          name="partnerName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="np. Anna"
              placeholderTextColor={theme.colors.textSecondary}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCorrect={false}
            />
          )}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Dalej</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.lg, paddingTop: 80 },
    title: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
      lineHeight: 22,
    },
    label: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.fontSize.sm,
      marginTop: 4,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      minHeight: 48,
      justifyContent: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
    },
  });
}
```

- [ ] **Step 3: Type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add mobile/src/types/navigation.ts mobile/src/screens/ProfileSetupScreen.tsx
git commit -m "feat: add ProfileSetupScreen for social auth users without conception date"
```

---

## Task 6: Update AppNavigator

**Files:**
- Modify: `mobile/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Import ProfileSetupScreen**

In `mobile/src/navigation/AppNavigator.tsx`, add import after the `ResetPasswordScreen` import line:

```typescript
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
```

- [ ] **Step 2: Update the routing logic in AppNavigator**

The current routing block (lines 164–179) is:

```typescript
{user ? (
  isFirstLogin ? (
    <Stack.Screen name="Onboarding">
      {() => <OnboardingScreen onDone={clearFirstLogin} />}
    </Stack.Screen>
  ) : (
    <Stack.Screen name="Main" component={MainTabs} />
  )
) : (
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </>
)}
```

Replace with:

```typescript
{user ? (
  !user.conceptionDate ? (
    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
  ) : isFirstLogin ? (
    <Stack.Screen name="Onboarding">
      {() => <OnboardingScreen onDone={clearFirstLogin} />}
    </Stack.Screen>
  ) : (
    <Stack.Screen name="Main" component={MainTabs} />
  )
) : (
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </>
)}
```

- [ ] **Step 3: Type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add mobile/src/navigation/AppNavigator.tsx
git commit -m "feat: route social auth users to ProfileSetupScreen when conceptionDate is null"
```

---

## Task 7: Create SocialAuthButtons component

**Files:**
- Create: `mobile/src/components/SocialAuthButtons.tsx`
- Create: `mobile/src/components/__tests__/SocialAuthButtons.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `mobile/src/components/__tests__/SocialAuthButtons.test.tsx`:

```typescript
const mockSignInWithGoogle = jest.fn();
const mockSignInWithFacebook = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithFacebook: mockSignInWithFacebook,
  })),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: {
      colors: { border: '#ccc', textSecondary: '#888', error: '#f00', surface: '#fff', text: '#000' },
      spacing: { sm: 8, md: 16, xs: 4 },
      fontSize: { sm: 12, md: 16 },
    },
  })),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SocialAuthButtons from '../SocialAuthButtons';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SocialAuthButtons', () => {
  it('renders Google and Facebook buttons', () => {
    const { getByText } = render(<SocialAuthButtons />);
    expect(getByText('Kontynuuj z Google')).toBeTruthy();
    expect(getByText('Kontynuuj z Facebook')).toBeTruthy();
  });

  it('calls signInWithGoogle on Google button press', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);
    const { getByText } = render(<SocialAuthButtons />);
    fireEvent.press(getByText('Kontynuuj z Google'));
    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1));
  });

  it('calls signInWithFacebook on Facebook button press', async () => {
    mockSignInWithFacebook.mockResolvedValue(undefined);
    const { getByText } = render(<SocialAuthButtons />);
    fireEvent.press(getByText('Kontynuuj z Facebook'));
    await waitFor(() => expect(mockSignInWithFacebook).toHaveBeenCalledTimes(1));
  });

  it('shows error alert when Google sign-in throws', async () => {
    jest.spyOn(Alert, 'alert');
    mockSignInWithGoogle.mockRejectedValue(new Error('Sieć niedostępna'));
    const { getByText } = render(<SocialAuthButtons />);
    fireEvent.press(getByText('Kontynuuj z Google'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Błąd logowania', 'Sieć niedostępna')
    );
  });

  it('does not show error alert when Facebook login is cancelled (null token)', async () => {
    jest.spyOn(Alert, 'alert');
    mockSignInWithFacebook.mockResolvedValue(undefined); // no throw = user cancelled
    const { getByText } = render(<SocialAuthButtons />);
    fireEvent.press(getByText('Kontynuuj z Facebook'));
    await waitFor(() => expect(mockSignInWithFacebook).toHaveBeenCalled());
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd mobile
npm test -- --testPathPattern="src/components/__tests__/SocialAuthButtons"
```

Expected: FAIL — module not found

- [ ] **Step 3: Create SocialAuthButtons.tsx**

Create `mobile/src/components/SocialAuthButtons.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../theme/types';

type SocialProvider = 'google' | 'facebook';

export default function SocialAuthButtons() {
  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  const handlePress = async (provider: SocialProvider) => {
    setLoading(provider);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithFacebook();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Coś poszło nie tak';
      Alert.alert('Błąd logowania', message);
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>lub</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={() => handlePress('google')}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {loading === 'google' ? (
          <ActivityIndicator size="small" color="#3C4043" />
        ) : (
          <Text style={styles.googleLetter}>G</Text>
        )}
        <Text style={styles.googleText}>Kontynuuj z Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.facebookButton]}
        onPress={() => handlePress('facebook')}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {loading === 'facebook' ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.facebookLetter}>f</Text>
        )}
        <Text style={styles.facebookText}>Kontynuuj z Facebook</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    dividerText: {
      marginHorizontal: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: theme.fontSize.sm,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 10,
      minHeight: 48,
    },
    googleButton: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#dadce0',
    },
    googleLetter: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
    googleText: { fontSize: theme.fontSize.md, fontWeight: '500', color: '#3C4043' },
    facebookButton: { backgroundColor: '#1877F2' },
    facebookLetter: { fontSize: 18, fontWeight: '700', color: '#fff' },
    facebookText: { fontSize: theme.fontSize.md, fontWeight: '500', color: '#fff' },
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd mobile
npm test -- --testPathPattern="src/components/__tests__/SocialAuthButtons"
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/SocialAuthButtons.tsx mobile/src/components/__tests__/SocialAuthButtons.test.tsx
git commit -m "feat: add SocialAuthButtons component with Google and Facebook"
```

---

## Task 8: Add SocialAuthButtons to LoginScreen and RegisterScreen

**Files:**
- Modify: `mobile/src/screens/LoginScreen.tsx`
- Modify: `mobile/src/screens/RegisterScreen.tsx`

- [ ] **Step 1: Read LoginScreen**

Read `mobile/src/screens/LoginScreen.tsx` to find where the submit button and links are rendered, to place `<SocialAuthButtons />` correctly.

- [ ] **Step 2: Add SocialAuthButtons to LoginScreen**

In `mobile/src/screens/LoginScreen.tsx`:

Add import at top:
```typescript
import SocialAuthButtons from '../components/SocialAuthButtons';
```

In the JSX, add `<SocialAuthButtons />` after the existing register link / forgot password link — at the bottom of the scrollable form area, before the closing `</ScrollView>` (or `</View>`):

```tsx
{/* existing fields, submit button, forgot password link, register link */}
<SocialAuthButtons />
```

- [ ] **Step 3: Add SocialAuthButtons to RegisterScreen**

In `mobile/src/screens/RegisterScreen.tsx`:

Add import at top:
```typescript
import SocialAuthButtons from '../components/SocialAuthButtons';
```

In the JSX, add `<SocialAuthButtons />` at the bottom of the form, after the submit button:

```tsx
{/* existing form fields and submit button */}
<SocialAuthButtons />
```

- [ ] **Step 4: Type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add mobile/src/screens/LoginScreen.tsx mobile/src/screens/RegisterScreen.tsx
git commit -m "feat: add social auth buttons to login and register screens"
```

---

## Task 9: Full test suite verification (sign-in flow)

- [ ] **Step 1: Run all tests**

```bash
cd mobile
npm test -- --passWithNoTests
```

Expected: all tests pass, no regressions

- [ ] **Step 2: Full type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -p
git commit -m "fix: resolve remaining type errors from social auth integration"
```

---

## Task 10: Extend socialAuth.ts with getGoogleTokens for account linking

**Files:**
- Modify: `mobile/src/services/socialAuth.ts`
- Modify: `mobile/src/services/__tests__/socialAuth.test.ts`

Supabase's `linkIdentity` for native apps accepts `{ provider, token, access_token }` where `token` is the Google ID token and `access_token` is the Google OAuth access token. `signIn()` only returns the ID token; `getTokens()` returns both. Facebook linking uses only the access token as `token`.

- [ ] **Step 1: Add failing test for getGoogleTokens**

In `mobile/src/services/__tests__/socialAuth.test.ts`, append inside the file (after the existing `describe` blocks):

```typescript
describe('getGoogleTokens', () => {
  it('returns both idToken and accessToken after sign in', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: { idToken: 'id-tok' } });
    (GoogleSignin.getTokens as jest.Mock).mockResolvedValue({
      idToken: 'id-tok',
      accessToken: 'acc-tok',
    });

    const tokens = await getGoogleTokens();
    expect(tokens.idToken).toBe('id-tok');
    expect(tokens.accessToken).toBe('acc-tok');
  });

  it('throws when getTokens returns no idToken', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: { idToken: 'id-tok' } });
    (GoogleSignin.getTokens as jest.Mock).mockResolvedValue({ idToken: null, accessToken: 'acc' });

    await expect(getGoogleTokens()).rejects.toThrow('Brak tokenu Google');
  });
});
```

Also add `getTokens: jest.fn()` to the `GoogleSignin` mock at the top of the test file:

```typescript
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getTokens: jest.fn(),  // add this line
  },
}));
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd mobile
npm test -- --testPathPattern="src/services/__tests__/socialAuth"
```

Expected: FAIL — `getGoogleTokens` not exported

- [ ] **Step 3: Add getGoogleTokens to socialAuth.ts**

In `mobile/src/services/socialAuth.ts`, add after `getGoogleIdToken`:

```typescript
export async function getGoogleTokens(): Promise<{ idToken: string; accessToken: string }> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  await GoogleSignin.signIn();
  const { idToken, accessToken } = await GoogleSignin.getTokens();
  if (!idToken) throw new Error('Brak tokenu Google');
  return { idToken, accessToken };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd mobile
npm test -- --testPathPattern="src/services/__tests__/socialAuth"
```

Expected: PASS — all tests passing (including the 2 new ones)

- [ ] **Step 5: Commit**

```bash
git add mobile/src/services/socialAuth.ts mobile/src/services/__tests__/socialAuth.test.ts
git commit -m "feat: add getGoogleTokens helper for account linking"
```

---

## Task 11: Add linkGoogleAccount and linkFacebookAccount to AuthContext

**Files:**
- Modify: `mobile/src/context/AuthContext.tsx`
- Modify: `mobile/src/context/__tests__/AuthContext.social.test.tsx`

`supabase.auth.linkIdentity({ provider, token, access_token })` links a social provider to the currently authenticated user. Calling it while not logged in throws. After a successful link, subsequent `signInWithIdToken` calls with that provider's token will route to the existing account.

- [ ] **Step 1: Add failing tests**

In `mobile/src/context/__tests__/AuthContext.social.test.tsx`, append inside the file after the existing `describe` blocks:

```typescript
const mockLinkIdentity = jest.fn();

// add mockLinkIdentity to the supabase mock — update the existing jest.mock('../../lib/supabase') block:
// supabase: { auth: { ..., linkIdentity: mockLinkIdentity }, from: mockFrom }

describe('linkGoogleAccount', () => {
  it('calls linkIdentity with google provider, idToken and accessToken', async () => {
    (getGoogleTokens as jest.Mock).mockResolvedValue({
      idToken: 'g-id',
      accessToken: 'g-acc',
    });
    mockLinkIdentity.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.linkGoogleAccount();
    });

    expect(mockLinkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      token: 'g-id',
      access_token: 'g-acc',
    });
  });

  it('throws when linkIdentity returns error', async () => {
    (getGoogleTokens as jest.Mock).mockResolvedValue({ idToken: 'g-id', accessToken: 'g-acc' });
    mockLinkIdentity.mockResolvedValue({
      data: {},
      error: { message: 'Identity already linked' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => { await result.current.linkGoogleAccount(); })
    ).rejects.toThrow('Identity already linked');
  });
});

describe('linkFacebookAccount', () => {
  it('calls linkIdentity with facebook provider and access token', async () => {
    (getFacebookAccessToken as jest.Mock).mockResolvedValue('fb-acc');
    mockLinkIdentity.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.linkFacebookAccount();
    });

    expect(mockLinkIdentity).toHaveBeenCalledWith({
      provider: 'facebook',
      token: 'fb-acc',
    });
  });

  it('does nothing when user cancels Facebook', async () => {
    (getFacebookAccessToken as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.linkFacebookAccount();
    });

    expect(mockLinkIdentity).not.toHaveBeenCalled();
  });
});
```

Also update the existing `jest.mock('../../services/socialAuth', ...)` to include `getGoogleTokens`:

```typescript
jest.mock('../../services/socialAuth', () => ({
  configureGoogleSignIn: jest.fn(),
  getGoogleIdToken: jest.fn(),
  getGoogleTokens: jest.fn(),   // add this line
  getFacebookAccessToken: jest.fn(),
  signOutGoogle: jest.fn().mockResolvedValue(undefined),
  signOutFacebook: jest.fn(),
}));
```

And add `getGoogleTokens` to the import:

```typescript
import { getGoogleIdToken, getGoogleTokens, getFacebookAccessToken } from '../../services/socialAuth';
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd mobile
npm test -- --testPathPattern="src/context/__tests__/AuthContext.social"
```

Expected: FAIL — `linkGoogleAccount`, `linkFacebookAccount` not in AuthContext

- [ ] **Step 3: Update AuthContext.tsx — add imports and methods**

**a) Add `getGoogleTokens` to the import from `../services/socialAuth`:**

```typescript
import {
  configureGoogleSignIn,
  getGoogleIdToken,
  getGoogleTokens,
  getFacebookAccessToken,
  signOutGoogle,
  signOutFacebook,
} from '../services/socialAuth';
```

**b) Add `linkGoogleAccount` and `linkFacebookAccount` inside `AuthProvider`** (after `signInWithFacebook`):

```typescript
const linkGoogleAccount = async (): Promise<void> => {
  const { idToken, accessToken } = await getGoogleTokens();
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    token: idToken,
    access_token: accessToken,
  } as Parameters<typeof supabase.auth.linkIdentity>[0]);
  if (error) throw new Error(error.message);
};

const linkFacebookAccount = async (): Promise<void> => {
  const accessToken = await getFacebookAccessToken();
  if (!accessToken) return;
  const { error } = await supabase.auth.linkIdentity({
    provider: 'facebook',
    token: accessToken,
  } as Parameters<typeof supabase.auth.linkIdentity>[0]);
  if (error) throw new Error(error.message);
};
```

**Note on the cast:** `linkIdentity` in supabase-js types currently expects the OAuth redirect form. The native token form `{ provider, token, access_token }` is supported at runtime but may require the cast above if types don't reflect it. If the types do accept it, remove the cast.

**c) Add new methods to the context `value` prop:**

```typescript
<AuthContext.Provider value={{
  user, loading, isFirstLogin,
  login, register, logout, updateUser, clearFirstLogin,
  signInWithGoogle, signInWithFacebook,
  linkGoogleAccount, linkFacebookAccount,
}}>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd mobile
npm test -- --testPathPattern="src/context/__tests__/AuthContext.social"
```

Expected: PASS — all tests passing

- [ ] **Step 5: Type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: 0 errors (fix any cast issues if types changed in newer supabase-js)

- [ ] **Step 6: Commit**

```bash
git add mobile/src/context/AuthContext.tsx mobile/src/context/__tests__/AuthContext.social.test.tsx
git commit -m "feat: add linkGoogleAccount and linkFacebookAccount to AuthContext"
```

---

## Task 12: "Połączone konta" section in SettingsScreen

**Files:**
- Modify: `mobile/src/screens/SettingsScreen.tsx`

The section shows which providers are currently linked to the user's account. It reads `supabase.auth.getUserIdentities()` on mount. For each of Google and Facebook, it shows either a "Połącz" button (if not linked) or a "Odłącz" button (if linked AND the user also has an `email` identity — can't be the only login method). Linking calls `linkGoogleAccount/linkFacebookAccount` from AuthContext. Unlinking calls `supabase.auth.unlinkIdentity(identity)` directly (no need to put it in AuthContext).

- [ ] **Step 1: Add state and data fetching at the top of SettingsScreen**

In `mobile/src/screens/SettingsScreen.tsx`:

**a) Add imports** at the top (after existing imports):

```typescript
import { supabase } from '../lib/supabase';
import type { UserIdentity } from '@supabase/supabase-js';
```

**b) Destructure new methods from `useAuth`:**

Change the existing line:
```typescript
const { user, updateUser, logout } = useAuth();
```
to:
```typescript
const { user, updateUser, logout, linkGoogleAccount, linkFacebookAccount } = useAuth();
```

**c) Add state for linked identities** (after existing `useState` declarations):

```typescript
const [identities, setIdentities] = useState<UserIdentity[]>([]);
const [linkingProvider, setLinkingProvider] = useState<'google' | 'facebook' | null>(null);
```

**d) Add a `loadIdentities` function and call it on mount** (after existing state declarations):

```typescript
const loadIdentities = async () => {
  const { data, error } = await supabase.auth.getUserIdentities();
  if (!error && data?.identities) setIdentities(data.identities);
};

React.useEffect(() => {
  loadIdentities();
}, []);
```

- [ ] **Step 2: Add helper functions for linking/unlinking**

Add these functions inside `SettingsScreen`, after `handleClearGender`:

```typescript
const handleLinkProvider = async (provider: 'google' | 'facebook') => {
  setLinkingProvider(provider);
  try {
    if (provider === 'google') {
      await linkGoogleAccount();
    } else {
      await linkFacebookAccount();
    }
    await loadIdentities(); // refresh the list after linking
    Alert.alert('Sukces', `Konto ${provider === 'google' ? 'Google' : 'Facebook'} zostało połączone.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Coś poszło nie tak';
    Alert.alert('Błąd', message);
  } finally {
    setLinkingProvider(null);
  }
};

const handleUnlinkProvider = (identity: UserIdentity) => {
  const providerName = identity.provider === 'google' ? 'Google' : 'Facebook';
  Alert.alert(
    `Odłącz ${providerName}`,
    `Czy na pewno chcesz odłączyć konto ${providerName}? Nie będziesz już mógł logować się przez ${providerName}.`,
    [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Odłącz',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.auth.unlinkIdentity(identity);
            if (error) throw new Error(error.message);
            await loadIdentities();
            Alert.alert('Sukces', `Konto ${providerName} zostało odłączone.`);
          } catch (err: unknown) {
            Alert.alert('Błąd', err instanceof Error ? err.message : 'Nie udało się odłączyć konta.');
          }
        },
      },
    ]
  );
};
```

- [ ] **Step 3: Add helper variables for rendering**

Add after the helper functions:

```typescript
const hasEmailIdentity = identities.some(i => i.provider === 'email');
const googleIdentity = identities.find(i => i.provider === 'google');
const facebookIdentity = identities.find(i => i.provider === 'facebook');

const canUnlinkGoogle = Boolean(googleIdentity) && (hasEmailIdentity || Boolean(facebookIdentity));
const canUnlinkFacebook = Boolean(facebookIdentity) && (hasEmailIdentity || Boolean(googleIdentity));
```

- [ ] **Step 4: Add "Połączone konta" section to the JSX**

In the `ScrollView` content, add a new `<View style={s.section}>` block **after** the "Konto i Dane" section and **before** the "O dziecku" section:

```tsx
<View style={s.section}>
  <Text style={s.sectionTitle}>Połączone konta</Text>
  <Text style={s.sectionDesc}>
    Po połączeniu konta możesz logować się przez Google lub Facebook bez hasła.
  </Text>

  {/* Google */}
  <View style={s.linkedAccountRow}>
    <View style={s.listButtonLeft}>
      <View style={[s.listButtonIcon, { backgroundColor: '#4285F420' }]}>
        <Text style={s.providerLetter}>G</Text>
      </View>
      <View>
        <Text style={s.listButtonText}>Google</Text>
        <Text style={s.listButtonSub}>
          {googleIdentity ? 'Połączone' : 'Nie połączone'}
        </Text>
      </View>
    </View>
    {googleIdentity ? (
      <TouchableOpacity
        onPress={() => canUnlinkGoogle && handleUnlinkProvider(googleIdentity)}
        disabled={!canUnlinkGoogle || linkingProvider !== null}
        style={[s.linkBtn, s.unlinkBtn, !canUnlinkGoogle && s.linkBtnDisabled]}
      >
        <Text style={s.unlinkBtnText}>Odłącz</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={() => handleLinkProvider('google')}
        disabled={linkingProvider !== null}
        style={[s.linkBtn, linkingProvider !== null && s.linkBtnDisabled]}
      >
        {linkingProvider === 'google' ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={s.linkBtnText}>Połącz</Text>
        )}
      </TouchableOpacity>
    )}
  </View>

  {/* Facebook */}
  <View style={[s.linkedAccountRow, { marginTop: theme.spacing.md }]}>
    <View style={s.listButtonLeft}>
      <View style={[s.listButtonIcon, { backgroundColor: '#1877F220' }]}>
        <Text style={[s.providerLetter, { color: '#1877F2' }]}>f</Text>
      </View>
      <View>
        <Text style={s.listButtonText}>Facebook</Text>
        <Text style={s.listButtonSub}>
          {facebookIdentity ? 'Połączone' : 'Nie połączone'}
        </Text>
      </View>
    </View>
    {facebookIdentity ? (
      <TouchableOpacity
        onPress={() => canUnlinkFacebook && handleUnlinkProvider(facebookIdentity)}
        disabled={!canUnlinkFacebook || linkingProvider !== null}
        style={[s.linkBtn, s.unlinkBtn, !canUnlinkFacebook && s.linkBtnDisabled]}
      >
        <Text style={s.unlinkBtnText}>Odłącz</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={() => handleLinkProvider('facebook')}
        disabled={linkingProvider !== null}
        style={[s.linkBtn, linkingProvider !== null && s.linkBtnDisabled]}
      >
        {linkingProvider === 'facebook' ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={s.linkBtnText}>Połącz</Text>
        )}
      </TouchableOpacity>
    )}
  </View>

  {(!canUnlinkGoogle && googleIdentity) || (!canUnlinkFacebook && facebookIdentity) ? (
    <Text style={s.unlinkHint}>
      Nie możesz odłączyć jedynego sposobu logowania.
    </Text>
  ) : null}
</View>
```

- [ ] **Step 5: Add new styles to createStyles**

Inside `createStyles`, after the `listButtonSub` style, add:

```typescript
linkedAccountRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.colors.surface,
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.lg,
},
providerLetter: {
  fontSize: 18,
  fontWeight: '700' as const,
  color: '#4285F4',
},
linkBtn: {
  backgroundColor: theme.colors.primary,
  paddingHorizontal: theme.spacing.md,
  paddingVertical: theme.spacing.sm,
  borderRadius: theme.borderRadius.md,
  minWidth: 72,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minHeight: 36,
},
linkBtnText: {
  color: '#fff',
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.semibold,
},
linkBtnDisabled: { opacity: 0.5 },
unlinkBtn: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: theme.colors.danger + '60',
},
unlinkBtnText: {
  color: theme.colors.danger,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
},
unlinkHint: {
  fontSize: theme.fontSize.xs,
  color: theme.colors.textMuted,
  marginTop: theme.spacing.sm,
  textAlign: 'center' as const,
},
```

- [ ] **Step 6: Type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: 0 errors. If `UserIdentity` type isn't exported from `@supabase/supabase-js`, use `import type { User } from '@supabase/supabase-js'` and use `User['identities'] extends Array<infer I> ? I : never` or just `any` for the identity type as a fallback.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/screens/SettingsScreen.tsx
git commit -m "feat: add linked accounts section to Settings with Google and Facebook link/unlink"
```

---

## Task 13: Final test suite and type check

- [ ] **Step 1: Run all tests**

```bash
cd mobile
npm test -- --passWithNoTests
```

Expected: all tests pass, no regressions

- [ ] **Step 2: Full type check**

```bash
cd mobile
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -p
git commit -m "fix: resolve remaining type errors from account linking integration"
```

---

## Post-Implementation: EAS Build & Manual Testing

Native modules don't work in Expo Go. Build a development client:

```bash
cd mobile
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

Manual test checklist:

**Sign-in flow:**
- [ ] Google button on LoginScreen opens native account picker
- [ ] New Google user → ProfileSetupScreen (no conception date) → Onboarding → Main
- [ ] Existing Google user (has profile) → directly to Main
- [ ] Facebook button opens native Facebook dialog
- [ ] Cancel on Google/Facebook → stays on Login, no error shown
- [ ] Error during sign-in → Polish error alert shown
- [ ] Logout → Google and Facebook sessions cleared

**Account linking flow:**
- [ ] Email user goes to Settings → "Połączone konta" → "Połącz" Google → native picker → success alert → status changes to "Połączone"
- [ ] After linking Google, user can log out and sign in via Google → routes to the same account (same profile data preserved)
- [ ] Email user links Facebook → same flow
- [ ] User with 2+ identities can "Odłącz" one → confirmation alert → status changes to "Nie połączone"
- [ ] User with only one social identity (no email password) → "Odłącz" button is disabled → hint text shown
- [ ] Already linked provider shows "Połączone" status immediately on Settings open
- [ ] Dark mode → all buttons and labels render correctly
