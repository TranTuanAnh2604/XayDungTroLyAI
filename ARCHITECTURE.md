# ARCHITECTURE.md — Hivic AI

> **Canonical reference for the Hivic AI codebase.**
> Read this document in its entirety before contributing code.
> Last revised: 2026-06-28.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Responsibilities](#2-folder-responsibilities)
3. [Data Flow](#3-data-flow)
4. [API Flow](#4-api-flow)
5. [Authentication Flow](#5-authentication-flow)
6. [UI Flow](#6-ui-flow)
7. [Naming Conventions](#7-naming-conventions)
8. [Code Conventions](#8-code-conventions)
9. [Services](#9-services)
10. [Repository Rules](#10-repository-rules)
11. [State Management](#11-state-management)
12. [Error Handling](#12-error-handling)
13. [Component Hierarchy](#13-component-hierarchy)
14. [Best Practices](#14-best-practices)
15. [Design Principles](#15-design-principles)
16. [What Should Never Be Changed](#16-what-should-never-be-changed)

---

## 1. Project Overview

### Identity

| Attribute          | Value                                                |
|--------------------|------------------------------------------------------|
| Product name       | **Hivic AI**                                         |
| Package identifier | `com.sanhsngdev.hivicai`                             |
| Version            | `1.0.0`                                              |
| Runtime            | React Native 0.81 · Expo SDK 54 (managed workflow)  |
| Language           | TypeScript 5.9 (`strict: true`)                     |
| Primary platform   | Android (native build via EAS)                       |
| Secondary targets  | iOS (scaffold present), Web (scaffold present)       |
| Backend            | REST API at `https://assistantai-bc7b.onrender.com`  |
| UI locale          | Vietnamese (vi-VN)                                   |

### What the App Does

Hivic AI is a mobile AI personal assistant. It consolidates a user's calendar events, contacts, Gmail inbox, tasks, and an AI chat interface into a single application. The app synchronises device-level data (Calendar, Contacts) to a remote backend and presents Gmail content that the backend fetches via Google OAuth on the user's behalf.

### Technology Stack

| Layer           | Technology                                                       |
|-----------------|------------------------------------------------------------------|
| Framework       | React Native 0.81 + Expo 54                                     |
| Navigation      | `@react-navigation/native` 6.x + `@react-navigation/native-stack` 6.x |
| State           | React Context (`AuthContext`) + component-local `useState`       |
| Secure storage  | `expo-secure-store`                                              |
| HTTP client     | Custom `fetch`-based client (`src/services/api.ts`)              |
| Auth            | Email/password + Google Sign-In (`@react-native-google-signin/google-signin` 16.x) |
| Device APIs     | `expo-calendar`, `expo-contacts`, `expo-mail-composer`           |
| UI effects      | `expo-blur`, `expo-linear-gradient`, `@expo/vector-icons` (MaterialIcons) |
| Build           | EAS Build (development, preview APK, production)                 |

### What Is Real vs. Mock

Understanding this boundary is critical before writing features.

| Domain    | Status             | Data source                              |
|-----------|--------------------|------------------------------------------|
| Auth      | **Fully integrated** | Backend REST API                        |
| Calendar  | **Fully integrated** | Device calendar → backend sync → backend CRUD |
| Contacts  | **Fully integrated** | Device contacts → backend sync          |
| Gmail     | **Fully integrated** | Backend-side Gmail API via OAuth         |
| Home      | **Mock only**        | `src/data/homeMock.ts`                  |
| Chat      | **Mock only**        | `src/data/chatMock.ts`                  |
| Tasks     | **Mock only**        | `src/data/tasksMock.ts`                 |
| Voice     | **Mock only**        | `src/data/voiceMock.ts`                 |
| Settings  | **Mock only**        | `src/data/settingsMock.ts`              |

When replacing mock data with real backend integration, follow the patterns established by `EventsScreen` (Calendar) and `MailScreen` (Gmail).

---

## 2. Folder Responsibilities

```
d:\AIAssistantApp\
│
├── App.tsx                        # Root component. Mounts SafeAreaProvider → AuthProvider → AppNavigator.
├── index.ts                       # Expo entry point. Calls registerRootComponent(App).
├── app.json                       # Expo project manifest: permissions, plugins, splash, package id.
├── eas.json                       # EAS Build profiles (development, preview, production).
├── package.json                   # Dependencies, scripts (start, android, ios, web).
├── tsconfig.json                  # TypeScript config. Extends expo/tsconfig.base, strict: true.
├── .env                           # Environment variables (currently unused — see §15).
├── assets/                        # Root-level Expo assets: icon.png, splash-icon.png, adaptive-icon.png.
│
└── src/
    ├── assets/                    # Application assets.
    │   ├── fonts/                 #   Custom fonts (placeholder — currently empty).
    │   ├── icons/                 #   Custom icons (placeholder — currently empty).
    │   └── images/                #   Feature images (placeholder — currently empty).
    │
    ├── components/                # All presentational and composite UI components.
    │   ├── auth/                  #   Auth-specific: branding hero, OTP modal, password reset modals.
    │   ├── chat/                  #   Chat UI: message bubbles, composer, chips, typing indicator.
    │   ├── events/                #   Calendar UI: modals, timeline, date strip, FAB, insight card.
    │   ├── home/                  #   Dashboard UI: summary cards, meeting card, task list, FAB.
    │   ├── layout/                #   Shared layout shells: TabScreenLayout.
    │   ├── mail/                  #   Gmail UI: list items, detail modal, filter bar, compose FAB, AI summary.
    │   ├── navigation/            #   Chrome: TopAppBar, BottomNavBar, barrel index.ts.
    │   ├── settings/              #   Settings UI: profile section, AI memory, settings list.
    │   ├── tasks/                 #   Task UI: project cards, filter chips, task items, progress.
    │   ├── ui/                    #   SHARED PRIMITIVES: GlassCard, buttons, inputs, mesh background, logo.
    │   └── voice/                 #   Voice assistant UI: AI visualizer, particles, waveform, transcription.
    │
    ├── constants/                 # Immutable design tokens and static configuration.
    │   ├── theme.ts               #   COLORS, RADIUS, SHADOW — the colour and shape system.
    │   ├── typography.ts          #   Text style presets (displayLg, headlineMd, bodyMd, etc.).
    │   ├── spacing.ts             #   Spacing scale (containerMobile, etc.).
    │   ├── layout.ts              #   Dimensional constants: bar heights, z-indexes, gap values.
    │   ├── brand.ts               #   Brand strings (app name, tagline).
    │   ├── config.ts              #   Google OAuth client IDs.
    │   ├── navigationChrome.ts    #   Default navigation chrome labels.
    │   ├── assets.ts              #   Shared asset path references.
    │   └── *Assets.ts             #   Per-feature asset/icon/label constants (homeAssets, chatAssets, etc.).
    │
    ├── context/                   # React Context providers.
    │   └── AuthContext.tsx         #   Global auth state: user, token, signIn/signUp/signOut/signInWithGoogle.
    │
    ├── data/                      # Static mock data for features not yet backed by APIs.
    │   ├── navigationTabs.ts      #   Tab definitions (id, label, icon) — used by BottomNavBar.
    │   └── *Mock.ts               #   Per-feature mock datasets.
    │
    ├── hooks/                     # Custom React hooks.
    │   └── useOpenSettings.ts     #   Returns a callback that navigates to the Settings screen.
    │
    ├── i18n/                      # Internationalisation (placeholder — currently empty).
    │
    ├── navigation/                # React Navigation configuration.
    │   ├── AppNavigator.tsx        #   Root stack: Auth | Main | Settings. Guards on auth state.
    │   ├── AuthNavigator.tsx       #   Auth stack: Login → Register.
    │   ├── MainNavigator.tsx       #   Main tab container: custom switch-based tab rendering.
    │   ├── ChatNavigator.tsx       #   Chat/Voice mode toggle (text ↔ voice).
    │   └── types.ts               #   Navigation param list type definitions.
    │
    ├── screens/                   # Top-level screen components (one per route).
    │   ├── auth/                  #   LoginScreen, RegisterScreen.
    │   ├── chat/                  #   ChatScreen.
    │   ├── events/                #   EventsScreen.
    │   ├── home/                  #   HomeScreen.
    │   ├── mail/                  #   MailScreen.
    │   ├── settings/              #   SettingsScreen.
    │   ├── tasks/                 #   TasksScreen.
    │   ├── voice/                 #   VoiceAssistantScreen.
    │   └── PlaceholderTabScreen.tsx  # Generic placeholder (legacy, not actively used).
    │
    ├── services/                  # Business logic, API clients, device integrations.
    │   ├── api.ts                 #   Generic HTTP client (apiGet, apiPost, apiPut). Token management.
    │   ├── auth.ts                #   Auth API functions: login, register, OTP, password reset, refresh.
    │   ├── authFlow.ts            #   Composite auth orchestration (OTP verify → auto-login).
    │   ├── authStorage.ts         #   SecureStore CRUD for tokens and user profile.
    │   ├── googleAuth.ts          #   Google Sign-In SDK configuration and token retrieval.
    │   ├── gmail.ts               #   Gmail connect, sync, fetch, mark-read, response normalisation.
    │   ├── calendar.ts            #   Device calendar: permission request, event fetching.
    │   ├── contacts.ts            #   Device contacts: permission request, contact fetching.
    │   └── sync.ts                #   Backend sync: contacts, calendar events, conflict resolution.
    │
    ├── store/                     # Redux store (placeholder — currently empty and unused).
    │
    ├── theme/                     # Theme configuration (placeholder — currently empty).
    │
    ├── types/                     # TypeScript type/interface definitions, one file per feature.
    │   ├── navigation.ts          #   AppTabId union type.
    │   ├── chat.ts, events.ts, home.ts, mail.ts, settings.ts, tasks.ts, voice.ts
    │   └──                        #   Feature-specific type definitions.
    │
    └── utils/                     # Shared utility functions (placeholder — currently empty).
```

### Structural Rules

- **One screen per feature subdirectory** under `screens/`. A screen is the root component for a route.
- **Components are grouped by feature** under `components/`. Cross-feature primitives live in `components/ui/`.
- **Types live in `types/`**, not inline or co-located with components.
- **Mock data lives in `data/`**, not inside components or screens.
- **Constants are configuration, not logic.** They export `as const` objects. No functions except layout calculators.

---

## 3. Data Flow

### General Pattern

```
User Action
  → Screen Component (captures intent)
    → Service Function (API call or device API)
      → Backend or Device
        ← Raw Response
    ← Normalised Data
  → useState Setter (updates local state)
    → Re-render with new data
```

### Concrete Example: Calendar Events

```
EventsScreen mounts
  → useEffect calls fetchCalendarEvents() from services/sync.ts
    → apiGet('/api/Calendar/events') from services/api.ts
      → fetch() with Bearer token from expo-secure-store
        ← Backend JSON response
      ← Normalised CalendarSyncRequest[]
    ← Array stored in useState
  → mapCalendarEventToTimelineEvent() transforms data for rendering
  → EventTimeline renders TimelineEventItem components

User presses "+" FAB
  → CreateEventModal opens (local boolean state)
  → User fills form, presses save
    → isEventConflict() checks local state for time overlap
    → createCalendarEvent(event) from services/sync.ts
      → apiPost('/api/Calendar/events', event)
        ← Created event
    → setAllEvents / setRawCalendarEvents update local state
    → Modal closes
```

### Concrete Example: Gmail

```
MailScreen receives focus (useIsFocused)
  → autoSyncGmail() triggers backend-side Gmail fetch
    → apiPost('/api/Gmail/auto-sync')
  → fetchGmailEmails(page, limit)
    → apiGet('/api/Gmail/emails?page=1&limit=20')
      ← Raw email objects with inconsistent shapes
    → normalizeGmailEmail() unifies each email
    ← GmailEmail[] stored in useState

User presses email
  → markGmailEmailAsRead(emailId)
    → apiPut('/api/Gmail/emails/:id/read')
  → Local state updated (isRead = true)
  → MailDetailModal opens
```

### Data Flow Rules

1. **Services are the only layer that makes network or device API calls.** Screens never call `fetch()` directly.
2. **Normalisation happens inside services**, not in screens. Backend response shapes are not leaked to the UI layer.
3. **Screens own their state via `useState`.** There is no global store for feature data.
4. **Mock data is imported directly from `data/` files** and passed as initial state or static props. When replacing with real data, keep the type contract identical and swap the import for a service call.

---

## 4. API Flow

### HTTP Client Architecture

All backend communication routes through `src/services/api.ts`, which exposes three public functions:

```typescript
apiGet<T>(path: string, options?: { skipAuth?: boolean }): Promise<T>
apiPost<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }): Promise<T>
apiPut<T>(path: string, body: unknown, options?: { skipAuth?: boolean }): Promise<T>
```

These are thin wrappers around the internal `makeRequest<T>()` function.

### Request Lifecycle

```
1. Resolve auth token
   └─ getAuthToken() reads AUTH_TOKEN from expo-secure-store

2. Build request
   ├─ URL: API_BASE_URL + normalised path
   ├─ Headers: Content-Type: application/json, Authorization: Bearer <token>
   ├─ Body: JSON.stringify(body) if provided
   └─ AbortController: 300-second timeout

3. Execute fetch()
   ├─ On network error → throw with descriptive message
   └─ On timeout → throw with timeout message

4. Parse response
   ├─ response.json() with fallback to {}
   └─ Unwrap { body: ... } envelope if present

5. Handle status codes
   ├─ 401 (not on /refresh_token or /login):
   │   ├─ Attempt refreshAccessToken() (mutex-protected)
   │   │   ├─ getRefreshToken() from SecureStore
   │   │   ├─ POST /api/Auth/refresh_token
   │   │   ├─ updateAuthToken() in SecureStore
   │   │   └─ Retry original request with new token
   │   └─ If refresh fails → clearAuthData() → throw session-expired error
   │
   ├─ Other non-2xx → Extract error message from response body → throw Error
   │   (tries: message, Messenger, messenger, error, errorMessage, Message)
   │
   └─ 2xx → Return typed response body as T
```

### Token Refresh Concurrency

The refresh mechanism uses a module-level mutex:

```typescript
let isRefreshingToken = false;
let refreshTokenPromise: Promise<boolean> | null = null;
```

If multiple requests receive 401 simultaneously, only the first triggers a refresh. Subsequent callers await the same Promise. This prevents token refresh races.

### API Endpoint Catalogue

| Path                                   | Method | Auth | Service file  |
|----------------------------------------|--------|------|---------------|
| `/api/Auth/login`                      | POST   | No   | `auth.ts`     |
| `/api/Auth/register`                   | POST   | No   | `auth.ts`     |
| `/api/Auth/google-login`               | POST   | No   | `auth.ts`     |
| `/api/Auth/verify-email`               | POST   | No   | `auth.ts`     |
| `/api/Auth/resend-otp`                 | POST   | No   | `auth.ts`     |
| `/api/Auth/forgot-password`            | POST   | No   | `auth.ts`     |
| `/api/Auth/reset-password`             | POST   | No   | `auth.ts`     |
| `/api/Auth/refresh_token`              | POST   | No   | `auth.ts`     |
| `/api/Contacts/sync`                   | POST   | Yes  | `sync.ts`     |
| `/api/Calendar/sync`                   | POST   | Yes  | `sync.ts`     |
| `/api/Calendar/events`                 | GET    | Yes  | `sync.ts`     |
| `/api/Calendar/events`                 | POST   | Yes  | `sync.ts`     |
| `/api/Calendar/events/:id`            | PUT    | Yes  | `sync.ts`     |
| `/api/Calendar/conflicts`              | GET    | Yes  | `sync.ts`     |
| `/api/Calendar/conflicts/:id/resolve` | PUT    | Yes  | `sync.ts`     |
| `/api/Gmail/connect`                   | POST   | Yes  | `gmail.ts`    |
| `/api/Gmail/auto-sync`                 | POST   | Yes  | `gmail.ts`    |
| `/api/Gmail/emails`                    | GET    | Yes  | `gmail.ts`    |
| `/api/Gmail/emails/:id/read`          | PUT    | Yes  | `gmail.ts`    |

### Adding New Endpoints

1. Add the API function in the appropriate service file (or create a new one in `services/`).
2. Use the generic `apiGet<T>`, `apiPost<T>`, or `apiPut<T>` — never call `fetch()` directly.
3. Define response types in `types/` or inline with the function.
4. Normalise the response inside the service if the backend shape is inconsistent.
5. Authenticated endpoints require no special handling — `api.ts` injects the token automatically.
6. For unauthenticated endpoints, pass `{ skipAuth: true }`.

---

## 5. Authentication Flow

### Architecture

Authentication is managed by three cooperating layers:

| Layer                | File                     | Responsibility                                          |
|----------------------|--------------------------|---------------------------------------------------------|
| **Context Provider** | `context/AuthContext.tsx` | Global state (`user`, `token`, `initialized`), auth action dispatch |
| **Auth Service**     | `services/auth.ts`       | API calls, response normalisation                       |
| **Auth Storage**     | `services/authStorage.ts`| Encrypted persistence via expo-secure-store             |
| **Google Auth**      | `services/googleAuth.ts` | Google Sign-In SDK, returns idToken + serverAuthCode    |
| **Auth Flow**        | `services/authFlow.ts`   | Composite orchestrations (OTP verify → auto-login)      |

### Supported Auth Methods

1. **Email + Password Login** — `signIn(email, password)`
2. **Email + Password Registration + OTP Verification** — `signUp()` → OTP modal → `verifyOTP()` → `login()`
3. **Google OAuth** — `signInWithGoogle(idToken, serverAuthCode)` — also auto-connects Gmail on first login
4. **Password Reset** — Forgot Password → OTP → Reset Password (3-step modal flow)

### Session Persistence

On app launch, `AuthContext.useEffect` calls `getSavedAuth()`:

```
expo-secure-store
  ├── AUTH_TOKEN     → JWT access token
  ├── AUTH_USER      → JSON-serialised { id, name, email }
  ├── REFRESH_TOKEN  → App-level refresh token (from login)
  └── GOOGLE_REFRESH_TOKEN → Google OAuth refresh token (from Google login)
```

If `AUTH_TOKEN` exists, the user is considered authenticated and routed to `MainNavigator`. Token validity is only verified upon the first API call that returns 401.

### Google OAuth + Gmail Connection

On first Google login, the app:

1. Obtains `serverAuthCode` from Google Sign-In (one-time-use authorization code)
2. Sends it to the backend via `POST /api/Auth/google-login`
3. Checks if Gmail has been connected for this user ID (`GMAIL_CONNECT_SENT_USER_<id>`)
4. If not, sends `serverAuthCode` to `POST /api/Gmail/connect` so the backend can exchange it for a Google refresh token and begin reading Gmail
5. Flags `GMAIL_CONNECT_SENT` in SecureStore to prevent duplicate connect calls

### Navigation Guards

`AppNavigator` reads `useAuth()` and renders:

- `user === null` → `AuthNavigator` (Login/Register)
- `user !== null` → `MainNavigator` (Home/Chat/Tasks/Calendar/Mail)
- `initialized === false` → `null` (splash screen remains visible)

---

## 6. UI Flow

### Screen Lifecycle

```
App.tsx
  └─ AuthProvider (initialises auth from SecureStore)
      └─ AppNavigator
          ├─ [Unauthenticated] AuthNavigator
          │   ├─ LoginScreen
          │   │   ├─ MeshBackground (animated gradient)
          │   │   ├─ AuthHeroBranding (logo + tagline)
          │   │   ├─ Login form (UnderlineTextInput, PasswordInput)
          │   │   ├─ PrimaryButton ("Đăng nhập")
          │   │   ├─ SocialLoginButton (Google)
          │   │   ├─ ForgotPasswordModal → OTPVerificationModal → ResetPasswordModal
          │   │   └─ Navigation link to Register
          │   │
          │   └─ RegisterScreen
          │       ├─ MeshBackground (register variant)
          │       ├─ Registration form
          │       ├─ OTPVerificationModal (post-registration)
          │       └─ Navigation link to Login
          │
          └─ [Authenticated] MainNavigator
              ├─ Active Tab Screen (rendered by switch statement)
              │   ├─ TabScreenLayout (wraps all tab screens)
              │   │   ├─ TopAppBar (logo, title, settings gear)
              │   │   ├─ ScrollView (main content area)
              │   │   └─ footer slot (FABs, compose buttons)
              │   │
              │   ├─ HomeScreen: DaySummaryCard, EmailSummarySection, UpcomingMeetingCard, TaskListSection
              │   ├─ ChatScreen: ChatStatusBanner, ChatMessageList, QuickActionChips, ChatComposer
              │   ├─ TasksScreen: TasksProgressCard, TaskFilterChips, ProjectCard, TaskListItem
              │   ├─ EventsScreen: DateSelectorStrip, EventsInsightCard, EventTimeline, Create/EditEventModal
              │   └─ MailScreen: MailFilterBar, MailAiSummaryCard, GmailEmailSection, MailDetailModal
              │
              └─ BottomNavBar (floating pill, always visible, glassmorphic)
```

### TabScreenLayout Contract

Every main tab screen must use `TabScreenLayout`:

```tsx
<TabScreenLayout
  topBar={<TopAppBar onSettingsPress={openSettings} />}
  bottomExtra={SCROLL_BOTTOM_EXTRA + offset}
  footer={<SomeFAB bottomOffset={bottomChrome + gap} />}
  scrollViewProps={{ /* optional scroll customisation */ }}
>
  {/* Screen content */}
</TabScreenLayout>
```

This ensures consistent layout: fixed top bar, padded scroll area, correct bottom insets, and floating footer placement.

### TopAppBar Modes

1. **Default mode** (no `showBack`): Displays logo + title + settings icon.
2. **Back mode** (`showBack={true}`): Displays back arrow + centred title + optional right actions.

### BottomNavBar

- Renders from the `APP_TABS` array in `data/navigationTabs.ts`.
- Uses `IosGlassView` for a frosted-glass pill bar, positioned absolutely above the safe area.
- Calls `onTabPress(tabId)` to update `MainNavigator`'s `activeTab` state.

---

## 7. Naming Conventions

### Files

| Kind                  | Convention         | Example                        |
|-----------------------|--------------------|--------------------------------|
| Screen component      | `FeatureScreen.tsx` | `HomeScreen.tsx`, `MailScreen.tsx` |
| Feature component     | `PascalCase.tsx`   | `DaySummaryCard.tsx`, `MailFilterBar.tsx` |
| Shared UI component   | `PascalCase.tsx`   | `GlassCard.tsx`, `PrimaryButton.tsx` |
| Service module        | `camelCase.ts`     | `auth.ts`, `gmail.ts`, `authStorage.ts` |
| Type definition file  | `camelCase.ts`     | `events.ts`, `mail.ts`, `navigation.ts` |
| Mock data file        | `featureMock.ts`   | `homeMock.ts`, `mailMock.ts`   |
| Asset constant file   | `featureAssets.ts` | `homeAssets.ts`, `chatAssets.ts` |
| Navigator             | `FeatureNavigator.tsx` | `AppNavigator.tsx`, `AuthNavigator.tsx` |

### Code Symbols

| Kind            | Convention           | Example                                 |
|-----------------|----------------------|-----------------------------------------|
| Component       | PascalCase           | `DaySummaryCard`, `TabScreenLayout`      |
| Function        | camelCase            | `fetchGmailEmails`, `handleContactSync`  |
| Type / Interface| PascalCase           | `AuthUser`, `TimelineEvent`, `MailCategory` |
| Constant object | UPPER_SNAKE_CASE     | `COLORS`, `RADIUS`, `SHADOW`, `SPACING`  |
| Constant object (compound) | camelCase  | `typography` (because it exports TextStyle objects) |
| Enum-like unions| PascalCase values    | `AppTabId = 'home' \| 'chat' \| ...`     |
| Boolean state   | `is*` / `has*`       | `isConnecting`, `isDetailOpen`, `hasSyncedDeviceDataThisSession` |
| Handler         | `handle*` / `on*`    | `handleEmailPress`, `onTabPress`         |
| Hook            | `use*`               | `useAuth`, `useOpenSettings`             |
| SecureStore key | UPPER_SNAKE_CASE string | `'AUTH_TOKEN'`, `'REFRESH_TOKEN'`     |

### Import Ordering

Imports follow this sequence (separated by blank lines where practical):

1. React and React Native core
2. Third-party libraries (expo-*, @react-navigation/*, etc.)
3. Internal components
4. Internal services, hooks, constants
5. Type imports (use `import type` where possible)

---

## 8. Code Conventions

### TypeScript

- **Strict mode** is enabled. Do not use `@ts-ignore` without documenting the reason.
- Use `satisfies` for compile-time type checking of constant objects (see `typography.ts`).
- Use `as const` for immutable constant objects (see `theme.ts`).
- Prefer `type` over `interface` for data shapes. Reserve `interface` for contracts that may be extended.
- All API response generics must be explicit: `apiPost<ResponseType>(...)`.

### Components

- **Functional components only.** No class components.
- **`export default`** for components. Named exports for hooks, types, and utilities.
- One component per file. The filename matches the component name exactly.
- Styles are defined via `StyleSheet.create()` at the bottom of the file, never inline.
- Spread theme tokens into styles rather than referencing them at render time:

```typescript
// Correct
const styles = StyleSheet.create({
  title: {
    ...typography.headlineMd,
    color: COLORS.onSurface,
  },
});

// Avoid
<Text style={{ fontSize: 24, color: '#131b2e' }}>
```

### Async Code

- Use `async/await` exclusively. Do not use `.then()` chains.
- Wrap async operations in `try/catch` at the screen level.

### Props

- Define prop types inline or as a named type exported from the same file:

```typescript
export type BottomNavBarProps = {
  activeTab: AppTabId;
  onTabPress?: (tab: AppTabId) => void;
};
```

### Conditional Rendering

- Use ternary operators for simple conditions.
- Use early returns for guard clauses.
- For complex switches, extract to a `renderX()` function (see `MainNavigator.renderScreen()`).

---

## 9. Services

### Service Architecture

Each service file has a single, well-defined responsibility. Services are pure modules — they export standalone async functions. They do not hold state (except `sync.ts`'s session-level sync flag).

### Service Catalogue

#### `api.ts` — HTTP Client

The foundational networking layer. All other services depend on this.

- `apiGet<T>(path, options?)` — HTTP GET.
- `apiPost<T>(path, body?, options?)` — HTTP POST.
- `apiPut<T>(path, body, options?)` — HTTP PUT.
- Internal: `makeRequest<T>()` — request construction, auth injection, error handling, 401 refresh.
- Internal: `refreshAccessToken()` — mutex-protected token refresh.

**Never call `fetch()` directly from outside this file.**

#### `auth.ts` — Authentication API

All authentication-related backend calls.

- `login(email, password)` → `AuthResponse`
- `register(name, email, password)` → `{ success }`
- `loginWithGoogle(idToken, serverAuthCode?)` → `AuthResponse`
- `loginWithGoogleRefreshToken(refreshToken)` → `AuthResponse`
- `verifyOTP(email, otp)` → `{ success }`
- `resendOTP(email)` → `{ success }`
- `forgotPassword(email)` → `{ success, message }`
- `resetPassword({ email, otp, newPassword })` → `{ success, message }`
- `refreshToken(refreshTokenValue)` → `{ token, refreshToken? }`

Internal: `normalizeAuthResponse()` — handles 6+ possible backend response shapes for auth.

#### `authFlow.ts` — Auth Orchestration

Composite auth flows that combine multiple service calls.

- `completeRegistrationWithOtp(email, password, otp)` — verifies OTP then auto-logs in.

#### `authStorage.ts` — Secure Persistence

Encrypted key-value storage for auth credentials.

- `getAuthToken()`, `getRefreshToken()`, `getGoogleRefreshToken()`
- `saveAuthData(response)`, `updateAuthToken(token, refreshToken?)`
- `clearAuthData()` — wipes all stored credentials.
- `saveGoogleRefreshToken(token)`, `clearGoogleRefreshToken()`
- `getGmailConnectSent(userId)`, `saveGmailConnectSent(userId)`, `clearGmailConnectSent(userId)`

#### `googleAuth.ts` — Google Sign-In SDK

Google OAuth integration.

- `configureGoogleSignIn(webClientId)` — lazy-initialised SDK configuration.
- `getGoogleIdToken()` → `{ idToken, serverAuthCode }` — full sign-in flow.
- `signOutGoogle()` — clears cached tokens, revokes access, signs out.

#### `gmail.ts` — Gmail Integration

Gmail backend integration (emails are fetched server-side via Google API).

- `connectGmail(serverAuthCode?)` — sends auth code to backend.
- `connectGmailForCurrentUser()` — triggers fresh Google sign-in, then connects.
- `autoSyncGmail()` — triggers backend-side email sync.
- `fetchGmailEmails(page, limit)` → `GmailEmail[]` — paginated email fetch with normalisation.
- `markGmailEmailAsRead(emailId)` — marks email as read.

Internal: 8 normaliser functions (`getSender`, `getFromHeader`, `getContent`, `getRecipient`, `getReceivedAt`, `cleanSenderName`, `normalizeGmailEmail`).

#### `calendar.ts` — Device Calendar

Local device calendar access via `expo-calendar`.

- `requestCalendarPermission()` → `boolean`
- `fetchDeviceCalendarEvents(start?, end?)` → `CalendarSyncRequest[]`

#### `contacts.ts` — Device Contacts

Local device contacts access via `expo-contacts`.

- `requestContactsPermission()` → `boolean`
- `fetchDeviceContacts()` → `ContactSyncRequest[]` (with deduplication and normalisation).

#### `sync.ts` — Backend Data Sync

Synchronisation between device data and backend, plus server-side CRUD.

- `syncContacts(contacts)` — bulk uploads contacts.
- `syncCalendars(data)` — bulk uploads calendar events.
- `fetchCalendarEvents(from?, to?)` → `CalendarSyncRequest[]` — fetches events from backend.
- `createCalendarEvent(event)` → `CalendarSyncRequest` — creates event on backend.
- `updateCalendarEvent(eventId, event)` → `CalendarSyncRequest` — updates event on backend.
- `getCalendarConflicts()` → `CalendarConflict[]`
- `resolveCalendarConflict(conflictId, resolution)` — resolves sync conflicts.
- `syncCalendarsAndResolveConflicts(data)` — composite: sync + auto-resolve conflicts.
- `shouldSyncDeviceDataThisSession()` / `markDeviceDataSyncedThisSession()` — session-level sync gate.

### Adding a New Service

1. Create `src/services/featureName.ts`.
2. Import `apiGet`/`apiPost`/`apiPut` from `./api`.
3. Define request/response types at the top of the file or in `types/`.
4. Export pure async functions. Do not store state unless absolutely necessary.
5. Normalise any inconsistent backend responses inside the service.
6. Add the endpoint to the catalogue table in this document.

---

## 10. Repository Rules

### Git

- `.gitignore` excludes `node_modules/`, `.expo/`, `dist/`, `/ios`, `/android` (generated), `.env`, `*.tsbuildinfo`.
- The `/android` directory in the repository is an Expo-generated native project. Do not manually edit files within it unless required for native module linking. Prefer Expo config plugins in `app.json`.

### Branching

- Feature branches should be named descriptively: `feature/gmail-pagination`, `fix/otp-resend-timer`.
- Do not commit `trace.txt`, debug logs, or build artefacts.

### Commits

- Commit messages should be in English and follow conventional format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- One logical change per commit. Do not bundle unrelated changes.

### Dependencies

- Do not add dependencies without justification. The project already has unused dependencies (`@reduxjs/toolkit`, `react-redux`) — do not add more that might go unused.
- Prefer Expo-compatible packages. Check the [Expo SDK compatibility list](https://docs.expo.dev/versions/latest/) before adding native modules.
- Run `npx expo install <package>` instead of `npm install` to ensure version compatibility with the current Expo SDK.

### Code Review Standards

- All new services must include error handling that conforms to §12.
- All new components must use design tokens from `constants/theme.ts` and `constants/typography.ts`. Hardcoded colours and font sizes will be rejected.
- All new screens must use `TabScreenLayout` with `TopAppBar`.

---

## 11. State Management

### Current Architecture

The application uses a two-tier state model:

#### Tier 1: Global State — React Context

| Context        | File                     | State                            | Consumers      |
|----------------|--------------------------|----------------------------------|-----------------|
| `AuthContext`  | `context/AuthContext.tsx` | `user`, `token`, `initialized`  | Navigation, screens, services |

The context value is memoised with `useMemo` keyed on `[user, token, initialized]`.

Consumed via the `useAuth()` hook. Calling `useAuth()` outside `AuthProvider` throws a descriptive error.

#### Tier 2: Local State — Component `useState`

All feature data (events, emails, tasks, chat messages, filter selections, modal visibility, loading/error flags) lives in `useState` hooks within screen components.

**Consequences:**

- Switching tabs in `MainNavigator` **unmounts** the previous screen and **remounts** the new one, which resets all local state.
- Data is re-fetched from the API on every tab entry.
- There is no shared state between sibling screens (e.g., HomeScreen cannot read MailScreen's loaded emails).

#### Tier 3: Persistent State — expo-secure-store

Auth credentials survive app restarts via `expo-secure-store`. No other data is persisted locally.

### State Placement Decision Tree

```
Is the state needed across the entire app?
  → Yes → AuthContext (or future global context/store)

Is the state needed only within a single screen?
  → Yes → useState in the screen component

Is the state a UI concern (modal open, filter active, loading)?
  → Yes → useState in the nearest owning component

Does the state need to survive app restart?
  → Yes → expo-secure-store (via authStorage.ts or a new storage service)
```

---

## 12. Error Handling

### Layered Error Strategy

| Layer         | Responsibility                                           | Mechanism                      |
|---------------|----------------------------------------------------------|---------------------------------|
| `api.ts`      | Network errors, timeouts, HTTP status codes, token expiry | Throws `Error` with message    |
| Services      | Business-level validation, response normalisation         | Throws `Error` or returns `{ success, message }` |
| Screens       | User-facing error display                                | `try/catch` → `Alert.alert()` or error state |
| `AuthContext` | Auth-specific errors                                     | Re-throws to calling screen    |

### Error Handling Contract

1. **Services MUST throw `Error` objects**, not return `null` or `undefined` on failure.
2. **Screens MUST wrap service calls in `try/catch`** and present errors to the user.
3. **Error messages from the backend** are extracted by `api.ts` and set as the `Error.message`. They are often in Vietnamese.
4. **Loading states** (`isLoading`, `isConnecting`) must be managed alongside error states. Set loading to `false` in the `finally` block.

### Standard Screen Error Pattern

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await someService();
    setData(data);
  } catch (err: any) {
    console.error('Context identifier:', err);
    setError(err?.message || 'Đã xảy ra lỗi.');
  } finally {
    setLoading(false);
  }
};
```

### What Is NOT Currently Implemented

- No global `ErrorBoundary` component.
- No toast/snackbar system — only `Alert.alert()`.
- No error reporting to external services (Sentry, Bugsnag).
- No retry UI for failed requests (except the automatic 401 token refresh).

---

## 13. Component Hierarchy

### Hierarchy Classification

Components are classified into four tiers. Higher tiers may import from lower tiers, but not vice versa.

```
Tier 4: Screens      (src/screens/)
  └─ Tier 3: Feature Components  (src/components/{feature}/)
      └─ Tier 2: Layout Components  (src/components/layout/, src/components/navigation/)
          └─ Tier 1: UI Primitives  (src/components/ui/)
```

### Tier 1 — UI Primitives (`components/ui/`)

Self-contained, feature-agnostic, reusable across the entire app. Accept only generic props (style, value, onPress, placeholder). Have no knowledge of business domains.

| Component           | Purpose                                      |
|---------------------|----------------------------------------------|
| `AppGlassCard`      | Styled card with glass effect and shadow     |
| `AppLogo`           | Brand logo rendering                         |
| `BorderTextInput`   | Text input with border styling               |
| `DividerWithLabel`  | "── or ──" horizontal divider                |
| `GlassCard`         | Minimal glass-effect container               |
| `IosGlassView`      | Cross-platform frosted blur (expo-blur)      |
| `MeshBackground`    | Animated gradient mesh background            |
| `OTPInput`          | 6-digit verification code input              |
| `PasswordInput`     | Password field with visibility toggle        |
| `PrimaryButton`     | Gradient CTA button with loading state       |
| `SocialLoginButton` | OAuth provider sign-in button                |
| `UnderlineTextInput`| Underline-styled text input                  |

### Tier 2 — Layout & Navigation (`components/layout/`, `components/navigation/`)

Structural components that define page layout and navigation chrome. Used by all screens.

| Component         | Purpose                                            |
|-------------------|----------------------------------------------------|
| `TabScreenLayout` | Scroll container with top bar, content, and footer |
| `TopAppBar`       | Fixed header with logo, title, settings, back      |
| `BottomNavBar`    | Floating glassmorphic tab bar                      |
| `AppBottomNav`    | Re-export wrapper (legacy)                         |

### Tier 3 — Feature Components (`components/{feature}/`)

Domain-specific components bound to a single feature. May import Tier 1 and Tier 2, but never from another feature's Tier 3.

**Cross-feature imports between Tier 3 directories are prohibited.** If two features need the same component, extract it to `components/ui/`.

### Tier 4 — Screens (`screens/`)

Top-level route components. Orchestrate feature components, manage local state, call services, and handle user interactions. One screen per file, one file per route.

### Import Rules Summary

| From ↓ \ To → | ui/ | layout/nav/ | feature/ | screens/ |
|----------------|-----|-------------|----------|----------|
| **ui/**        | ✅  | ❌          | ❌       | ❌       |
| **layout/nav/**| ✅  | ✅          | ❌       | ❌       |
| **feature/**   | ✅  | ✅          | Same only| ❌       |
| **screens/**   | ✅  | ✅          | ✅       | ❌       |

---

## 14. Best Practices

### When Adding a New Feature

1. **Define types** in `src/types/featureName.ts`.
2. **Create mock data** in `src/data/featureNameMock.ts` (if not yet backed by API).
3. **Create asset constants** in `src/constants/featureNameAssets.ts` (icons, labels, colours).
4. **Build service** in `src/services/featureName.ts` (if API-backed).
5. **Build components** in `src/components/featureName/`, following Tier 3 rules.
6. **Build screen** in `src/screens/featureName/FeatureNameScreen.tsx`.
7. **Add navigation** — update `MainNavigator` switch, `APP_TABS` data, and `AppTabId` type.

### When Replacing Mock Data with Real API

1. Keep the **existing type contract** (`types/featureName.ts`) unchanged if possible.
2. Create a service function that returns the same type shape as the mock data.
3. Replace the `import { MOCK_DATA } from '../../data/featureMock'` with a service call inside `useEffect`.
4. Add `loading` and `error` state handling.
5. Remove or deprecate the mock data file once the feature is fully integrated.

### Performance Checklist

- Use `FlatList` for lists exceeding 10–15 items. Do not use `ScrollView` + `.map()`.
- Memoize expensive computations with `useMemo`.
- Stabilise callback references with `useCallback` when passing to child components.
- Avoid creating functions inline in render: `onPress={() => handlePress(id)}` inside lists creates a new closure per item per render. Extract to a memoized component.
- Use `React.memo` for list item components.

### Security Checklist

- Never log sensitive data (passwords, tokens, personal information) to the console.
- Always use `{ skipAuth: true }` for endpoints that must not send Bearer tokens.
- Use `expo-secure-store` for any data that must persist securely. Never use `AsyncStorage` for secrets.

---

## 15. Design Principles

### Visual Design System

The UI is built on a **Material Design 3-inspired** token system with glassmorphism enhancements.

#### Colour System

All colours are defined in `constants/theme.ts` under `COLORS`. The palette follows Material 3 naming:

- **Primary**: `#3525cd` (deep indigo) — CTAs, active states, brand identity.
- **Secondary**: `#8127cf` (purple) — AI-related surfaces, secondary actions.
- **Surface stack**: `background` → `surfaceContainerLowest` → `surfaceContainerLow` → `surfaceContainer` → `surfaceContainerHigh` — layered elevation.
- **On-colours**: `onPrimary`, `onSurface`, `onSurfaceVariant`, `outline` — text/icon colours for each surface.
- **Semantic**: `error`, `emerald` (success).
- **Glass/Mesh**: Translucent `rgba()` values for blur backgrounds, glows, and mesh gradients.

**Rule: Never hardcode colour values in component files.** Always reference `COLORS.*`.

#### Typography

Nine text style presets in `constants/typography.ts`:

| Token           | Size | Weight | Use case                     |
|-----------------|------|--------|------------------------------|
| `displayLgMobile`| 32  | 600    | Screen greeting headlines    |
| `headlineMd`    | 24   | 600    | Section headers, top bar     |
| `headlineSm`    | 18   | 600    | Card titles                  |
| `statLg`        | 30   | 700    | Large stat numbers           |
| `bodyLg`        | 16   | 400    | Primary body text            |
| `bodyMd`        | 14   | 400    | Secondary/descriptive text   |
| `labelCaps`     | 12   | 600    | Uppercase labels             |
| `linkSmall`     | 10   | 600    | Tiny uppercase links         |
| `taskMeta`      | 10   | 700    | Task metadata labels         |

**Rule: Always spread typography tokens into styles.** Do not define font sizes, weights, or line heights ad hoc.

#### Spacing and Layout

- `SPACING.containerMobile` — horizontal page padding.
- `SCROLL_SECTION_GAP` (32) — vertical gap between sections.
- `SCROLL_CONTENT_GAP` (16) — content gap below top bar.
- Bar heights, z-indexes, and bottom inset calculators are in `constants/layout.ts`.

**Rule: Use the layout constants and calculator functions.** Do not hardcode bar heights or safe area calculations.

#### Elevation and Glass

- Shadow presets (`SHADOW.card`, `SHADOW.button`, `SHADOW.aiGlow`) use the primary/secondary colours as shadow colours, not black.
- `IosGlassView` wraps `expo-blur`'s `BlurView` with platform-appropriate intensity values.
- Glass borders use `rgba(255, 255, 255, 0.3)` hairline borders over blurred backgrounds.

---

## 16. What Should Never Be Changed

The following elements are foundational contracts. Changing them would cascade across the entire codebase.

### Do Not Modify

| Element                          | File                          | Reason                                           |
|----------------------------------|-------------------------------|--------------------------------------------------|
| `COLORS` object keys             | `constants/theme.ts`          | Referenced in 50+ component style sheets         |
| `typography` object keys         | `constants/typography.ts`     | Spread into styles throughout the codebase        |
| `RADIUS` and `SHADOW` keys       | `constants/theme.ts`          | Used in all card and button components            |
| `AuthContextValue` type shape    | `context/AuthContext.tsx`     | Consumed by every screen and the navigator        |
| `AuthResponse` / `AuthUser` types| `services/auth.ts`            | Used by AuthContext, authStorage, and screens     |
| `AppTabId` union                 | `types/navigation.ts`         | Used by MainNavigator, BottomNavBar, navigationTabs |
| `APP_TABS` array structure       | `data/navigationTabs.ts`      | Drives bottom navigation rendering               |
| `RootStackParamList` type        | `navigation/types.ts`         | Defines all root navigation routes                |
| `apiGet` / `apiPost` / `apiPut` signatures | `services/api.ts`   | Every service depends on these                    |
| `TabScreenLayout` prop contract  | `components/layout/TabScreenLayout.tsx` | Used by all five main screens          |
| `TopAppBar` prop contract        | `components/navigation/TopAppBar.tsx` | Used by all main screens and Settings  |
| `BottomNavBar` prop contract     | `components/navigation/BottomNavBar.tsx` | Used by MainNavigator               |
| expo-secure-store key strings    | `services/authStorage.ts`     | Changing keys would orphan existing user sessions |
| `API_BASE_URL`                   | `services/api.ts`             | All backend communication depends on this         |

### Change With Extreme Caution

| Element                          | Risk                                                  |
|----------------------------------|-------------------------------------------------------|
| `App.tsx` provider hierarchy     | Reordering providers can break context access          |
| `AppNavigator` screen registration | Affects the entire navigation graph                 |
| `MainNavigator` tab switch logic | Affects all five main screens                         |
| `makeRequest()` error handling   | Could break error display across all screens          |
| `normalizeAuthResponse()`        | Incorrect normalisation silently breaks authentication |
| `normalizeGmailEmail()`          | Incorrect normalisation corrupts the entire mail view  |

---

*This document is the source of truth for architectural decisions in the Hivic AI project. Update it when making structural changes. If a code change contradicts this document, the document should be updated first and reviewed before the code change is merged.*
