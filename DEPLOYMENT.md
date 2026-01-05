# Environment Configuration Guide

## Development vs Production URLs

The onboarding link generator now uses the `NEXT_PUBLIC_APP_URL` environment variable to ensure correct URLs in both development and production.

### Local Development
In `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Deployment
When deploying to your live server, update `.env.local` (or your hosting platform's environment variables) with your actual domain:

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Examples:
- **Development**: `http://localhost:3000/onboarding?order_id=...`
- **Production**: `https://yourdomain.com/onboarding?order_id=...`

### Important Notes:
1. The variable **must** start with `NEXT_PUBLIC_` to be accessible in the browser
2. Do **not** include a trailing slash
3. Include the protocol (`http://` or `https://`)
4. After changing environment variables, restart your development server

### On VPS/Hosting Platforms:
- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables  
- **VPS (PM2)**: Update `.env.local` on the server and restart with `pm2 restart all`
- **Docker**: Pass as environment variable in docker-compose or Dockerfile

## Current Configuration
✅ Development: Uses `http://localhost:3000`
✅ Production: Will use your configured domain from `NEXT_PUBLIC_APP_URL`
