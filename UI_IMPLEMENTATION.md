# UI Implementation Guide

## Overview

The UI has been redesigned using **shadcn/ui** components to match the Ausimmi AI design reference. The new interface features:

- **Sidebar Navigation**: Knowledge base selection with theme toggle
- **Welcome Screen**: Action cards for quick access to common tasks
- **Chat Interface**: Integrated ChatKit panel for conversations
- **Session Management**: Automatic workflow switching based on knowledge base selection

## Architecture

### Component Structure

```
app/
  App.tsx                    # Main app with sidebar + content layout

components/
  AppSidebar.tsx            # Sidebar with knowledge base navigation
  WelcomeScreen.tsx         # Welcome screen with action cards
  ChatKitPanel.tsx          # ChatKit integration (unchanged)
  ErrorOverlay.tsx          # Error display (unchanged)
  ui/                       # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── avatar.tsx
    ├── badge.tsx
    └── ...

lib/
  config.ts                 # Configuration with new constants
```

### New Configuration

**lib/config.ts** now includes:

```typescript
// Knowledge base options for sidebar
KNOWLEDGE_BASES = [
  { id: "new", label: "New Conversation", icon: "plus" },
  { id: "policy", label: "Policy Text Assessment", icon: "file-text" },
  { id: "visa", label: "Student Visa Requirements", icon: "user-check" },
  { id: "points", label: "Proving Higher Points", icon: "trending-up" },
  { id: "registry", label: "Consumer Registry", icon: "database" },
]

// Action cards for welcome screen
ACTION_CARDS = [
  { id: "research", label: "Research Using eCas Law", ... },
  { id: "review", label: "Review Case Law", ... },
  { id: "assess", label: "Assess Visa Eligibility", ... },
  { id: "consult", label: "General Consultation", ... },
]
```

## Workflow & Session Management

### How It Works

1. **Knowledge Base Selection**: User clicks a knowledge base in the sidebar
2. **Workflow Mapping**: The app maps the knowledge base ID to a workflow
3. **Session Reset**: `ChatKitPanel` detects the workflow change and resets the session
4. **New Session**: A new session is created via `/api/create-session` with the new workflow ID
5. **Chat Ready**: User can now chat with the selected knowledge base

### Backend Integration (Preserved)

All backend logic remains **unchanged**:

- **Session Creation**: `app/api/create-session/route.ts` - Edge runtime API
- **Cookie Management**: User sessions tracked via `chatkit_session_id` cookie
- **ChatKit Integration**: `ChatKitPanel.tsx` handles session lifecycle
- **Workflow Switching**: Automatic session reset on workflow change (lines 164-169 in ChatKitPanel.tsx)

### Configuring Multiple Workflows

To enable different workflows for different knowledge bases:

**.env.local**:
```bash
# Configure multiple workflows
NEXT_PUBLIC_CHATKIT_WORKFLOWS="Policy:wf_policy123,Visa:wf_visa456,Points:wf_points789,Registry:wf_registry012"
```

**App.tsx** mapping logic (lines 36-48):
```typescript
const matchedWorkflow = WORKFLOW_OPTIONS.find(
  (w) => w.id.toLowerCase().includes(id.toLowerCase())
);
```

This matches knowledge base IDs to workflow names. For example:
- "policy" knowledge base → "Policy:wf_policy123" workflow
- "visa" knowledge base → "Visa:wf_visa456" workflow

## UI Features

### Sidebar (AppSidebar.tsx)

- **Header**: Brand logo, app name, theme toggle
- **Navigation**: Knowledge base buttons with icons
- **New Conversation**: Primary button to reset chat
- **Footer**: User avatar and settings button

### Welcome Screen (WelcomeScreen.tsx)

- **Welcome Message**: "Welcome to Ausimmi AI"
- **Action Cards**: 4 cards with icons, titles, and descriptions
- **Click Actions**: Each card maps to a knowledge base
- **Responsive**: Grid layout adapts to screen size

### Theme Support

- **Light/Dark Mode**: Toggle in sidebar header
- **System Preference**: Respects OS theme setting
- **Persistent**: Theme saved to localStorage
- **Smooth Transitions**: CSS variables for consistent theming

## Customization

### Adding Knowledge Bases

**lib/config.ts**:
```typescript
export const KNOWLEDGE_BASES = [
  // Add new entry
  { id: "custom", label: "Custom KB", icon: "star" },
]
```

### Adding Action Cards

**lib/config.ts**:
```typescript
export const ACTION_CARDS = [
  // Add new card
  {
    id: "custom",
    label: "Custom Action",
    description: "Description here",
    icon: "star",
  },
]
```

**WelcomeScreen.tsx**: Update `iconMap` if using new icons

### Styling

All components use **Tailwind CSS** with shadcn theme variables:

- **Colors**: Defined in `app/globals.css`
- **Spacing**: Tailwind utility classes
- **Dark Mode**: `.dark` variant classes
- **Responsive**: Mobile-first breakpoints

## Development

### Running the App

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

### Testing Workflow Switching

1. Start the app: `npm run dev`
2. Click different knowledge bases in the sidebar
3. Watch the console for session creation logs
4. Verify new sessions are created for each workflow

### Debugging

Enable development logs by setting:
```typescript
if (process.env.NODE_ENV !== "production") {
  console.info("[ChatKitPanel] getClientSecret invoked", ...);
}
```

## Migration Notes

### What Changed

✅ **Added**:
- AppSidebar component
- WelcomeScreen component
- Knowledge base configuration
- Action card configuration
- shadcn/ui components

✅ **Modified**:
- App.tsx - New layout with sidebar
- lib/config.ts - Added constants
- globals.css - shadcn theme variables

❌ **Unchanged** (Backend):
- app/api/create-session/route.ts
- ChatKitPanel.tsx (except imports)
- hooks/useColorScheme.ts
- Session management logic
- Cookie handling
- Workflow switching mechanism

### Breaking Changes

None. The app is backward compatible with existing workflows.

## Future Enhancements

- [ ] User profile settings
- [ ] Conversation history in sidebar
- [ ] Knowledge base icons customization
- [ ] Action card filtering/search
- [ ] Mobile responsive sidebar drawer
- [ ] Keyboard shortcuts
- [ ] Multi-language support
