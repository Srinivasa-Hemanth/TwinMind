# TwinMind

TwinMind is an intelligent web application that acts as your AI-powered meeting assistant and offline document query engine. Built with React and Vite, TwinMind offers a seamless chat interface combined with advanced call recording, real-time transcription, and automated Minutes of Meeting (MOM) generation.

## Features

- **Standard OpenAI Integration**: Seamlessly connects to standard OpenAI endpoints (e.g., GPT-4o-mini) to serve as the core AI engine.
- **Microphone Call Recording**: Engage in live calls and locally capture real-time audio transcriptions using the browser's native Web Speech API.
- **Automated AI Minutes of Meeting (MOM)**: When a call ends, TwinMind autonomously sends the transcript to the OpenAI engine and generates a formal, bulleted summary of key discussions, decisions, and action items before saving the log.
- **Local Project Knowledge Base Context**: TwinMind continuously indexes all task files, code documents, and past call transcripts located inside your `Projects` root folder. You can ask TwinMind questions about *anything* in those files, and it will answer accurately.
- **Text-to-Speech (TTS) Voice Emulation**: Ask TwinMind for a voice message or vocal answer, and it will automatically narrate its text response aloud.
- **Persistent Chat History**: All conversations with TwinMind are automatically archived into a structured JSON file and reloaded smoothly across browser sessions.
- **CORS-Free Backend Proxy**: TwinMind ships with a custom Vite middleware proxy (`/api/chat`) that routes OpenAI payloads cleanly through your local server, avoiding all browser CORS restrictions and API Key headers exposing blocks.

## Prerequisites

- **Node.js**: v18 or later.
- **OpenAI Account**: An active OpenAI API account with a funded billing balance and a valid API key (`sk-proj-...`).

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Rename `.env.example` to `.env` in the root internal directory, and supply your valid OpenAI API key. Ensure no quotes or trailing spaces exist around your key:
   ```env
   VITE_OPENAI_API_KEY="sk-proj-YOUR_API_KEY_HERE"
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The Vite proxy and React app will boot up. Follow the terminal link (e.g., `http://localhost:5173/`) to access TwinMind in your browser.

## File Structure & Workflows

### The `Projects` Root Directory
TwinMind relies heavily on a parallel local folder acting as the AI's "Brain":
- **`Projects/Chat History`**: TwinMind automatically saves complete transcripts of its text-based chats here.
- **`Projects/Calls Transcript`**: The automated call MoM summaries and live conversational transcripts are archived here upon call termination.
- **Custom Project PDFs / Code / Note files**: Add any text-readable files into `Projects`. TwinMind reads them dynamically and uses them to answer complex contextual questions.

### Security
Your API keys are never exposed raw on the frontend. The Vite server intercepts frontend fetches to `/api/chat` and binds your secured string from `.env` directly in standard Node `fetch` layers.

## Troubleshooting

- **`401 Unauthorized`**: You have an incorrectly formatted key in `.env` or the key was revoked.
- **`429 Too Many Requests (insufficient_quota)`**: Your OpenAI project account has zero prepaid balance. **Note**: OpenAI no longer offers free tiers for active API usage. You must load a minimum balance on the OpenAI billing dashboard to use TwinMind organically.

## License
MIT License
