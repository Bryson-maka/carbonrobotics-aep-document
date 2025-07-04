# AEP Blueprint

Advanced Engineering & Performance Team Blueprint application built with Next.js 15, Supabase, and TipTap.

## Features

- **Sprint 1**: Read-only accordion view with sections and questions
- **Sprint 2**: Rich text answer editing with real-time progress tracking
- **Authentication**: Google OAuth restricted to @carbonrobotics.com domain
- **Real-time Updates**: Live collaboration with Supabase realtime subscriptions
- **Rich Text Editor**: TipTap editor with image support and formatting
- **Progress Tracking**: Real-time section and document-level progress indicators

## Prerequisites

- Node >= 20
- pnpm (`brew install pnpm`)
- Supabase CLI (`brew install supabase`)
- Access to Carbon Robotics Supabase project

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment variables**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://anyfhncbazmdixkzipyx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. **Database setup**
   Apply migrations to your Supabase project:
   ```bash
   supabase db push
   ```

4. **Seed data**
   Run the seed script to populate sections and questions:
   ```bash
   node -r ts-node/register scripts/seed.ts
   ```

5. **Configure OAuth**
   - In Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add your domain to allowed origins

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Architecture

### Database Schema
- `sections`: Question sections with ordering
- `questions`: Individual questions linked to sections
- `answers`: Rich text answers with draft/final status
- `answer_history`: Audit trail for all answer changes

### Key Components
- `AnswerEditor`: TipTap-based rich text editor
- `AnswerViewer`: Renders TipTap JSON content
- `QuestionCard`: Edit/view mode toggle for questions
- `SectionCard`: Accordion with real-time progress
- `GlobalProgressWidget`: Document-level progress tracking

### Real-time Features
- Live answer updates across browser sessions
- Real-time progress bar updates
- Optimistic UI updates for better UX

## Sprint Status

- ✅ **Sprint 1**: Bootstrap + read-only viewer + seeded data
- ✅ **Sprint 2**: Answer drafting & realtime progress
- 🔄 **Sprint 3**: CRUD admin pages + drag-and-drop ordering

## Testing Checklist

### Sprint 2 Features
- [ ] Log in as Editor and edit answers
- [ ] Mark answers as Draft/Final and verify persistence
- [ ] Open two browser windows and verify real-time updates
- [ ] Verify viewer accounts cannot edit
- [ ] Confirm progress bars show Draft=50%, Final=100%

## Deployment

The app is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy will happen automatically on push to main

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI components
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Editor**: TipTap with StarterKit + Image extensions
- **State**: React Query for server state management