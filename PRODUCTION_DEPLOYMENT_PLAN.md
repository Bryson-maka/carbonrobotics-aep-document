# AEP Blueprint - Production Deployment Plan

## Current Status Assessment

### ✅ What's Working
- **Google OAuth**: Configured with `@carbonrobotics.com` domain restriction
- **Supabase Integration**: Using production instance (`anyfhncbazmdixkzipyx.supabase.co`)
- **Authentication Flow**: Complete callback handling with proper cookies
- **Core Functionality**: All CRUD operations working in development
- **Service Layer**: Comprehensive service architecture with React Query
- **Multi-Content Support**: Rich text, charts, media, interactive content

### ⚠️ Critical Issues for Multi-User Deployment

## 1. **RLS Policy Model Decision Required**

**Current State**: The system is designed as a **shared document** where:
- All team members see the same sections/questions
- All team members can read all answers
- Users can only edit their own answers
- Admins can manage sections/questions

**Decision Needed**: Is this the intended behavior? Alternatives:
- **Option A (Current)**: Shared AEP document - everyone collaborates on same content
- **Option B**: Per-user isolated documents - each user has their own copy
- **Option C**: Team-based segregation - different teams see different content

**Recommendation**: Option A (current) seems appropriate for a team scope document.

## 2. **Required Database Migration**

Run the new migration to add user management:

```bash
# In your Supabase dashboard, run:
supabase/migrations/0006_production_ready.sql
```

This adds:
- User profiles with role management (admin/editor/viewer)
- Proper RLS policies based on user roles
- Auto-creation of user profiles on first login
- Enhanced audit trails

## 3. **Production Environment Setup**

### Environment Variables (Already Set)
```
NEXT_PUBLIC_SUPABASE_URL=https://anyfhncbazmdixkzipyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[current key]
```

### Google OAuth Configuration
Current setup should work, but verify in Google Cloud Console:
- **Authorized domains**: Should include your production domain
- **Redirect URIs**: Should include `https://yourdomain.com/auth/callback`

## 4. **User Role Management**

### Default Roles
- **bryson@carbonrobotics.com**: Auto-assigned `admin` role
- **All other @carbonrobotics.com**: Auto-assigned `editor` role

### Role Permissions
- **Admin**: Can manage sections, questions, and all answers
- **Editor**: Can create/edit answers and add questions to existing sections  
- **Viewer**: Read-only access (for future use)

## 5. **Testing Strategy for Multi-User**

### Phase 1: Single User Testing
```bash
# Test with your primary account
npm run dev
# Verify all functionality works
```

### Phase 2: Multi-User Testing
```bash
# Use incognito browsers with different @carbonrobotics.com accounts
# Test scenarios:
# 1. First-time login (profile creation)
# 2. Multiple users editing different answers simultaneously
# 3. Role-based access (admin vs editor functions)
# 4. Real-time updates between users
```

### Test Cases
1. **Authentication**:
   - [ ] Login with @carbonrobotics.com email
   - [ ] Reject non-Carbon Robotics emails
   - [ ] Auto-create user profile on first login
   - [ ] Persistent sessions across browser restarts

2. **Multi-User Collaboration**:
   - [ ] User A creates answer, User B can see it immediately
   - [ ] Multiple users can edit different answers simultaneously  
   - [ ] Optimistic updates work correctly with multiple users
   - [ ] No data corruption during concurrent edits

3. **Role-Based Access**:
   - [ ] Admins can add/edit/delete sections
   - [ ] Editors can add questions and edit answers
   - [ ] All users can see the same shared document structure

## 6. **Performance Considerations**

### Database Optimization
- Indexes already in place for sorting
- RLS policies optimized for role checking
- Views for progress calculation

### React Query Setup
- Proper cache invalidation for multi-user updates
- Optimistic updates with rollback on conflicts
- Real-time subscriptions not yet implemented (future enhancement)

## 7. **Security Checklist**

- [x] RLS enabled on all tables
- [x] Domain-restricted OAuth
- [x] Role-based access control
- [x] Audit trails for all changes
- [x] Input validation in service layer
- [ ] Rate limiting (consider for production)
- [ ] CORS configuration (if needed)

## 8. **Deployment Steps**

### Step 1: Database Migration
```sql
-- Run in Supabase SQL Editor:
-- Execute the contents of supabase/migrations/0006_production_ready.sql
```

### Step 2: Test Multi-User Locally
```bash
# Start development server
npm run dev

# Test with incognito browsers using different Carbon Robotics emails
```

### Step 3: Production Deploy
```bash
# Deploy to your hosting platform (Vercel, etc.)
# Ensure environment variables are set
# Test production domain with OAuth callback
```

### Step 4: User Onboarding
1. Share production URL with team members
2. Have them log in with @carbonrobotics.com accounts
3. Verify their user profiles are created correctly
4. Assign admin roles as needed

## 9. **Monitoring & Maintenance**

### Key Metrics to Watch
- User login success/failure rates
- Database query performance
- Real-time collaboration conflicts
- Error rates in React Query mutations

### Regular Maintenance
- Review user roles quarterly
- Monitor database performance
- Update dependencies regularly
- Backup strategy for critical content

## 10. **Future Enhancements**

### Real-Time Collaboration
- WebSocket integration for live updates
- Conflict resolution for simultaneous edits
- User presence indicators

### Advanced User Management
- Team-based segregation if needed
- Bulk user import/export
- Advanced audit logging

### Export/Import Features
- PDF generation for completed documents
- Excel export for reporting
- Backup/restore functionality

---

## Immediate Next Steps

1. **Run database migration** (`0006_production_ready.sql`)
2. **Test multi-user scenarios** with incognito browsers
3. **Deploy to production** hosting platform
4. **Invite team members** to test with their @carbonrobotics.com accounts
5. **Monitor and iterate** based on user feedback

The system is architecturally ready for multi-user production deployment. The main requirements are running the database migration and testing the multi-user scenarios to ensure proper behavior.