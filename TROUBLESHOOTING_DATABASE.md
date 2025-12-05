# 🔧 Database Connection Troubleshooting

## Current Issue:
All API endpoints returning 500 errors - database connection failing.

## ✅ Solutions:

### 1. Check flyctl proxy is running:
```powershell
# Check if running
Get-Process -Name flyctl

# If not running, start it in a separate terminal:
flyctl proxy 5432 -a emingo-db
```

### 2. Verify Database Connection:
The connection string is:
```
postgres://postgres:vOZx4og262UxQeT@localhost:5432
```

### 3. Check API Server Console:
Look for these messages in the API server terminal:
- ✅ `Database connected successfully`
- ✅ `All tables created`
- ❌ `Database connection failed` (if you see this, check the error message)

### 4. Common Issues:

**Issue: "Connection refused"**
- Solution: Make sure `flyctl proxy 5432 -a emingo-db` is running

**Issue: "Table does not exist"**
- Solution: The code now auto-creates tables on startup. Restart API server.

**Issue: "Authentication failed"**
- Solution: Check database credentials in Fly.io dashboard

**Issue: "Network error"**
- Solution: Check internet connection and Fly.io service status

### 5. Manual Table Creation (if needed):

If tables still don't exist, you can create them manually using `create-tables.sql`:

```powershell
# Connect via psql (if you have it installed)
psql postgres://postgres:vOZx4og262UxQeT@localhost:5432 -f create-tables.sql
```

### 6. Restart Everything:

1. Stop API server (Ctrl+C)
2. Stop flyctl proxy (Ctrl+C in its terminal)
3. Restart flyctl proxy:
   ```powershell
   flyctl proxy 5432 -a emingo-db
   ```
4. Restart API server:
   ```powershell
   npm run dev:api
   ```

---

## 📝 Expected Console Output:

When everything works, you should see:
```
✅ Loaded environment variables from .env.local
✅ Database connected successfully
📦 Creating database tables...
✅ All tables created
📊 Creating indexes...
✅ All indexes created
✅ Database setup complete
🚀 API Server running on http://localhost:3001
✅ AgentRouter API key configured
```

---

**If problems persist, check the API server console for detailed error messages!**


