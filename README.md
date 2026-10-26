# TripMate

A full‑stack travel planning application built with **React** (Vite) on the frontend and **Express + MongoDB** on the backend. It supports user registration, JWT authentication, trip creation, itineraries, expenses, settlements and a catalog of travel destinations.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Seeding the Database](#seeding-the-database)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **User authentication** with JWT (register / login / logout)
- **Trip management** – create, edit, delete trips
- **Itinerary & activities** per day
- **Expense tracking** and automatic settlement calculations
- **Explore destinations** – a curated list of popular travel spots (seeded data)
- Responsive UI built with **Tailwind CSS** and **Lucide icons**
- **Error handling** with reusable `ErrorBanner` and `EmptyState` components

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Lucide‑React, Recharts |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs |
| Database | MongoDB |
| Dev Tools | ESLint, Prettier |

---

## Prerequisites
- **Node.js** (v20 or later) – https://nodejs.org/
- **npm** (comes with Node) or **yarn** if you prefer
- **MongoDB** running locally (default URI `mongodb://localhost:27017/tripmate`)
- **Git** – for version control

---

## Setup & Installation
```bash
# 1️⃣ Clone the repo (if you haven't already)
git clone <repo‑url> TripMate
cd TripMate

# 2️⃣ Install dependencies for both frontend and backend
# Frontend
npm install   # runs in the root; Vite scripts are defined here

# Backend (inside server folder)
cd server
npm install
cd ..
```

---

## Running the Application
### Development mode (frontend + backend)
```bash
# Terminal 1 – start the backend API
cd server
npm start   # server runs on http://localhost:5000

# Terminal 2 – start the Vite dev server (frontend)
cd ..
npm run dev   # opens http://localhost:5173
```
The Vite config proxies `/api/*` to `http://localhost:5000`, so the frontend talks to the backend seamlessly.

### Production build (optional)
```bash
# Build the frontend
npm run build   # outputs to ./dist

# Start the backend (it will serve static files if configured)
cd server
npm start
```

---

## Seeding the Database
A seed script populates the `destinations` collection with 10 travel destinations.
```bash
cd server
npm run seed
```
You should see a console log confirming the insertions.

---

## Environment Variables
Create a `.env` file inside the **server** directory (already provided in the repo) with the following keys:
```
MONGO_URI=mongodb://localhost:27017/tripmate
JWT_SECRET=your_secret_key_here
PORT=5000
```
The `.gitignore` file ensures that `.env` and any other secret files are **not** committed to version control.

---

## Project Structure
```
TripMate/
├─ server/                # Express backend
│  ├─ config/            # DB connection helper
│  ├─ models/            # Mongoose schemas
│  ├─ routes/            # API endpoints
│  ├─ middleware/        # Auth middleware
│  ├─ .env               # Environment variables (ignored)
│  └─ index.js           # Server entry point
├─ src/                   # React frontend source
│  ├─ components/        # Reusable UI components (Button, Card, …)
│  ├─ pages/             # Page‑level components (Dashboard, MyTrips, …)
│  ├─ lib/               # Helpers (api.js, formatCurrency.js)
│  └─ App.jsx            # Root component with routing
├─ .gitignore             # Git ignore rules (includes .env)
├─ README.md              # Project overview and setup instructions
└─ package.json           # Root scripts (dev, build, etc.)
```

---

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome‑feature`)
3. Make your changes and ensure lint passes (`npm run lint`)
4. Push and open a Pull Request

All contributions are welcome – just follow the existing code style and write clear commit messages.

---

## License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.
