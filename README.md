# Personal Dashboard - Production Ready 🚀

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

Ein vollständig ausgestattetes, produktionsreifes Personal Dashboard mit modernem Design und umfangreichen Features.

## 🎯 Features

### 🔥 Haupt-Features

#### 1. **Finance & Crypto Dashboard**
- Live-Kursdaten für 6 Top-Kryptowährungen (Bitcoin, Ethereum, BNB, Cardano, Solana, Ripple)
- Echtzeit-Preise und 24h-Veränderungen
- Market Cap Anzeigen
- Automatische Aktualisierung alle 2 Minuten
- Powered by CoinGecko API

#### 2. **Habit Tracker mit Streak-System**
- Unbegrenzt viele Habits anlegen
- Wöchentliche Übersicht mit 7-Tage-Ansicht
- Streak-Tracking (aktuell & Rekord)
- Anpassbare Icons und Farben für jedes Habit
- Lokale Speicherung - keine Anmeldung erforderlich
- Statistiken: Aktuelle Streak, Longest Streak, Total Completions

#### 3. **Musik Player**
- Integrierter Musik-Player mit Playlist
- Play/Pause/Skip Funktionalität
- Progress Bar mit Zeitanzeige
- Quick Playlist mit 5 Tracks
- Animierte Album Art
- Simulierter Playback für Demo

### 📊 Dashboard Features

#### Wetter & Luftqualität
- Aktuelle Wetterdaten für Leopoldshafen
- Detaillierte Informationen (Temperatur, Gefühlte Temperatur, Luftfeuchtigkeit, Wind)
- Air Quality Index (AQI) mit PM2.5 und PM10 Werten
- Automatische Aktualisierung alle 10 Minuten

#### Google Calendar Integration
- Heute's Termine im Überblick
- OAuth2 Authentifizierung
- Automatische Synchronisierung alle 5 Minuten

#### Google Tasks Integration
- Aufgabenliste mit direkter Bearbeitung
- Task-Completion direkt im Dashboard
- OAuth2 Authentifizierung

#### News Feed
- Top 3 Nachrichten aus den letzten 24 Stunden
- Powered by NewsAPI
- Automatische Aktualisierung alle 30 Minuten

### ⏲️ Timer & Productivity

#### Pomodoro Timer
- 3 Modi: Arbeit (25 Min), Kurze Pause (5 Min), Lange Pause (15 Min)
- Visueller Countdown mit Progress Ring
- Session Counter
- Desktop Notifications

#### Countdown Timer
- Frei konfigurierbare Minuten und Sekunden
- Start/Pause/Reset Funktionen
- Benachrichtigung bei Ablauf

#### Stopwatch
- Einfacher Stopwatch
- Start/Pause/Reset

### 🛠️ Quick Tools

#### 1. **Calculator (Rechner)**
- Voll funktionsfähiger Taschenrechner
- Grundrechenarten (+, -, ×, ÷)
- Clear und Equals Buttons
- Kompaktes Design

#### 2. **Birthday Reminders (Geburtstage)**
- Verwalte wichtige Geburtstage
- Zeigt Geburtstage der nächsten 30 Tage
- Countdown bis zum nächsten Geburtstag
- Lokale Speicherung

#### 3. **Step Counter (Schrittezähler)**
- Täglicher Schrittzähler
- Ziel: 10.000 Schritte
- Visueller Progress Ring
- Quick-Add Buttons (+500, +1000)
- Auto-Reset täglich

#### 4. **Currency Converter (Währungsrechner)**
- 5 Währungen: EUR, USD, GBP, JPY, CHF
- Live Exchange Rates
- Swap-Funktion
- Echtzeit-Umrechnung

### 💭 Quote of the Day
- Wechselnde inspirierende Zitate
- Täglich neues Zitat
- Automatische Rotation

## 🎨 Design

- **Modernes Dark Theme** mit Gradient-Backgrounds
- **Glassmorphism** Effects mit Backdrop Blur
- **Responsive Design** - funktioniert auf Desktop, Tablet und Mobile
- **Smooth Animations** und Transitions
- **Icon System** von Lucide Icons
- **Production-Ready** UI/UX

## 🚀 Quick Start

### Installation

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Weather API (Required)
NUXT_PUBLIC_WEATHER_API_KEY=your_weatherapi_key

# Google OAuth (Required for Calendar & Tasks)
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

#### API Keys Setup:

