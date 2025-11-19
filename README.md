<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-q8q0BtTZB5-C4v26DdkSRwPkzFerHy1

## Run Locally

**Prerequisites:**  Node.js 18+ (to support ES modules and optional chaining)

### Install dependencies

```bash
npm install
```

### Configure your API keys

Create an `.env.local` file in the project root with your Gemini API key.  This file is used by the Vite build and the voice chat features that still run client‑side.  The key will not be embedded in the built site when you use the backend to proxy chat requests.

```
GEMINI_API_KEY=your_api_key_here
# When developing locally, point the frontend at the backend.  When deployed on GitHub Pages the base URL should be the absolute URL of your deployed backend (e.g. https://rightcode-buddy-backend.vercel.app).
VITE_BACKEND_URL=http://localhost:3001
```

### Running the backend

This repository now includes a small Express server (`server.js`) that proxies chat requests to the Gemini API.  Running the backend locally allows you to keep your API key off the client and to test the application end‑to‑end.

1. Set the `GEMINI_API_KEY` environment variable in your shell.  You can also add it to a `.env` file and use a tool like [dotenv](https://www.npmjs.com/package/dotenv) when deploying, but environment variables are recommended for production.
2. Start the server:

```bash
npm run server
```

The backend listens on port `3001` by default.  You can change the port by setting the `PORT` environment variable.

### Running the frontend

Once the backend is running and your `.env.local` is configured, start the Vite dev server:

```bash
npm run dev
```

This will launch the app at `http://localhost:3000`.  All chat requests will be forwarded to `http://localhost:3001/api/chat` via the proxy defined in `ChatMode.tsx` using the `VITE_BACKEND_URL` environment variable.
