# CLAUDE.md - Carbon Robotics AEP Blueprint Project Guide

## 🏗️ Architecture Overview

This is the Carbon Robotics Advanced Engineering & Performance (AEP) Blueprint system - a sophisticated document management platform with real-time collaboration, built for engineering excellence.

### Core Architecture Principles
- **Modern Next.js 15 App Router** - Server components by default, client components only when necessary
- **TypeScript Strict Mode** - Type safety throughout the codebase
- **Supabase Backend** - PostgreSQL with RLS, real-time subscriptions, and edge functions
- **Component-Based Design** - Reusable UI components following atomic design principles
- **Optimistic UI Updates** - Using React Query for seamless user experience

## 🚀 Development Environment Setup

### Prerequisites
- Node.js 20+ (check with `node --version`)
- npm 10+ (comes with Node.js)
- Git configured with your GitHub account
- Supabase CLI (optional for local development)

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/[your-org]/carbonrobotics-exploration.git
cd carbonrobotics-exploration/aep-blueprint

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Commands
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Run production server locally
npm run start

# Run linting (ALWAYS run before committing)
npm run lint

# Type checking (run alongside lint)
npx tsc --noEmit
```

## 📁 Project Structure

```
aep-blueprint/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Dashboard/main page
│   │   ├── admin/             # Admin interface
│   │   └── api/               # API routes (if needed)
│   ├── components/            
│   │   ├── ui/                # Base UI components (ShadCN)
│   │   ├── AdminPanel.tsx     # Admin management interface
│   │   ├── AnswerEditor.tsx   # TipTap rich text editor
│   │   ├── ChartDisplay.tsx   # Chart.js visualizations
│   │   ├── Dashboard.tsx      # Main application interface
│   │   └── ExportButton.tsx   # PDF/Markdown export
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAnswers.ts      # Answer CRUD operations
│   │   ├── useQuestions.ts    # Question management
│   │   └── useRealtimeSync.ts # Real-time subscriptions
│   ├── services/              # API service layer
│   │   ├── answers.ts         # Answer API calls
│   │   ├── questions.ts       # Question API calls
│   │   └── export.ts          # Export functionality
│   ├── types/                 # TypeScript type definitions
│   │   └── database.ts        # Supabase generated types
│   └── lib/                   # Utilities and configs
│       ├── supabase/          # Supabase client setup
│       └── utils.ts           # Helper functions
├── supabase/
│   ├── migrations/            # Database migrations
│   └── functions/             # Edge functions
├── public/                    # Static assets
└── [config files]             # Various configuration files
```

## 🗄️ Supabase Configuration

### Database Schema Overview
```sql
-- Core tables with RLS enabled
sections (id, title, description, order_index)
questions (id, section_id, text, order_index, metadata)
answers (id, question_id, content, status, created_by)
answer_history (id, answer_id, content, changed_by)

-- Views for analytics
v_question_progress
v_section_completion
```

### Row Level Security (RLS) Best Practices
1. **Always enable RLS** on all tables
2. **Use service role key** only in server-side code
3. **Implement proper policies** for each role (viewer, editor, admin)
4. **Test policies** thoroughly in Supabase dashboard

### Supabase CLI Commands
```bash
# Link to project
npx supabase link --project-ref your-project-ref

# Generate types
npx supabase gen types typescript --local > src/types/database.ts

# Run migrations locally
npx supabase db push

# Create new migration
npx supabase migration new migration_name
```

## 🚢 Vercel Deployment

### Deployment Process
1. **Automatic Deployments** - Push to main branch triggers deployment
2. **Preview Deployments** - Every PR gets a preview URL
3. **Environment Variables** - Set in Vercel dashboard, not in code

### Vercel Configuration
```bash
# Build settings (auto-detected)
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install

# Environment Variables (set in dashboard)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Production Deployment Checklist
- [ ] Run `npm run lint` and fix all issues
- [ ] Run `npm run build` locally to catch errors
- [ ] Test all critical user flows
- [ ] Verify environment variables are set
- [ ] Check Supabase connection and RLS policies
- [ ] Review and merge PR to main branch

## 🔄 GitHub Workflow

### Branch Strategy
```bash
main                 # Production branch
├── feature/xxx      # New features
├── fix/xxx          # Bug fixes
└── chore/xxx        # Maintenance tasks
```

### PR Process
1. **Create feature branch** from main
2. **Make changes** following coding standards
3. **Run checks** locally: `npm run lint && npm run build`
4. **Create PR** with descriptive title and description
5. **Wait for CI** - GitHub Actions will validate
6. **Address feedback** from code review
7. **Merge** when approved and CI passes

### Commit Message Format
```
type(scope): description

feat(dashboard): add bulk question import
fix(auth): resolve Google OAuth domain restriction
chore(deps): update Next.js to 15.3.5
docs(readme): update deployment instructions
```

## 🏛️ Architectural Patterns

### Component Patterns
```typescript
// Server Component (default)
export default async function ServerComponent() {
  const data = await fetchData(); // Direct data fetching
  return <div>{data}</div>;
}

// Client Component (when needed)
'use client';
export default function ClientComponent() {
  const [state, setState] = useState();
  return <div onClick={() => setState('new')}>{state}</div>;
}
```

