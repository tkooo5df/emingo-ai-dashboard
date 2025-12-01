# 🔧 Fix 401 Unauthorized Error

## Problem:
AgentRouter API returning `401 Unauthorized` - API key authentication failed.

## ✅ Solutions:

### 1. Verify API Key:
Make sure your API key is valid and correctly set in `.env.local`:
```env
AGENT_ROUTER_TOKEN=your-actual-api-key-here
AGENTROUTER_API_KEY=your-actual-api-key-here
```

### 2. Get a Valid API Key:
Visit: **https://agentrouter.org/console/token**
- Sign up or log in
- Generate a new API key
- Copy the key and add it to `.env.local`

### 3. Restart API Server:
After updating `.env.local`, **restart the API server**:
```powershell
# Stop API server (Ctrl+C)
# Then restart:
npm run dev:api
```

### 4. Check API Server Console:
After restarting, check the console for:
- `✅ AGENT_ROUTER_TOKEN found` (or similar)
- `✅ AgentRouter API key configured`
- `📡 Using AgentRouter API: https://agentrouter.org/v1`

### 5. Test the API Key:
The API server will now log:
- First 10 characters of the key
- Last 4 characters of the key
- This helps verify the key is being loaded correctly

## 🔍 Debugging:

If you still get 401:
1. Verify the key in `.env.local` matches the one from AgentRouter console
2. Make sure there are no extra spaces or quotes around the key
3. Check API server console for the key preview (first 10 + last 4 chars)
4. Try generating a new API key from AgentRouter console

---

**After fixing the API key and restarting, the 401 error should be resolved!** ✅

