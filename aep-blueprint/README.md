# AEP Blueprint

Advanced Engineering & Performance Team Blueprint application built with Next.js 15, Supabase, and TipTap.

## Features

### Sprint 1: Core Foundation
- Read-only accordion view with sections and questions
- Google OAuth restricted to @carbonrobotics.com domain
- Responsive design with Tailwind CSS

### Sprint 2: Interactive Editing
- Rich text answer editing with TipTap editor
- Real-time collaboration and progress tracking
- Draft/Final status management
- Image upload with Supabase Storage

### Sprint 3: Admin Management
- Admin CRUD pages for sections and questions
- Drag & drop ordering with @dnd-kit
- History diff modal with Monaco editor
- Export functionality (PDF/Markdown)
- CI/CD enhancements

## Prerequisites

- Node.js >= 20
- npm (comes with Node.js)
- Supabase CLI (`brew install supabase`)
- Access to Carbon Robotics Supabase project

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
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

4. **Start development**
   ```bash
   npm run dev
   ```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code

# Database
supabase db push     # Apply migrations
supabase functions deploy export_prd  # Deploy export function
```

## Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── admin/          # Admin management pages
│   │   ├── login/          # Authentication pages
│   │   └── page.tsx        # Main application
│   ├── components/         # React components
│   │   ├── admin/          # Admin-specific components
│   │   ├── editor/         # TipTap editor components
│   │   └── ui/             # ShadCN UI components
│   └── hooks/              # Custom React hooks
├── supabase/
│   ├── migrations/         # Database schema changes
│   └── functions/          # Edge functions
├── .github/workflows/      # CI/CD configuration
└── docs/                   # Documentation
```

## Authentication & Roles

- **Viewer**: Read-only access to all content
- **Editor**: Can edit answers and mark as draft/final
- **Admin**: Full CRUD access, drag & drop, export functionality

## Database Schema

### Core Tables
- `sections`: Question sections with ordering
- `questions`: Individual questions linked to sections
- `answers`: Rich text answers with draft/final status
- `answer_history`: Complete audit trail

### Views
- `section_progress`: Real-time progress calculations
- `document_progress`: Overall completion tracking

## Key Features

### Real-time Collaboration
- Live answer updates across sessions
- Optimistic UI updates
- Automatic conflict resolution

### Rich Text Editing
- TipTap editor with extensions
- Image upload to Supabase Storage
- Draft/Final status workflow

### Admin Management
- Drag & drop ordering for sections/questions
- History comparison with Monaco diff editor
- Bulk operations and batch updates

### Export System
- Markdown and PDF export
- Role-based access control
- Edge function implementation

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Tailwind CSS for styling
- ShadCN UI for components

### State Management
- React Query for server state
- Optimistic updates for better UX
- Real-time subscriptions with Supabase

### Security
- Row Level Security (RLS) policies
- JWT-based role enforcement
- Input validation with Zod schemas

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables
3. Deploy automatically on push

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy Edge functions: `supabase functions deploy`
3. Apply database migrations: `supabase db push`

## Sprint Status

- ✅ **Sprint 1**: Bootstrap + read-only viewer + seeded data
- ✅ **Sprint 2**: Answer drafting & realtime progress
- ✅ **Sprint 3**: Admin CRUD + drag & drop + export

## Testing

### Manual Testing Checklist
- [ ] Authentication with @carbonrobotics.com emails
- [ ] Real-time collaboration between browser sessions
- [ ] Drag & drop ordering in admin interface
- [ ] History diff modal functionality
- [ ] Export to Markdown/PDF
- [ ] Mobile responsiveness

### Test Users
- **Viewer**: Any @carbonrobotics.com email
- **Editor**: Set `role: "editor"` in user metadata
- **Admin**: Set `role: "admin"` in user metadata

## Support

For issues or questions:
1. Check the [Sprint 3 Demo Guide](./SPRINT3_DEMO.md)
2. Review Supabase logs for backend issues
3. Use browser dev tools for frontend debugging

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Editor**: TipTap with Monaco diff viewer
- **DnD**: @dnd-kit for drag and drop
- **State**: React Query + optimistic updates
- **CI/CD**: GitHub Actions