### Data Fetching Pattern
```typescript
// Use custom hooks with React Query
const { data, isLoading, error } = useAnswers(questionId);

// Optimistic updates
const mutation = useMutation({
  mutationFn: updateAnswer,
  onMutate: async (newData) => {
    // Optimistically update UI
    await queryClient.cancelQueries(['answers']);
    const previous = queryClient.getQueryData(['answers']);
    queryClient.setQueryData(['answers'], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['answers'], context.previous);
  },
});
```

### Error Handling Pattern
```typescript
// Consistent error handling
try {
  const result = await riskyOperation();
  return { data: result, error: null };
} catch (error) {
  console.error('Operation failed:', error);
  return { data: null, error: error.message };
}
```

## 📋 Code Style Guidelines

### TypeScript Best Practices
1. **Use strict mode** - Already configured in tsconfig.json
2. **Define interfaces** for all data structures
3. **Avoid `any`** - Use proper types or `unknown`
4. **Export types** separately from implementations

### React Best Practices
1. **Prefer function components** with hooks
2. **Use server components** by default
3. **Memoize expensive computations** with useMemo
4. **Handle loading states** explicitly
5. **Implement error boundaries** for critical sections

### Styling Guidelines
1. **Use Tailwind CSS** for all styling
2. **Follow mobile-first** responsive design
3. **Use CSS variables** for theming
4. **Avoid inline styles** except for dynamic values

### File Naming Conventions
```
components/DashboardSection.tsx  # PascalCase for components
hooks/useRealtimeSync.ts        # camelCase with 'use' prefix
services/answers.ts             # camelCase for modules
types/database.ts               # camelCase for type files
```

## 🧪 Testing & Quality Assurance

### Pre-commit Checklist
```bash
# 1. Lint your code
npm run lint

# 2. Type check
npx tsc --noEmit

# 3. Build successfully
npm run build

# 4. Test critical flows manually
# - User authentication
# - Answer creation/editing
# - Real-time sync
# - Export functionality
```

### Manual Testing Guide
Reference `SPRINT3_DEMO.md` for comprehensive testing scenarios:
- Authentication flows
- Content management
- Real-time collaboration
- Export functionality
- Admin operations

## 🔧 Common Issues & Solutions

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues
1. Verify environment variables are set correctly
2. Check Supabase project is not paused
3. Confirm RLS policies allow access
4. Test connection in Supabase dashboard

### TypeScript Errors
```bash
# Regenerate Supabase types
npx supabase gen types typescript --local > src/types/database.ts

# Check for missing dependencies
npm ls [package-name]
```

### Vercel Deployment Failures
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure no hardcoded secrets in code
4. Test build locally first

## 🎯 Performance Optimization

### Key Optimizations
1. **Use React Query** for server state caching
2. **Implement virtual scrolling** for long lists
3. **Lazy load** heavy components (charts, editors)
4. **Optimize images** with Next.js Image component
5. **Enable Turbopack** in development (`--turbopack`)

### Database Optimizations
1. **Use indexes** on frequently queried columns
2. **Implement pagination** for large datasets
3. **Use database views** for complex queries
4. **Enable connection pooling** in Supabase

## 🔒 Security Best Practices

### Authentication & Authorization
1. **Domain restriction** - Google OAuth limited to @carbonrobotics.com
2. **Role-based access** - viewer, editor, admin roles
3. **RLS policies** - Enforce at database level
4. **Input validation** - Use Zod schemas

### Sensitive Data Handling
1. **Never commit** secrets or API keys
2. **Use environment variables** for all credentials
3. **Implement CSRF protection** for mutations
4. **Sanitize user input** in rich text editor

## 📚 Additional Resources

### Documentation
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)

### Project-Specific Docs
- `README.md` - Basic setup instructions
- `PROJECT_STATUS.md` - Detailed project overview
- `PRODUCTION_DEPLOYMENT_PLAN.md` - Deployment guide
- `SPRINT3_DEMO.md` - Testing scenarios

## 🤝 Working as Architect/Senior Engineer

### Key Responsibilities
1. **Maintain code quality** - Review PRs, enforce standards
2. **Guide architecture decisions** - Keep it simple, scalable
3. **Optimize performance** - Monitor and improve
4. **Ensure security** - Regular audits, best practices
5. **Document changes** - Keep docs up-to-date

### Decision Framework
When making architectural decisions:
1. **Prioritize simplicity** over cleverness
2. **Consider maintainability** for future developers
3. **Ensure consistency** with existing patterns
4. **Validate performance** impact
5. **Document rationale** for significant changes

### Code Review Checklist
- [ ] Follows TypeScript best practices
- [ ] Consistent with project patterns
- [ ] Includes error handling
- [ ] Has loading states
- [ ] Mobile responsive
- [ ] No hardcoded values
- [ ] Lint-free
- [ ] Builds successfully

Remember: You're building a production system for Carbon Robotics. Every decision should reflect the engineering excellence expected from the AEP team.