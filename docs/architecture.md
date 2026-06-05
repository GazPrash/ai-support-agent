# Frontend Structure

The frontend has been simplified into a small number of folders:

- `src/chat`
  - Conversation models
  - Browser storage wrapper
  - Conversation service
  - React hook for the chat flow
- `src/components`
  - Reusable UI pieces for the page
- `src/App.tsx`, `src/main.tsx`, `src/styles.css`
  - App composition, entrypoint, and styling

## Why this is simpler

- The conversation logic lives in one place instead of being split across many architectural folders.
- The UI components are grouped together plainly.
- Public classes and exported functions now have short docstrings explaining what they do.

## Persistence shape

The frontend still stores the same future-ready data:

- `conversations`
  - `id`
  - `createdAt`
  - `metadata`
- `messages`
  - `id`
  - `conversationId`
  - `sender`
  - `text`
  - `timestamp`

On reload, the app restores the active `conversationId` and reloads its message history.
