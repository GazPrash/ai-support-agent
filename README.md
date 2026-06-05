# AI Live Chat Agent

A Chat Support Agent that could be integrated or plugged into to any website for providing ai-assisted customer support, the project has two modes: `1. LLM Assisted` and `2. Passive Mode`, the latter servers as a fallback mode incase of an LLM absence or outage and can be configured with pre-written answers to guide the user in this situation.

The chat is scrollable, and supports the ability to switch between the past 10 conversations or start a new one if they prefer.

<img width="1408" height="767" alt="Screenshot 2026-06-05 at 8 49 05 AM" src="https://github.com/user-attachments/assets/4bd4d78d-8e4a-4cc4-a3b1-b35be8e4acd1" />


## Setup

First, install the dependencies for both the frontend and the backend:

```bash
# Install root (frontend) dependencies
npm install

# Install backend dependencies
npm --prefix backend install
```
## Editing Enviroment variables
First run
```bash
mv .env.example .env
```
this will setup your template `.env` file, and then assign env variables in the `.env` file.

1. assign your Open Ai API key via:
```.env
OPENAI_API_KEY=your_openai_api_key_here
```

2. choose the model of your liking via (gpt-4o-mini default)
```.env
OPENAI_MODEL=gpt-4o-mini
```

## Running the Development Servers

### Start Both Servers Automatically
You can start both servers simultaneously using the provided startup script:
```bash
./start.sh
```

### Start Servers Individually
If you prefer to start them manually from the root directory:

**1. Start the Backend Server** (on port `3001`):
```bash
npm run backend:dev
```

**2. Start the Frontend Server** (on `http://localhost:5173`):
```bash
npm run dev
```
