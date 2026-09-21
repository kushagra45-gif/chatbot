# ChatGPT Clone Web Application (Groq LPU Powered)

A production-quality, responsive ChatGPT Clone web application built with **React (Vite)** and styled with a custom vanilla CSS design system. Powered by **Groq LPU Inference Engine** (featuring Qwen, Groq Compound, LLaMA, Mixtral) for ultra-fast response streaming (300-800 tokens/sec), voice input (Web Speech & Whisper), text-to-speech, vision image support, and full conversation persistence.

![ChatGPT Clone](public/favicon.svg)

---

## ✨ Features

- **⚡ Blazing Fast Streaming**: Real-time token streaming powered by Groq LPUs with an instant **Stop generating** button (`AbortController`).
- **🧠 Full Conversation Memory**: Automatically maintains dialogue context across turns for natural multi-turn conversations.
- **🎨 Authentic ChatGPT Design**: Sleek dark and light modes, typography powered by Google Fonts (Inter), smooth micro-interactions, responsive mobile drawer, and collapsible desktop sidebar.
- **📝 Rich Markdown & Code Highlighting**:
  - Headings, tables, lists, quotes, and links.
  - Multi-language code syntax highlighting (JavaScript, TypeScript, Python, CSS, JSON, Bash, SQL, Markdown) with language headers and a one-click **Copy code** button.
- **🛠️ Per-Message Actions**:
  - **Copy** message content to clipboard.
  - **Edit & Resend** user messages (truncates conversation and regenerates from that turn).
  - **Regenerate** assistant answers.
  - **Thumbs Up / Down** feedback toggles.
  - **Read Aloud** using the browser's Web Speech API SpeechSynthesis.
- **🎙️ Voice Input (Dictation)**: Built-in microphone button using the Web Speech API (`SpeechRecognition`) for hands-free queries.
- **🖼️ Vision & Multi-Modal Support**: Attach images (PNG, JPEG, WebP, GIF) directly from the input bar to analyze with Groq vision models (`llama-3.2-11b-vision-preview`).
- **💾 LocalStorage Persistence**: Conversations, titles, and settings survive page refreshes and browser restarts.
- **⚙️ Comprehensive Settings Modal**:
  - Model selection (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `llama-3.2-11b-vision-preview`).
  - Runtime API key configuration (with password mask toggle).
  - Temperature / creativity slider (0.0 to 1.5).
  - Custom system prompt editor with reset button.
  - Export chat history as formatted `.txt` transcript or structured `.json`.
  - Clear all chat history.
- **🛡️ Graceful Error Handling**: Detects missing keys, quota limits, and network drops with clear inline alerts and a **Retry** button.

---

## 🔑 How to Get a 100% Free Groq API Key

Groq provides completely free access to high-speed Llama 3 models without requiring a credit card:

