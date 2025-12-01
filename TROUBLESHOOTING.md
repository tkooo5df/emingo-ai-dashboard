# 🔧 Troubleshooting Guide

## Common Errors and Solutions

### Error: "Failed to calculate balance" / "Failed to fetch expenses"

**Cause:** Database connection issue - the API server cannot connect to the database.

**Solution:**

1. **Make sure Fly.io proxy is running:**
   ```bash
   flyctl proxy 5432 -a emingo-db
   ```
   Keep this terminal open while developing.

2. **Check if API server is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok"}`

3. **Check database connection:**
   The API server will log connection status on startup. Look for:
   - ✅ `Database connected successfully` - Good!
   - ❌ `Database connection failed` - Check proxy

### Error: "Module 'events' has been externalized"

**Cause:** Trying to use Node.js modules (`pg`) in the browser.

**Solution:** This is fixed! The API server handles all database operations. Make sure:
- API server is running: `npm run dev:api`
- Frontend uses `src/lib/api.ts` (not `database.ts` directly)

### Error: 500 Internal Server Error

**Possible causes:**
1. Database proxy not running
2. Database tables don't exist
3. Connection string incorrect

**Solution:**
1. Start proxy: `flyctl proxy 5432 -a emingo-db`
2. Restart API server: `npm run dev:api`
3. Check API server logs for detailed error messages

---

## Quick Fix Checklist

- [ ] Fly.io proxy running: `flyctl proxy 5432 -a emingo-db`
- [ ] API server running: `npm run dev:api` (or `npm run dev:all`)
- [ ] Vite dev server running: `npm run dev`
- [ ] Database tables created (check with `flyctl postgres connect -a emingo-db`)

---

## Testing the Setup

1. **Test API health:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Test database connection:**
   Check API server console for connection messages

3. **Test in browser:**
   Open DevTools → Network tab → Check API requests

---

## Still Having Issues?

Check the API server console output - it will show detailed error messages including:
- Database connection errors
- SQL query errors
- Missing table errors

