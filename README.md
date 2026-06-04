# AI Live Chat Agent

This project contains both the frontend (React + Vite) and the backend (Express + TypeScript) services.

## Setup

First, install the dependencies for both the frontend and the backend:

```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
npm --prefix backend install
```

## Running the Development Servers

### Start Both Servers Automatically
You can start both servers simultaneously using the provided startup script:
```bash
./start.sh
```

### Start Servers Individually
If you prefer to start them manually from the root directory:

**1. Start the Backend Server** (usually on port `3001`):
```bash
npm run backend:dev
```

**2. Start the Frontend Server** (usually on `http://localhost:5173`):
```bash
npm run dev
```