1. **Visit Groq Console**: Go to [https://console.groq.com](https://console.groq.com).
2. **Sign Up / Log In**: Sign in with your Google or GitHub account.
3. **Navigate to API Keys**: Click on **API Keys** in the left sidebar menu (or visit [https://console.groq.com/keys](https://console.groq.com/keys)).
4. **Create Key**: Click the **"Create API Key"** button. Give it any name (e.g. `chatgpt-clone`) and click **Submit**.
5. **Copy Your Key**: Copy the key starting with `gsk_...` (it will only be shown once).
6. **Use in App**:
   - **Option A (Quickest)**: Click the **Settings (Gear icon)** in the top-right of the web app, paste your key into the **Groq API Key** input, and click **Save Preferences**.
   - **Option B (.env file)**: Paste the key in your `.env` file:
     ```env
     VITE_API_KEY=gsk_your_actual_key_here
     ```

---

## 🔒 Security & Production Note

> [!WARNING]
> In frontend-only Single Page Applications (SPAs), any API key loaded in the browser environment (via `.env` or user input) can be viewed by inspecting network requests.
> **For production deployments**, we strongly recommend routing requests through a lightweight backend proxy (e.g., Next.js API route, Cloudflare Worker, Express server, or Supabase Edge Function) where your API key is kept secure on the server.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm or yarn
- A free Groq API key from [Groq Console](https://console.groq.com/keys)

### 2. Installation
```bash
# Clone or navigate to the project directory
git clone https://github.com/kushagra45-gif/chatgpt-clone.git
cd chatgpt-clone

# Install dependencies
npm install
```

### 3. Configure API Key
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```
Open `.env` and insert your Groq API key:
```env
VITE_API_KEY=gsk_your_key_here
VITE_GROQ_MODEL=qwen/qwen3.8-27b
```

*(Note: You can also enter or switch your API key at runtime directly in the app's **Settings Modal**).*

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
chatgpt-clone/
├── .env.example             # Example environment variables
├── index.html               # Main HTML entry with SEO metadata and Google Fonts
├── package.json             # Scripts and dependencies
├── vite.config.js           # Vite configuration
├── README.md                # Documentation
└── src/
    ├── main.jsx             # React entry point with Theme and Chat providers
    ├── App.jsx              # Main layout, responsive drawers, and shortcuts
    ├── index.css            # Design tokens, dark/light themes, markdown styling
    ├── context/
    │   ├── ChatContext.jsx  # Chat state, streaming dispatch, and persistence
    │   └── ThemeContext.jsx # Dark/Light theme toggle & system sync
    ├── services/
    │   └── llm.js           # Groq API streaming service
    ├── hooks/
    │   ├── useAutoScroll.js # Smart chat scroll & jump-to-bottom
    │   ├── useLocalStorage.js # Resilient localStorage state hook
    │   ├── useSpeechRecognition.js # Speech-to-text dictation
    │   └── useSpeechSynthesis.js   # Text-to-speech reader
    ├── utils/
    │   ├── exportChat.js    # .txt and .json chat export utilities
    │   └── formatters.js    # Date grouping, timestamps, chat auto-titles
    └── components/
        ├── Common/
        │   ├── Header.jsx      # Top bar with model badge, sidebar toggle, theme
        │   └── ErrorBanner.jsx # Inline error banner with Retry & Settings action
        ├── Sidebar/
        │   ├── Sidebar.jsx     # Past chats, search, new chat, footer profile
        │   ├── ChatListItem.jsx # Chat item with inline rename & delete
        │   └── Sidebar.css
        ├── Chat/
        │   ├── ChatArea.jsx    # Primary message viewport
        │   ├── WelcomeScreen.jsx # 4 prompt suggestion cards for empty state
        │   ├── MessageList.jsx # Virtualized/ordered message list
        │   ├── MessageItem.jsx # Message bubble, avatar, actions, TTS, user edit
        │   ├── CodeBlock.jsx   # PrismJS syntax highlighting + copy button
        │   ├── TypingIndicator.jsx # Animated waiting indicator
        │   ├── ScrollToBottom.jsx  # Floating scroll-to-bottom button
        │   └── Chat.css
        ├── Input/
        │   ├── ChatInput.jsx   # Auto-resizing textarea, mic, vision, send/stop
        │   └── ChatInput.css
        └── Modals/
            ├── SettingsModal.jsx # Model, temperature, prompt, key, export, clear
            └── Modals.css
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Enter` | Send message |
| `Shift + Enter` | New line in input |
| `⌘ + K` or `Ctrl + K` | Start a new chat |
| `⌘ + /` or `Ctrl + /` | Toggle sidebar collapse |
| `Escape` | Close Settings modal / close mobile drawer |

---

## 🌐 Deploying

### Vercel
1. Push this repository to GitHub/GitLab.
2. Import the repo in [Vercel](https://vercel.com).
3. Under **Environment Variables**, set:
   - `VITE_API_KEY`: Your Groq API key
   - `VITE_GROQ_MODEL`: `llama-3.3-70b-versatile`
4. Deploy!

### Netlify
1. Connect your repository in [Netlify](https://netlify.com).
2. Set Build command to `npm run build` and Publish directory to `dist`.
3. Add `VITE_API_KEY` to **Site configuration > Environment variables**.
4. Deploy!
