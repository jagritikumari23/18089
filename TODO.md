# API Token Integration Plan

## Steps:
- [x] 1. Create backend/config.js with token
- [x] 2. Update backend/notificationService.js to import config and add auth headers to axios calls
- [x] 3. Fix index.js routes path if needed (currently './src/routes' but files in 'backend/')
- [x] 4. Add backend/config.js to .gitignore
- [x] 5. Test backend API endpoints
- [x] 6. Complete: attempt_completion

**Changes summary (for Git commit):**
- Added backend/config.js (token - gitignored)
- Updated backend/notificationService.js (+auth headers)
- Fixed index.js (paths to backend/)
- .gitignore + TODO.md
