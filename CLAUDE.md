# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **ChatKit Starter Template** - a Next.js application that integrates OpenAI's ChatKit web component with Agent Builder workflows. The app provides a chat interface powered by OpenAI-hosted workflows for building conversational AI experiences.

## Development Commands

### Setup and Running
```bash
npm install                 # Install dependencies
npm run dev                 # Start development server (http://localhost:3000)
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run ESLint
```

### Environment Configuration
Before running the app, copy `.env` to `.env.local` and configure:
- `OPENAI_API_KEY` - Must be from the same org/project as Agent Builder
- `NEXT_PUBLIC_CHATKIT_WORKFLOW_ID` - Workflow ID from Agent Builder (starts with `wf_...`)
- `NEXT_PUBLIC_CHATKIT_WORKFLOWS` (optional) - Comma-separated `Label:wf_xxx` pairs for workflow picker

**Important**: If `OPENAI_API_KEY` is already set in your terminal session, it will override the `.env.local` value. Unset it first:
- Unix/Mac: `unset OPENAI_API_KEY`
- Windows: `set OPENAI_API_KEY=`

## Architecture

### Key Components

**App Entry Point** (`app/App.tsx`)
- Main application component managing workflow selection and theme
- Orchestrates the ChatKitPanel and handles workflow switching
- Manages state for workflow ID and color scheme preferences

**ChatKit Integration** (`components/ChatKitPanel.tsx`)
- Core component that wraps the `<openai-chatkit>` web component
- Manages session initialization, error states, and script loading
- Handles client-side tool invocations (`switch_theme`, `record_fact`)
- Uses `useChatKit` hook from `@openai/chatkit-react` to configure:
  - Session creation via `/api/create-session` endpoint
  - Theme configuration and color schemes
  - Start screen prompts and composer settings
  - Event handlers for responses, errors, and thread changes
- Key features:
  - File upload support (enabled in session configuration)
  - Error overlay with retry functionality
  - Widget instance reset on workflow changes

**Session Management** (`app/api/create-session/route.ts`)
- Edge runtime API endpoint for creating ChatKit sessions
- Authenticates with OpenAI API using `OPENAI_API_KEY`
- Manages user sessions via HTTP-only cookies (`chatkit_session_id`, 30-day expiry)
- Generates unique user IDs (via `crypto.randomUUID()` or fallback)
- Proxies session creation requests to OpenAI ChatKit API
- Supports custom API base via `CHATKIT_API_BASE` env var
- Returns `client_secret` and `expires_after` to client

**Configuration** (`lib/config.ts`)
- Centralizes app configuration: workflow options, prompts, theme, placeholders
- Parses `NEXT_PUBLIC_CHATKIT_WORKFLOWS` into workflow picker options
- Exports `getThemeConfig()` for ChatKit theming based on color scheme
- Defines starter prompts shown on the chat start screen

**Color Scheme Hook** (`hooks/useColorScheme.ts`)
- Custom hook for managing light/dark/system theme preferences
- Uses `useSyncExternalStore` to sync with system color scheme changes
- Persists user preference to localStorage (`chatkit-color-scheme` key)
- Automatically applies theme to document root (`data-color-scheme`, `.dark` class, `style.colorScheme`)
- Supports cross-tab synchronization via storage events

### Data Flow

1. User selects workflow in `App.tsx` (or defaults to first in `WORKFLOW_OPTIONS`)
2. `ChatKitPanel` receives `workflowId` and initializes ChatKit via `useChatKit`
3. ChatKit script loads from OpenAI CDN (`chatkit.js`) via `layout.tsx`
4. When session needed, `getClientSecret` callback makes POST to `/api/create-session`
5. API route authenticates with OpenAI, creates session, returns `client_secret`
6. ChatKit establishes connection and renders chat interface
7. User interactions trigger client tool invocations (`onClientTool`) for theme switching or fact recording
8. Theme changes propagate through `useColorScheme` hook and update document

### File Structure
```
app/
  api/create-session/route.ts  # Session creation endpoint (edge runtime)
  App.tsx                       # Main app component with sidebar layout
  layout.tsx                    # Root layout with ChatKit script loader
  page.tsx                      # Root page (renders App component)
  globals.css                   # Global styles with shadcn theme variables
components/
  AppSidebar.tsx               # Sidebar with knowledge base navigation
  WelcomeScreen.tsx            # Welcome screen with action cards
  ChatKitPanel.tsx             # ChatKit wrapper with session management
  ErrorOverlay.tsx             # Error display component
  ui/                          # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── ...
hooks/
  useColorScheme.ts            # Theme management hook
lib/
  config.ts                    # App configuration and constants
  utils.ts                     # Utility functions (cn helper)
```

### Customization Points

**Starter Prompts** - Modify `STARTER_PROMPTS` in `lib/config.ts` to change initial chat suggestions

**Theme Customization** - Update `getThemeConfig()` in `lib/config.ts` for ChatKit styling. Use [chatkit.studio/playground](https://chatkit.studio/playground) to explore theme options

**Event Handlers** - Add analytics or storage integrations in `ChatKitPanel.tsx`:
- `onWidgetAction` - Handle fact saving actions
- `onResponseEnd` - Triggered when assistant response completes
- `onClientTool` - Handle custom client-side tool invocations

**Client Tools** - Extend `onClientTool` handler in `ChatKitPanel.tsx` to add custom tool support beyond `switch_theme` and `record_fact`

## Deployment Notes

Before deploying:
1. Run `npm run build` to verify production build
2. Add your deployment domain to the [Domain allowlist](https://platform.openai.com/settings/organization/security/domain-allowlist) on OpenAI dashboard
3. If using GPT-5 or verification-required models, verify your organization at [organization settings](https://platform.openai.com/settings/organization/general)

## UI Components

The application uses **shadcn/ui** for the interface:

**Sidebar** (`AppSidebar.tsx`):
- Knowledge base navigation buttons
- Theme toggle (light/dark mode)
- User profile footer with settings

**Welcome Screen** (`WelcomeScreen.tsx`):
- Displayed when no knowledge base is selected
- Action cards for quick access to common tasks
- Maps actions to knowledge bases

**Knowledge Base Switching**:
- Clicking a knowledge base in the sidebar changes the active workflow
- `ChatKitPanel` automatically detects workflow changes and resets the session
- New session is created via `/api/create-session` with the new workflow ID
- All backend session management is preserved and unchanged

## Technical Details

- **Framework**: Next.js 15.5 with App Router
- **Runtime**: React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS, shadcn/ui components
- **Icons**: lucide-react
- **ChatKit**: `@openai/chatkit-react` v1.1.1+
- **API**: Edge runtime for optimal performance
- **Type Safety**: Strict TypeScript with path aliases (`@/*`)

See `UI_IMPLEMENTATION.md` for detailed UI documentation.
