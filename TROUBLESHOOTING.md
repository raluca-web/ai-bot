# Troubleshooting Guide

## Blank Screen After Pulling Changes

If you see a blank screen, follow these steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Clear Cache and Rebuild
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### 3. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab for any errors.

### 4. Verify Environment Variables
Make sure your `.env` file exists and has these values:
```
VITE_SUPABASE_URL=https://jznalqsgygahklvqnibd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bmFscXNneWdhaGtsdnFuaWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjQ4MzEsImV4cCI6MjA3ODcwMDgzMX0.QuCLA0XZiQSq0Msr4ZAfuU-Rg7lC-WsIMiHSFV1jztM
```

### 5. Check Server is Running
```bash
npm run dev
```

The server should start at `http://localhost:5173`

### 6. Hard Refresh Browser
Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) to do a hard refresh and clear cached files.

### 7. Check if Files Are Present
Verify these files exist:
- `src/App.tsx`
- `src/components/ChatInterface.tsx`
- `src/components/DeepChartsLogo.tsx`
- `src/lib/supabase.ts`
- `src/services/chatService.ts`

## Common Issues

### "Cannot find module" Errors
Run: `npm install`

### "Vite" Not Found
Run: `npm install -g vite` or use `npx vite`

### Port Already in Use
Kill the process using port 5173 or use a different port:
```bash
npm run dev -- --port 3000
```

### TypeScript Errors
Run: `npm run typecheck` to see all type errors

## Still Not Working?

1. Check if your Node.js version is 18+ with: `node --version`
2. Try deleting `.vite` cache: `rm -rf .vite`
3. Check file permissions: `ls -la src/`

If issues persist, check the browser console for specific error messages.
