# 🔄 RESTART API SERVER - IMPORTANT!

## The Problem:
The API server is returning errors because it was started **before** the Fly.io proxy was running. The connection pool is stale and needs to be recreated.

## Solution:

### Step 1: Stop the API Server
Find the terminal where the API server is running and press:
```
Ctrl + C
```

### Step 2: Verify Proxy is Running
Check that the proxy is active:
```powershell
netstat -ano | findstr :5432
```
Should show port 5432 in LISTENING state.

If not running, start it:
```powershell
flyctl proxy 5432 -a emingo-db
```

### Step 3: Restart API Server
In a new terminal (or the same one after stopping):
```powershell
npm run dev:api
```

### Step 4: Check Console Output
You should see:
```
✅ Database connected successfully
✅ account_transactions table exists
✅ Database setup complete
🚀 API Server running on http://localhost:3001
```

### Step 5: Test
```powershell
curl http://localhost:3001/api/account/balance
```

Should return: `{"balance":0}` (not an error)

---

## If Still Not Working:

1. **Check API server console** - Look for error messages
2. **Check proxy** - Make sure `flyctl proxy` is still running
3. **Test database directly:**
   ```powershell
   node test-db-connection.js
   ```
   Should show all tests passing

---

## Quick Restart (All at Once):

```powershell
# Stop API server (Ctrl+C in its terminal)

# Make sure proxy is running
flyctl proxy 5432 -a emingo-db

# In another terminal, start API server
npm run dev:api
```


