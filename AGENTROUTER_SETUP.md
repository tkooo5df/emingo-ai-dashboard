# 🤖 AgentRouter API Setup

## ✅ Code Updated!

I've updated the code to use **AgentRouter API** from https://agentrouter.org/

### Changes Made:

1. **API Server** (`server/api.js`):
   - Changed endpoint to: `https://api.agentrouter.org/v1/chat/completions`
   - Using model: `gpt-5.1`
   - Looking for `AGENTROUTER_API_KEY` in environment variables

2. **AI Service** (`src/lib/ai-service.ts`):
   - Updated to use `gpt-5.1` model
   - All AI features now use AgentRouter

## 🔑 Add Your API Key:

Add your AgentRouter API key to `.env.local`:

```env
AGENTROUTER_API_KEY=your-agentrouter-api-key-here
```

You can also keep the existing keys for fallback:
```env
OPENAI_API_KEY=sk-G0Rc5o4dYvDjITIfH9R5K3cMu8l8Pl7VPfqnszvxEirZIoLL
AGENTROUTER_API_KEY=your-agentrouter-api-key-here
```

## 🔄 Restart Required:

After adding the API key, **restart the API server**:

1. Stop the API server (Ctrl+C)
2. Restart:
   ```powershell
   npm run dev:api
   ```
   Or restart everything:
   ```powershell
   npm run dev:all
   ```

## ✅ Verification:

After restarting, you should see:
```
🚀 API Server running on http://localhost:3001
✅ AgentRouter API key configured
```

## 🎯 Features:

All AI features now use AgentRouter GPT-5.1:
- ✅ Daily Financial Tips
- ✅ Spending Analysis
- ✅ Budget Plan Generation
- ✅ Project Prioritization
- ✅ Goal Achievement Advice
- ✅ AI Assistant Chat

---

**Get your API key from: https://agentrouter.org/** 🔑

