# 🔧 Fix Database Connection Issues

## Current Status:
- ✅ Fly.io proxy is running on port 5432
- ❌ API server is getting 500 errors

## Solution:

### Step 1: Restart the API Server

The API server needs to be restarted to pick up the database connection. 

**Stop the current API server** (if running):
- Press `Ctrl+C` in the terminal where it's running

**Start it again:**
```bash
npm run dev:api
```

### Step 2: Check the Console Output

When the API server starts, you should see:
```
✅ Database connected successfully
✅ account_transactions table exists
✅ Database setup complete
🚀 API Server running on http://localhost:3001
```

If you see errors instead:
- Check that `flyctl proxy 5432 -a emingo-db` is running
- Check the error message for details

### Step 3: Test the Connection

After restarting, test:
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/account/balance
```

Both should return JSON (not errors).

---

## If Still Not Working:

1. **Check proxy is running:**
   ```bash
   netstat -ano | findstr :5432
   ```
   Should show port 5432 in LISTENING state

2. **Check API server logs:**
   Look at the terminal where `npm run dev:api` is running
   - Look for connection errors
   - Look for SQL errors

3. **Test database directly:**
   ```bash
   flyctl postgres connect -a emingo-db
   ```
   Then in psql:
   ```sql
   SELECT COUNT(*) FROM account_transactions;
   ```

---

## Quick Restart Command:

```bash
# Stop all node processes (if needed)
Get-Process node | Stop-Process -Force

# Start proxy (in one terminal)
flyctl proxy 5432 -a emingo-db

# Start API server (in another terminal)
npm run dev:api
```

