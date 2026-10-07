# 🎨 SLATE — Collaborative Canvas with Real-Time Chat & Voice/Video

SLATE is an intelligent collaborative digital canvas built for high-performance visual teamwork. It combines real-time multi-user drawing and spatial collaboration with integrated **CometChat messaging**, **1:1 voice/video calling**, **lossless vector & image uploads**, **canvas element tagging**, **KaTeX mathematical formulas**, and **multi-format export**.

---

## 🚀 Key Features

- **🎨 Infinite Vector Canvas**: Powered by `tldraw` with support for shapes, freehand drawing, arrows, sticky notes, and custom assets.
- **⚡ Real-Time Multiplayer Sync**: Sub-millisecond CRDT synchronization and cursor presence powered by **Yjs** and WebSocket server.
- **💬 CometChat v7 Real-Time Chat**: Embedded workspace chat drawer supporting direct messages, channels, unread badges, and rich media.
- **📞 1:1 Voice & Video Calls**: Native CometChat calling integration with incoming call banners, accept/reject controls, and active call overlays.
- **🏷️ Spatial Element Tagging**: Tag shapes directly on the canvas (`@rectangle123`), focus/jump to tagged elements, and reference them effortlessly.
- **📐 Rich Text & Math Rendering**: Markdown text blocks with full **KaTeX LaTeX** mathematical notation rendering.
- **📤 High-Resolution Multi-Format Export**: Export canvas or selected shapes directly to **PNG** (with transparency), **SVG** (lossless vectors), **JPEG**, and **JSON** project snapshots with resolution scaling (1x, 2x, 3x).
- **🖼️ Full-Color SVG & Image Uploads**: Direct SVG and raster image placement with parsed viewBox dimensions and persistent Supabase cloud asset storage.
- **🔒 Authentication & Cloud Storage**: Secure email/password and OAuth session management backed by **Supabase Auth & Storage**.
- **🤖 AI Canvas Assistance**: FastAPI backend with Gemini integration via OpenRouter for contextual canvas operations.

---

## 🛠️ Tech Stack

