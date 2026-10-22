# SalesFlow AI — AI Voice Sales Bot (Sankar Group Assignment)

> An autonomous, real-time AI voice sales executive powered by **OpenAI Realtime API (WebRTC)**, **Node.js/Express**, **Supabase PostgreSQL & Storage**, and a dark-themed **React + Vite** dashboard.

---

## 🚀 Live Demo & Repository Overview

- **Project:** Sankar Group — AI Voice Sales Bot
- **Product Sold:** **SalesFlow AI** (Configurable SaaS CRM & Lead Automation platform)
- **Voice Stack:** OpenAI Realtime API (`gpt-4o-realtime-preview-2024-12-17`) via browser-to-OpenAI direct **WebRTC**
- **Analysis Model:** OpenAI Structured Output (`gpt-4o-mini`)
- **Database & Storage:** Supabase PostgreSQL & Supabase Storage (with transparent local file/JSON fallback for immediate offline evaluation)
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, React Router

---

## 🏗️ Architecture

```
                                  ┌─────────────────────────────┐
                                  │   OpenAI Realtime WebRTC    │
                                  │   (Direct Audio + Events)   │
                                  └──────────────▲──────────────┘
                                                 │ WebRTC MediaStream
                                                 │ & oai-events channel
                                                 │
┌───────────────────────────┐     Ephemeral Token│       ┌───────────────────────────┐
│     Client (React + Vite) │◄───────────────────┼───────┤   Server (Node / Express) │
│                           │                    │       │                           │
│ - Live Voice Call (WebRTC)│  Create Call / End │       │ - POST /api/realtime/sess │
│ - Dual-Stream Recorder    ├────────────────────┼──────►│ - POST /api/calls         │
│ - Real-time Transcript    │                    │       │ - POST /api/calls/:id/fin │
│ - Dashboard & Metrics     │  Upload Audio / DB │       │ - POST /api/calls/:id/rec │
│ - Call Details & Player   ├────────────────────┼──────►│ - POST /api/calls/:id/ret │
└───────────────────────────┘                    │       └─────────────┬─────────────┘
                                                 │                     │
                                                 │                     ▼
                                                 │       ┌───────────────────────────┐
                                                 │       │    Supabase PostgreSQL    │
                                                 └───────┤  & Supabase Storage Bucket│
                                                         └───────────────────────────┘
```

### 1. WebRTC & Voice Connection Lifecycle
1. The user opens the **Live Voice Call** page and reviews the audio recording consent disclosure.
2. When the user clicks **Start Live Voice Conversation**, the client requests microphone permissions.
3. The client calls `POST /api/realtime/session` on the backend. The backend contacts OpenAI's `/v1/realtime/sessions` endpoint with the centralized SalesFlow AI prompt, voice configuration, and Whisper transcription options, returning a **short-lived ephemeral client secret (`ek_...`)**. *The permanent OpenAI key is never exposed to the browser.*
4. The browser establishes an `RTCPeerConnection`, adds the microphone track, and exchanges SDP Offer/Answer directly with `https://api.openai.com/v1/realtime`.
5. Spoken words are streamed over WebRTC; OpenAI returns synthesized voice audio and streams transcription events (`response.audio_transcript.delta`, `conversation.item.input_audio_transcription.completed`) over the `oai-events` data channel.
6. The user can naturally **interrupt the AI at any time** (full duplex audio).

### 2. Dual-Audio Recording Strategy
Browser MediaRecorder cannot natively capture both microphone input and incoming WebRTC remote audio simultaneously from a single stream. To satisfy the assignment's strict requirement that **both sides of the conversation are recorded**:
- The client uses the Web Audio API (`AudioContext`).
- Local microphone stream is fed into `audioCtx.createMediaStreamSource(micStream)`.
- The remote AI stream from `pc.ontrack` is fed into `audioCtx.createMediaStreamSource(remoteStream)`.
- Both sources are connected to a single `audioCtx.createMediaStreamDestination()`.
- The `MediaRecorder` records the mixed output stream.
- When the call ends, the combined audio is uploaded to `POST /api/calls/:id/recording` and stored in Supabase Storage.

---

## 📦 Directory Structure

```
ASSIGNMENT_BOT/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # StatusBadge, AudioPlayer, AudioVisualizer, Sidebar, Header
│   │   ├── hooks/              # useRealtimeCall.js (WebRTC, recorder, data channel)
│   │   ├── pages/              # Dashboard, LiveCall, CallHistory, CallDetails, Settings
│   │   ├── services/           # api.js
│   │   ├── utils/              # productConfig.js
│   │   ├── App.jsx             # Main Router & Layout
│   │   ├── main.jsx            # Entrypoint
│   │   └── index.css           # Tailwind & glowing visual styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Backend API Server
│   ├── src/
│   │   ├── routes/             # realtimeRoutes, callRoutes, analyticsRoutes, settingsRoutes
│   │   ├── services/           # db.js (Supabase + fallback), storage.js, realtimeSession.js, aiSummary.js
│   │   ├── utils/              # productConfig.js (Centralized SalesFlow AI specs & prompt)
│   │   ├── app.js              # Express app setup, CORS, JSON parsers
│   │   └── server.js           # Server listen & DB init
│   ├── data/                   # Local file JSON storage (fallback when Supabase credentials omitted)
│   ├── uploads/                # Local recording uploads (fallback storage)
│   └── package.json
├── supabase/
│   └── migrations/
│       └── 01_initial_schema.sql  # Calls table DDL, RLS policies, indexes
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ Local Quickstart

### Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **npm** v9+
- An **OpenAI API Key** with access to Realtime & Chat models (or test with the built-in heuristic fallback mode).

### Step 1: Clone and Install Dependencies

```bash
cd ASSIGNMENT_BOT

# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root (or inside `server/`):

```bash
cp .env.example .env
```

Populate the variables:
```env
# Required for Live Voice & AI Summaries
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-12-17
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_VOICE=alloy

# Supabase Credentials (Optional for local review; if omitted, the app uses local file persistence)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key
SUPABASE_STORAGE_BUCKET=call-recordings

# Server Configuration
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> **Note on Resilient Fallback:** If you do not have Supabase credentials right away, the server automatically boots into **Local Persistence Mode**, saving records to `server/data/calls.json` and recordings to `server/uploads/recordings/`. Nothing crashes, and all metrics, history, recordings, and transcripts remain fully functional.

### Step 3: Run the Backend & Frontend

Open two terminal tabs:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
# Starts backend on http://localhost:5001
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Starts Vite dev server on http://localhost:5173
```

Open **`http://localhost:5173`** in your browser.

---

## 🗄️ Supabase Cloud Database & Storage Setup

1. Create a new project in [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in the Supabase Dashboard.
3. Copy the contents of [`supabase/migrations/01_initial_schema.sql`](file:///Users/akshatchauhan/Desktop/ASSIGNMENT_BOT/supabase/migrations/01_initial_schema.sql) and run it. This creates:
   - The `calls` table with UUID primary key, timestamps, duration, transcript JSONB, summary, customer requirements, objections, next steps, and constraints for the 6 allowed sales statuses.
   - Indexes on `started_at`, `sales_status`, and `processing_status`.
   - Row Level Security (RLS) policies.
4. Go to **Storage** -> **New Bucket**:
   - Bucket name: `call-recordings`
   - Public bucket: **Enabled** (or set up authenticated signed URLs).
5. Retrieve your **Project URL** and **service_role secret key** from **Project Settings** -> **API** and add them to your `.env` file.

---

## 🏷️ Sales Status Classification Logic

Every call is evaluated upon completion into **strictly one** of the 6 allowed statuses:

| Status | Classification Criteria | Badge Color |
|---|---|---|
| **Converted** | Purchase or subscription explicitly confirmed by customer | Emerald |
| **Demo Requested** | Customer explicitly asks for or schedules a product demo / trial | Indigo |
| **Interested** | Customer engages positively with discovery questions but has not booked a demo | Blue |
| **Follow-up Required** | Customer requests to be called back later or asks for information via email | Amber |
| **Not Interested** | Customer clearly declines the offer or asks to be removed | Rose |
| **No Response** | No substantive conversation occurred or call hung up before speaking | Gray |

---

## 🌐 Production Deployment Guide

### Deploying the Backend to Render
1. Push your repository to GitHub.
2. In Render Dashboard, click **New +** -> **Web Service**.
3. Connect your repository and select the **`server`** directory as the Root Directory.
4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
5. Under **Environment Variables**, add:
   - `OPENAI_API_KEY`: Your OpenAI key
   - `OPENAI_REALTIME_MODEL`: `gpt-4o-realtime-preview-2024-12-17`
   - `OPENAI_SUMMARY_MODEL`: `gpt-4o-mini`
   - `OPENAI_VOICE`: `alloy`
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `SUPABASE_STORAGE_BUCKET`: `call-recordings`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your production Vercel frontend URL
6. Click **Deploy Web Service** and copy your backend URL (e.g. `https://salesflow-ai-server.onrender.com`).

### Deploying the Frontend to Vercel
1. In Vercel Dashboard, click **Add New** -> **Project**.
2. Select your repository and set the **Root Directory** to **`client`**.
3. Framework Preset: **Vite**.
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://salesflow-ai-server.onrender.com`).
5. Click **Deploy**.

---

## 🧪 Acceptance Criteria Checklist

- [x] **Website starts successfully** with responsive dark-themed dashboard.
- [x] **Genuine AI Voice Conversation:** Ephemeral WebRTC session minted on backend, direct full-duplex audio stream with OpenAI Realtime API.
- [x] **Natural Speech & Hearing:** Real microphone capture with noise suppression, echo cancellation, and real-time Whisper transcription.
- [x] **Multilingual Support:** English, Hindi, and natural Hinglish consultative conversation flow.
- [x] **Live Transcription Panel:** Turn-by-turn chat with customer and AI tags, timestamps, and non-intrusive auto-scrolling.
- [x] **Call Controls:** Start Call, End Call, live duration timer, and connection status indicators.
- [x] **Explicit Recording Consent:** Clear pre-call consent toggle and disclosure.
- [x] **Dual-Audio Recording:** Captures both user microphone audio and remote AI audio via Web Audio API mixer into a single playback file.
- [x] **Call Audio Playback:** Full-featured audio player with seek bar, duration, volume, and playback speed controls.
- [x] **AI Summary & Structured Sales Status:** Generates conversation summary, requirements, objections, next steps, and exactly one of 6 allowed statuses.
- [x] **Persistent Call History:** Search, filter by status, sort by newest/oldest, and open individual call detail pages.
- [x] **Transparent Local Fallback:** Runs immediately out-of-the-box even prior to cloud Supabase configuration.
- [x] **Production Ready:** Environment configuration guide, migration scripts, and Vercel/Render deployment documentation.
