# AGENTS.md

## Project Overview
Monorepo for OCTAVE WhatsApp bot: Baileys worker (Node.js) bridges WhatsApp ↔ FastAPI backend (Python) for conversation logic. Website (VitePress) serves as marketing entry point.

## Tech Stack & Key Paths

- **baileys-worker/** - Node.js 18+ CommonJS, Baileys WhatsApp library, Express HTTP server
  - Entry: `bot.js` (main worker), `init.js` (QR pairing)
  - Scripts: `npm run init`, `npm start`, `npm run clean`
  - Env: `.env` with `FASTAPI_URL`, `PORT`, `WHATSAPP_PHONE_NUMBER`

- **backend/** - Python FastAPI (placeholder - no source files yet)
  - Structure: `app/` with `routers/`, `schemas/`, `templates/`
  - TODO: verify if backend is intentionally empty or files missing

- **Root** - Documentation: `README.md`, `TUTO.md`, `.env.example` (monorepo env overview)

## Setup & Commands

- **Baileys worker first-time setup**: `cd baileys-worker && npm install && npm run init` (scan QR code)
- **Start worker**: `cd baileys-worker && npm start`
- **Reset credentials**: `cd baileys-worker && npm run clean` then re-run init

## Code Style

- **baileys-worker**: CommonJS (require/module.exports), French comments, console.log with emojis for logs
- **Environment**: Use `.env.example` as template, never commit `.env` files
- **Monorepo**: Each service has own `.env.example` at service root

## Working Principles

### 1. Think Before Coding
- Backend appears empty per discovery - verify with user before implementing
- README describes full backend structure but no `.py` files exist - clarify intent
- Octave website mentioned in README but absent from root - confirm if planned

### 2. Simplicity First
- Baileys worker is MVP: simple Express server + Baileys socket, no abstractions
- No error handling for impossible scenarios in bot.js/init.js
- Keep worker scripts under 200 lines each

### 3. Surgical Changes
- When editing bot.js/init.js: preserve French comments, emoji logging style
- Don't touch auth_info_baileys/ contents - credentials managed by init script
- Match existing CommonJS patterns (no ESM conversion without explicit request)

### 4. Goal-Driven Execution
- For WhatsApp session issues: follow README troubleshooting (clean → init → start)
- For backend integration: verify FASTAPI_URL in .env matches backend port
- Test end-to-end: send WhatsApp message, check worker logs, verify backend receives

## Meta — Keep This File Alive

After corrections or clarifications:
- If backend structure is clarified → update Tech Stack & Key Paths
- If octave_website is added → add to monorepo structure
- If new services added → document their setup commands
- If code style conventions change → update Code Style section
- Never auto-update without explicit user confirmation
- If this file exceeds 150 lines, condense before adding new rules
