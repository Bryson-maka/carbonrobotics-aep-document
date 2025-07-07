# Carbon Robotics AEP Blueprint

Advanced Engineering & Performance Team Scope - Production Document Management System

## Overview

This is the production-ready document management system for the Carbon Robotics Advanced Engineering & Performance (AEP) team. It provides real-time collaborative editing, rich content support, and comprehensive administrative tools.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **UI Components**: Custom ShadCN/UI implementation
- **Rich Text**: TipTap editor
- **Charts**: Chart.js with react-chartjs-2
- **Deployment**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

## Key Features

- 📝 Rich text editing with TipTap
- 📊 Data visualization with Chart.js
- 🔄 Real-time collaboration
- 📱 Responsive design
- 🔐 Google OAuth (restricted to @carbonrobotics.com)
- 📋 JSON import/export for bulk content creation
- 🎯 Drag-and-drop reordering
- 📜 Version history with diff viewer
- 📄 PDF and Markdown export
- 👥 Role-based access control

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── types/           # TypeScript types
│   └── lib/             # Utilities and configs
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── public/              # Static assets
└── legacy/              # Archived prototype files
```

## Documentation

- [Production Deployment Plan](./PRODUCTION_DEPLOYMENT_PLAN.md)
- [Project Status](./PROJECT_STATUS.md)
- [Sprint 3 Demo Guide](./SPRINT3_DEMO.md)
- [JSON Import Guide](./JSON_IMPORT_GUIDE.md)
- [Claude Code Guide](./CLAUDE.md)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

This project is configured for automatic deployment to Vercel:

1. Push to `main` branch triggers automatic deployment
2. Pull requests get preview deployments
3. Environment variables must be set in Vercel dashboard

## Development

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Run development server with Turbopack
npm run dev
```

## Legacy Archive

The original HTML prototype has been archived in the `legacy/` directory for historical reference. The current Next.js application is the active production system.

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Run `npm run lint` and `npm run build` before committing
4. Create a pull request with a descriptive title
5. Wait for CI checks and code review

## License

Property of Carbon Robotics. All rights reserved.# Deployment trigger Mon Jul  7 15:31:42 PDT 2025
