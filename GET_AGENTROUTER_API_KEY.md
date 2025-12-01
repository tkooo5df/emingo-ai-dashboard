# 🔑 How to Get a Valid AgentRouter API Key

## Current Issue:
The API key in `.env.local` is invalid or expired. You need to get a new one from AgentRouter.

## Steps to Get API Key:

### 1. Visit AgentRouter Console:
**https://agentrouter.org/console/token**

### 2. Sign Up or Log In:
- If you don't have an account, create one
- If you have an account, log in

### 3. Generate API Key:
- Once logged in, you'll see your API tokens
- Click "Generate New Token" or copy your existing token
- The token should look like: `sk-...` or similar format

### 4. Update .env.local:
After getting your API key, update `.env.local`:

```env
AGENT_ROUTER_TOKEN=your-new-api-key-here
AGENTROUTER_API_KEY=your-new-api-key-here
```

### 5. Restart API Server:
After updating the key:
```powershell
# Stop API server (Ctrl+C)
# Then restart:
npm run dev:api
```

## ⚠️ Important Notes:

- The API key must be from **https://agentrouter.org/console/token**
- Make sure there are no extra spaces or quotes around the key
- The key should start with something like `sk-` or similar
- Keep your API key secret - don't share it publicly

## 🔍 Verify:

After restarting, check API server console for:
```
✅ AGENT_ROUTER_TOKEN found (sk-xxxxx...xxxx)
✅ AgentRouter API key configured
```

If you still get 401 errors, the key might be invalid or expired.

---

**Get your API key from: https://agentrouter.org/console/token** 🔑

