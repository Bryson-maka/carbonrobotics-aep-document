# AEP Blueprint - Simple Public Deployment

## Quick Setup for Team Access

### 🎯 **Approach: Full Team Access**
- All `@carbonrobotics.com` team members get full access to everything
- No role management initially - keep it simple
- Focus on getting the team collaborating quickly

---

## 🚀 **Deployment Steps**

### **Step 1: Database Migration**
Run this SQL in your Supabase dashboard:

```sql
-- Copy and paste the contents of:
supabase/migrations/0007_simple_team_access.sql
```

This migration:
- ✅ Gives all Carbon Robotics team members full access to all features
- ✅ Creates simple user profiles (no roles)
- ✅ Tracks user activity (join date, last seen)
- ✅ Maintains audit trails for changes

### **Step 2: Test Multi-User Locally**

```bash
# Start your dev server
npm run dev

# Test with incognito browsers:
# 1. Open incognito window, login with your @carbonrobotics.com account
# 2. Open another incognito window, use a different @carbonrobotics.com account
# 3. Verify both can see and edit the same content
```

**Test Scenarios:**
- [ ] Both users can see the same sections/questions
- [ ] User A creates an answer, User B sees it immediately  
- [ ] Both users can add/edit/delete sections and questions
- [ ] No permission errors or access denied messages

### **Step 3: Deploy to Production**

Your system is already configured for production:
- ✅ **Supabase**: Already using production instance  
- ✅ **OAuth**: Already configured for `@carbonrobotics.com`
- ✅ **Environment**: `.env.local` settings work for production

**Deploy Options:**
```bash
# Option A: Vercel (recommended)
npx vercel

# Option B: Netlify  
npm run build && npx netlify deploy --prod

# Option C: Your hosting platform of choice
npm run build
```

### **Step 4: Team Onboarding**

1. **Share the URL** with your team members
2. **First Login**: They'll use their `@carbonrobotics.com` Google accounts
3. **Automatic Setup**: User profiles are created automatically
4. **Start Collaborating**: Everyone can immediately start adding content

---

## 🔍 **What Each Team Member Can Do**

### **Everyone Gets Full Access:**
- ✅ **View** all sections, questions, and answers
- ✅ **Create** new sections and questions  
- ✅ **Edit** any answers (rich text, charts, media)
- ✅ **Delete** content as needed
- ✅ **Drag & Drop** to reorder sections and questions
- ✅ **Real-time** updates via React Query

### **Security Features:**
- 🔒 Only `@carbonrobotics.com` emails can access
- 🔒 All changes are tracked with user attribution
- 🔒 Complete audit trail of who changed what
- 🔒 Secure authentication via Google OAuth

---

## 📊 **Monitoring Team Activity**

The system tracks:
- **Who joined when**: User profile creation dates
- **Last activity**: When each user was last active  
- **Change history**: Complete audit trail of all edits

Future enhancement: Add a "Team Activity" page to see who's been active.

---

## 🐛 **Troubleshooting**

### **Common Issues:**

**Issue**: "User can't log in"
- **Fix**: Ensure they're using `@carbonrobotics.com` email
- **Check**: OAuth is configured for your production domain

**Issue**: "Permission denied" errors  
- **Fix**: Ensure the database migration was run successfully
- **Check**: User profile was created (check `user_profiles` table)

**Issue**: "Changes not syncing between users"
- **Fix**: Check React Query cache invalidation
- **Check**: Browser network tab for failed API calls

### **Database Check:**
```sql
-- Verify migration worked:
SELECT * FROM user_profiles;

-- Check RLS policies:
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

## 🔮 **Future Enhancements** (when needed)

### **Phase 2: Role Management**
- Add admin/editor/viewer roles
- Granular permissions per role
- Role assignment interface

### **Phase 3: Advanced Features**  
- Real-time collaboration indicators
- Team activity dashboard
- Advanced export/import options
- Comment system for collaborative editing

---

## ✅ **Ready to Go!**

Your system is designed to "just work" for the team:

1. **Run the migration** → **Test locally** → **Deploy** → **Share with team**

2. **No complex setup needed** - team members just log in and start collaborating

3. **Same performance as local** - you're already using the production database

The focus is on getting your team productive quickly while maintaining security and audit trails. Role management can be added later when the team has been using the system and you understand the access patterns better.