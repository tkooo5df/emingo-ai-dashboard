# Deploy to Fly.io

## Prerequisites

1. Install Fly.io CLI:
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. Login to Fly.io:
   ```bash
   flyctl auth login
   ```

3. Create a PostgreSQL database (if you don't have one):
   ```bash
   flyctl postgres create --name emingo-db --region iad
   ```

## Deployment Steps

### 1. Set Environment Variables

Set all required secrets on Fly.io:

```bash
# Database URL (from your PostgreSQL database)
flyctl secrets set DATABASE_URL="postgres://user:password@host:port/database"

# JWT Secret (generate a strong random string)
flyctl secrets set JWT_SECRET="your-strong-random-secret-key-here"

# Google OAuth (if using Google login)
flyctl secrets set GOOGLE_CLIENT_ID="your-google-client-id"
flyctl secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret"
flyctl secrets set GOOGLE_REDIRECT_URI="https://your-app.fly.dev/auth/callback"

# You.com API Key (for AI features)
flyctl secrets set YOU_API_KEY="your-you-api-key"
```

### 2. Update fly.toml

Edit `fly.toml` and change the app name if needed:
```toml
app = "your-app-name"
```

### 3. Deploy

```bash
flyctl deploy
```

### 4. Check Status

```bash
flyctl status
flyctl logs
```

### 5. Open Your App

```bash
flyctl open
```

## Troubleshooting

- Check logs: `flyctl logs`
- SSH into machine: `flyctl ssh console`
- Check secrets: `flyctl secrets list`
- Restart app: `flyctl apps restart your-app-name`

## Database Connection

If using Fly.io PostgreSQL, attach it to your app:
```bash
flyctl postgres attach --app your-app-name emingo-db
```

This will automatically set the `DATABASE_URL` secret.

