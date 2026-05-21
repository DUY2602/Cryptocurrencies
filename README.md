# CryptoDash

Vue 3 cryptocurrency dashboard — COS30043 Stage 1 foundation (Swinburne University).

## Tech stack

- Vue 3 + Vite
- Vue Router
- Bootstrap 5
- JavaScript (no TypeScript)

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Project structure

```
src/
├── assets/
├── components/     # Navbar, Footer, CoinCard, CoinTable, etc.
├── views/          # Home, Markets, News, About, Login, Register
├── router/
├── data/           # Local fake coins + news.json
├── services/       # api.js placeholder for Stage 2
├── App.vue
└── main.js
```

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/markets` | Markets |
| `/news` | News |
| `/about` | About |
| `/login` | Login |
| `/register` | Register |

## Stage 1 scope

This build includes routing, Bootstrap dark UI, reusable components, local placeholder data, search, and pagination. It does **not** include WebSockets, AI chatbot, real APIs, or backend authentication.