### Frontend Client
- **Framework**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Canvas Engine**: [tldraw (v5)](https://tldraw.dev/)
- **Real-Time CRDT Sync**: [Yjs](https://yjs.dev/) & [`y-websocket`](https://github.com/yjs/y-websocket)
- **Chat & Calling**: [`@cometchat/chat-uikit-react` (v7)](https://www.cometchat.com/), `@cometchat/chat-sdk-javascript`, `@cometchat/calls-sdk-javascript`
- **Backend-as-a-Service**: [`@supabase/supabase-js`](https://supabase.com/) (Auth, Database, Storage)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Math & Markdown**: `katex`, `remark-math`, `rehype-katex`, `react-markdown`, `dompurify`

### Real-Time Collaboration Server
- **Runtime**: [Node.js](https://nodejs.org/)
- **Protocols**: WebSockets (`ws`), `y-websocket` binary CRDT synchronization protocol

### Backend API
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/)
- **AI / LLM**: OpenRouter API (`google/gemini-2.5-flash-lite`), OpenAI SDK
- **Data Validation**: Pydantic v2

### Cloud & Database
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies
- **Storage**: Supabase Storage (`canvas-assets` bucket)

---

## 📁 Repository Structure

```
SLATE/
├── frontend/               # React 19 + Vite + tldraw client
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/     # tldraw canvas wrapper, custom shapes, tagging UI
│   │   │   ├── chat/       # CometChat drawer, messages, active call overlays
│   │   │   └── ui/         # Left/Top/Right toolbars, Export menu, Modals
│   │   ├── hooks/          # useYjsStore and real-time state hooks
│   │   ├── lib/            # CometChat client, Supabase client, asset helpers
│   │   └── ...
│   ├── package.json
│   └── .env.example
│
├── collaboration-server/   # Node.js Yjs WebSocket room sync server
│   ├── server.js
│   └── package.json
│
├── backend/                # FastAPI AI and Auth server
│   ├── auth/               # Supabase auth token verification
│   ├── main.py             # AI canvas endpoint and server initialization
│   ├── requirements.txt
│   └── .env.example
│
├── supabase_schema.sql     # Database schema, RLS policies, and tables
└── README.md
```

---

## 📋 Prerequisites

Before setting up SLATE locally, ensure you have the following installed and configured:

1. **Node.js**: `v18.0.0` or higher (`v20+` recommended) — [Download Node.js](https://nodejs.org/)
2. **Python**: `3.10` or higher — [Download Python](https://www.python.org/)
3. **Supabase Account**: Free project on [supabase.com](https://supabase.com/)
4. **CometChat Account**: App on [cometchat.com](https://www.cometchat.com/)
5. *(Optional)* **OpenRouter API Key**: For AI canvas assistance features — [openrouter.ai](https://openrouter.ai/)

---

## ⚙️ Local Setup Guide

Follow these steps to get SLATE running locally from scratch.

### 1. Clone the Repository

```bash
git clone https://github.com/sanchay21/SLATE.git
cd SLATE
```

---

### 2. Setup Supabase (Database & Storage)

1. Go to your [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2. Open the **SQL Editor** in Supabase and run the contents of [`supabase_schema.sql`](supabase_schema.sql).
3. In **Storage**, create a public bucket named:
   - `canvas-assets` (enable **Public bucket** access).
4. In **Project Settings > API**, copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret)

---

### 3. Setup CometChat (Chat & Calling)

1. Go to your [CometChat Dashboard](https://app.cometchat.com/) and create a new app.
2. In **App Settings**, obtain your:
   - `App ID`
   - `Region` (e.g. `us`, `eu`, `in`)
   - `Auth Key` (under API & Auth Keys)
3. Ensure **Voice & Video Calling** is enabled in your CometChat app settings.

---

### 4. Start the Collaboration Server (`collaboration-server`)

The collaboration server syncs canvas strokes, shapes, and presence in real-time between connected users over WebSockets (default port `1234`).

```bash
cd collaboration-server
npm install
node server.js
```

*Output should indicate:* `Collaboration server running on port 1234`

---

### 5. Setup & Start the Backend API (`backend`)

Open a new terminal window:

```bash
cd backend

# Create and activate a Python virtual environment
# Windows:
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux:
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
```

Edit `backend/.env` with your credentials:
```env
PROJECT_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_or_anon_key
OPENROUTER_KEY=your_openrouter_api_key
```

Start the FastAPI server:
```bash
python main.py
```
*The backend will be available at:* `http://localhost:8000` (Docs at `http://localhost:8000/docs`)

---

### 6. Setup & Start the Frontend (`frontend`)

Open a third terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Edit `frontend/.env` with your credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# CometChat Configuration
VITE_COMETCHAT_APP_ID=your_cometchat_app_id
VITE_COMETCHAT_REGION=your_cometchat_region
VITE_COMETCHAT_AUTH_KEY=your_cometchat_auth_key
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables Reference

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anonymous API Key | `eyJhbGciOi...` |
| `VITE_COMETCHAT_APP_ID` | CometChat App ID | `1234567890abcdef` |
| `VITE_COMETCHAT_REGION` | CometChat Region code | `us`, `eu`, `in` |
| `VITE_COMETCHAT_AUTH_KEY` | CometChat Auth Key | `1234567890abcdef...` |

### Backend (`backend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PROJECT_URL` | Supabase Project URL | `https://xyzcompany.supabase.co` |
| `SUPABASE_KEY` | Supabase API Key (Service Role or Anon) | `eyJhbGciOi...` |
| `OPENROUTER_KEY` | OpenRouter API Key (for Gemini canvas AI) | `sk-or-v1-...` |

---

## 🎮 Canvas Shortcuts & Interaction Guide

| Action | Shortcut / Method | Description |
| :--- | :--- | :--- |
| **Select Tool** | `V` or `1` | Select and move shapes on canvas |
| **Hand (Pan)** | `H` or `Space + Drag` | Pan across the canvas |
| **Draw (Pen)** | `D` or `P` | Freehand drawing |
| **Eraser** | `E` | Delete clicked or dragged shapes |
| **Shapes** | `R` (Rect), `O` (Circle) | Quick shape placement |
| **Tag Shape** | `Right-click shape > Tag` | Assigns an interactive `@shapeName` tag |
| **Upload SVG / Image** | Toolbar icon or Right-click | Insert lossless vector SVGs or high-res images |
| **Export Canvas** | Top Header `Export` button | Download PNG (1x-3x), SVG, JPEG, or JSON snapshot |
| **Chat & Calls** | Top Header `Chat` button | Opens CometChat drawer for messages and 1:1 calls |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y` (`Cmd+Z` / `Cmd+Shift+Z`) | Standard history traversal |

---

## 🧪 Production Build Verification

To verify that the frontend builds without TypeScript or bundling errors:

```bash
cd frontend
npm run build
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
