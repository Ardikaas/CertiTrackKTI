# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CertiTrackKTI is a certification tracking web application with a monorepo structure:
- `public/` — React 19 frontend (Vite)
- `server/` — Express 5 backend (Node.js + MongoDB)

## Commands

### Frontend (`public/`)
```bash
cd public
npm install
npm run dev       # Start Vite dev server (default: http://localhost:5173)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`server/`)
```bash
cd server
npm install
node src/server.js                  # Run server
npx nodemon src/server.js           # Run with auto-reload (development)
```

Backend requires a `.env` file in `server/` with:
```
NODE_ENV=development
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
```

### Health check endpoints
- `GET /` — API welcome message
- `GET /api/v1/health` — API health status

## Architecture

### Backend structure (`server/src/`)
- `server.js` — Entry point: loads env, connects DB, starts HTTP server
- `app.js` — Express app setup: middleware stack, route mounting at `/api/v1`
- `config/db.js` — Mongoose connection
- `routes/index.js` — Root API router; add feature route files here
- `middlewares/error.js` — Global `notFound` and `errorHandler` middleware (handles Mongoose errors)
- `utils/AppError.js` — Operational error class with `statusCode` and `isOperational`
- `utils/catchAsync.js` — Wraps async route handlers to pass errors to `next()`

### Backend conventions
- CommonJS modules (`require`/`module.exports`)
- All async route handlers must be wrapped with `catchAsync`
- Throw `new AppError(message, statusCode)` for client-facing errors
- New feature routes: create `server/src/routes/<feature>Routes.js`, import in `routes/index.js`

### Frontend structure (`public/src/`)
- Currently the default Vite + React scaffold — ready for development
- ES modules (`import`/`export`)
