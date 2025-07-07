# Repository Cleanup Plan

## Current State
- **Root directory**: Contains legacy HTML prototype (index.html, supabaseClient.js)
- **aep-blueprint/**: Contains the production Next.js application
- **Issue**: Vercel deployment is complicated by this dual structure

## Cleanup Strategy

### Phase 1: Archive Legacy Files
Create a `legacy/` directory to preserve the original prototype:
```bash
mkdir legacy
mv index.html legacy/
mv supabaseClient.js legacy/
mv supabaseClient.js.example legacy/
mv favicon.svg legacy/
mv -r db/ legacy/
mv client_secret_*.json legacy/  # Should be in .gitignore anyway
```

### Phase 2: Move Next.js App to Root
Move the aep-blueprint contents to the repository root:
```bash
# Move all contents of aep-blueprint to root
mv aep-blueprint/* .
mv aep-blueprint/.* .  # Hidden files
rmdir aep-blueprint
```

### Phase 3: Clean Up Configuration
1. Remove the wrapper `package.json` at root
2. Remove `vercel.json` (Vercel will auto-detect Next.js)
3. Update `README.md` to reflect the new structure

### Phase 4: Update Documentation
- Update CLAUDE.md paths
- Update deployment guides
- Add migration notice to legacy README

## Benefits
1. **Simpler deployment** - Vercel will auto-detect Next.js at root
2. **Cleaner structure** - No confusion about which is the active project
3. **Better DX** - Developers work directly in the root
4. **No workarounds** - Standard Next.js deployment

## Migration Commands
```bash
# Create legacy archive
mkdir legacy
mv index.html supabaseClient.js supabaseClient.js.example favicon.svg db legacy/

# Move Next.js app to root
mv aep-blueprint/.gitignore .gitignore-next
mv aep-blueprint/* .
mv aep-blueprint/.* . 2>/dev/null || true
rmdir aep-blueprint

# Clean up
rm package.json  # Remove wrapper
rm vercel.json   # Let Vercel auto-detect
mv .gitignore-next .gitignore

# Remove sensitive file
rm legacy/client_secret_*.json

# Commit
git add -A
git commit -m "refactor: move Next.js app to root and archive legacy prototype"
git push origin main
```

## Rollback Plan
If needed, the git history preserves everything:
```bash
git revert HEAD
```

## Timeline
- Estimated time: 10 minutes
- Deployment downtime: ~5 minutes while Vercel rebuilds
- Risk: Low (git history preserves everything)