1. **WeatherAPI.com** (Weather Data)
   - Get free API key: [weatherapi.com](https://www.weatherapi.com/)
   - Free tier: 1M calls/month

2. **Google OAuth** (Calendar & Tasks)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Calendar API and Google Tasks API
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins: `http://localhost:3000`

3. **NewsAPI** (Optional - hardcoded in code)
   - Get free API key: [newsapi.org](https://newsapi.org/)

## 📱 Local Storage Features

Diese Features werden lokal im Browser gespeichert (kein Account nötig):

- ✅ Habit Tracker
- ✅ Birthday Reminders  
- ✅ Step Counter (täglicher Reset)
- ✅ Quote of the Day

## 🎯 Production Deployment

### Build für Produktion

```bash
# Build the application
pnpm build

# Preview production build
pnpm preview
```

### Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push Code zu GitHub
2. Importiere Projekt in Vercel
3. Füge Environment Variables hinzu:
   - `NUXT_PUBLIC_WEATHER_API_KEY`
   - `NUXT_PUBLIC_GOOGLE_CLIENT_ID`
4. Deploy!

## 🛠️ Tech Stack

- **Framework:** Nuxt 3
- **UI Library:** Nuxt UI (built on Tailwind CSS)
- **Icons:** Lucide Icons
- **APIs:** 
  - CoinGecko API (Crypto Prices)
  - WeatherAPI.com (Weather Data)
  - NewsAPI (News Feed)
  - Google Calendar API
  - Google Tasks API

## 📝 Features Comparison

| Feature | Status | Local Storage | API Required |
|---------|--------|---------------|--------------|
| Weather | ✅ | No | WeatherAPI |
| Crypto Dashboard | ✅ | No | CoinGecko (Free) |
| Habit Tracker | ✅ | Yes | No |
| Music Player | ✅ | No | No |
| Calendar | ✅ | No | Google OAuth |
| Tasks | ✅ | No | Google OAuth |
| News Feed | ✅ | No | NewsAPI |
| Timers (Pomodoro, Countdown, Stopwatch) | ✅ | No | No |
| Calculator | ✅ | No | No |
| Birthday Reminders | ✅ | Yes | No |
| Step Counter | ✅ | Yes | No |
| Currency Converter | ✅ | No | No (Static Rates) |
| Quote of the Day | ✅ | Yes | No |

## 🎨 Color Scheme

Das Dashboard verwendet ein konsistentes Farbschema:

- **Primary (Blue):** `#4facfe` - Weather, Tools, General
- **Success (Green):** `#10b981` - Tasks, Habits, Step Counter
- **Warning (Orange):** `#f59e0b` - Quotes
- **Purple:** `#a29bfe` - Calendar, Music
- **Pink:** `#ec4899` - Birthdays
- **Red:** `#ef4444` - Negative values, Delete actions

## 🔄 Auto-Refresh Intervals

- Weather: 10 Minuten
- Crypto Prices: 2 Minuten
- News: 30 Minuten
- Calendar & Tasks: 5 Minuten

## 📄 License

MIT License - Feel free to use this project for your personal dashboard!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Made with ❤️ using Nuxt UI

### Google Calendar Setup (OAuth 2.0)

The dashboard uses OAuth 2.0 for secure Google Calendar access to your private calendars.

#### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - APIs & Services → Library
   - Search for "Google Calendar API"
   - Click Enable
4. Create OAuth 2.0 credentials:
   - APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Personal Dashboard"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - Add your production URL if deploying
   - Click "Create"
5. Copy the **Client ID** (looks like: `xxxxxx.apps.googleusercontent.com`)

#### 2. Configure Environment Variables

Add your OAuth Client ID to `.env`:

```bash
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
NUXT_PUBLIC_GOOGLE_CALENDAR_ID=primary
```

#### 3. How It Works

- When you visit the Termine page, you'll see a "Mit Google anmelden" button
- Click it to authenticate with your Google account
- Grant **full calendar permissions** (needed for creating/editing/deleting events)
- Access the calendar manager with three main views:
  - **Übersicht**: View and manage all your events
  - **Statistiken**: See analytics about your calendar usage
  - **Erstellen**: Create new events or edit existing ones
- The access token is stored locally for convenience (expires after 1 hour)
- You can sign out using the "Abmelden" button

**Permissions Required:** `https://www.googleapis.com/auth/calendar` (full calendar access for create, read, update, and delete operations)

**Note:** This implementation uses OAuth 2.0 implicit flow, which is suitable for client-side applications. For production use with sensitive data, consider implementing a backend service with proper token management.

#### 4. Troubleshooting Common Issues

**"There was an error. Please try again later."**

This generic Google error usually means the OAuth configuration is incomplete:

1. **Check Authorized JavaScript Origins:**
   - Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   - Click on your OAuth Client ID
   - Under "Authorized JavaScript origins", make sure you have:
     - `http://localhost:3000` (for development)
     - Your production URL (if deploying)
   - Click "Save"
   - **Wait 1-2 minutes** for changes to propagate
   - Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

2. **Verify Client ID:**
   - Check your `.env` file
   - Client ID should end with `.apps.googleusercontent.com`
   - Make sure there are no extra spaces or quotes

3. **Confirm Google Calendar API is Enabled:**
   - Go to [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
   - Click "Enable" if not already enabled

4. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look in the Console tab for detailed error messages
   - The app logs diagnostic information on page load

**Other Issues:**

- **"Invalid Client ID"**: The Client ID in `.env` doesn't match Google Cloud Console
- **"Access Denied"**: User didn't grant calendar permissions - try signing in again
- **"Popup Closed"**: User closed the OAuth popup - click sign in again

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Features

- 🔐 PIN-based authentication (PIN: 2305)
- 🌤️ Real-time weather data from WeatherAPI.com
- 📊 Detailed weather page with:
  - 3-day forecast
  - Hourly predictions
  - Current conditions with multiple metrics
- 📅 Full Google Calendar management:
  - 📋 **Overview**: Today's appointments + 7-day calendar view
  - 📈 **Analytics**: Event statistics and time tracking
  - ➕ **Create**: Add new calendar events
  - ✏️ **Edit**: Modify existing events
  - 🗑️ **Delete**: Remove events with confirmation
  - 🔄 Automatic sync every 5 minutes
  - 🔒 OAuth 2.0 secure authentication
- 🎨 Modern dark theme design
- 🇩🇪 German language interface
- ⏰ Time-based greetings
- 🎯 Lucide icons throughout
