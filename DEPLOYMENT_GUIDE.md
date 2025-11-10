# 🚀 Deployment Guide - Telefon Domino

This guide will walk you through deploying your Telefon Domino game to production.

## Prerequisites

- ✅ Supabase account ([supabase.com](https://supabase.com))
- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Supabase CLI installed (`npm install -g supabase`)

## Step-by-Step Deployment

### 1️⃣ Set Up Supabase Project

1. **Create a New Project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose organization, name, database password, and region
   - Wait for project to be provisioned (~2 minutes)

2. **Get Your Project Credentials**
   - Go to **Settings** → **API**
   - Copy these values:
     - `Project URL` (looks like: `https://xxxxx.supabase.co`)
     - `anon/public key` (starts with: `eyJhbGc...`)
     - `service_role key` (starts with: `eyJhbGc...`) ⚠️ Keep this secret!

3. **Run Database Migrations**
   
   Option A - Using Supabase CLI (Recommended):
   ```bash
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Push migrations
   supabase db push
   ```
   
   Option B - Manual SQL Editor:
   - Go to **SQL Editor** in Supabase dashboard
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_row_level_security.sql`

4. **Deploy Edge Functions**
   ```bash
   # Deploy all functions
   supabase functions deploy start-game --project-ref YOUR_PROJECT_REF
   supabase functions deploy play-move --project-ref YOUR_PROJECT_REF
   supabase functions deploy draw-tile --project-ref YOUR_PROJECT_REF
   supabase functions deploy pass-turn --project-ref YOUR_PROJECT_REF
   ```

5. **Set Edge Function Secrets**
   ```bash
   supabase secrets set --project-ref YOUR_PROJECT_REF \
     SUPABASE_URL=your-project-url \
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

6. **Enable Realtime**
   - Go to **Database** → **Replication**
   - Enable replication for these tables:
     - `rooms`
     - `room_members`
     - `game_states`
     - `moves`

### 2️⃣ Deploy Frontend to Vercel

1. **Push Code to Git**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   In Vercel project settings, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2 minutes)
   - Your site will be live at `your-project.vercel.app`

### 3️⃣ Configure Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Auth Settings in Supabase**
   - Go to **Authentication** → **URL Configuration**
   - Add your production URL to **Site URL**
   - Add to **Redirect URLs**

### 4️⃣ Add PWA Icons

1. **Create Icons**
   - Use [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
   - Upload your logo
   - Download the generated icons

2. **Add to Project**
   - Place `icon-192.png` and `icon-512.png` in `public/` folder
   - Commit and push:
   ```bash
   git add public/icon-*.png
   git commit -m "Add PWA icons"
   git push
   ```

3. **Verify PWA**
   - Open your deployed site
   - Chrome DevTools → **Lighthouse** → Run audit
   - PWA score should be ≥ 90

## 🎯 Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] All 4 Edge Functions deployed
- [ ] Edge Function secrets configured
- [ ] Realtime enabled for all tables
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] PWA icons created and uploaded
- [ ] Custom domain configured (if applicable)
- [ ] Lighthouse PWA score ≥ 90
- [ ] Test multiplayer functionality
- [ ] Test offline mode

## 🧪 Testing Your Deployment

### Test Multiplayer

1. Open your deployed site in 2+ browsers/devices
2. Create a room in one browser
3. Join with room code in others
4. Play a full game to verify:
   - Room creation/joining
   - Real-time presence updates
   - Game start functionality
   - Move validation
   - Scoring calculation
   - Game completion

### Test PWA Features

1. **Installation**
   - Open site in Chrome/Edge
   - Look for install prompt or click "Install" in address bar
   - Verify app installs successfully

2. **Offline Mode**
   - Install the PWA
   - Open DevTools → Network → Check "Offline"
   - Verify offline page appears
   - Re-enable network
   - Verify reconnection works

### Test Performance

```bash
# Run Lighthouse audit
lighthouse https://your-site.vercel.app --view
```

Target scores:
- **Performance**: ≥ 90
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90
- **PWA**: ≥ 90

## 🐛 Troubleshooting

### Edge Functions Not Working

**Problem**: Functions return errors or timeout

**Solutions**:
- Check function logs: `supabase functions logs start-game --project-ref YOUR_PROJECT_REF`
- Verify secrets are set: `supabase secrets list --project-ref YOUR_PROJECT_REF`
- Check function URL in Supabase dashboard
- Ensure CORS headers are correct

### Realtime Not Syncing

**Problem**: Game state doesn't update in real-time

**Solutions**:
- Verify Realtime is enabled for tables (Database → Replication)
- Check RLS policies allow reads
- Look for WebSocket errors in browser console
- Verify Supabase URL is correct in environment variables

### PWA Not Installing

**Problem**: Install prompt doesn't appear

**Solutions**:
- Verify `manifest.json` is served correctly
- Check Service Worker is registered (DevTools → Application)
- Ensure site is served over HTTPS
- Run Lighthouse PWA audit to see specific issues
- Verify icon files exist and are correct size

### Database Connection Issues

**Problem**: Queries fail with permission errors

**Solutions**:
- Check RLS policies in SQL Editor
- Verify anon key has correct permissions
- Test queries manually in Supabase SQL Editor
- Check table definitions match migrations

## 📊 Monitoring & Analytics

### Supabase Monitoring

- **Dashboard**: Monitor database performance, API usage
- **Logs**: Check Edge Function execution logs
- **Realtime**: Monitor WebSocket connections

### Vercel Analytics

- Enable Vercel Analytics for:
  - Page views
  - User sessions
  - Performance metrics
  - Error tracking

## 🔄 Continuous Deployment

Once set up, updates are automatic:

1. Make changes locally
2. Commit and push to Git
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Vercel automatically builds and deploys
4. For Edge Functions, run:
   ```bash
   supabase functions deploy --project-ref YOUR_PROJECT_REF
   ```

## 🔒 Security Best Practices

1. **Never commit secrets**
   - Keep `.env.local` in `.gitignore`
   - Use environment variables in Vercel

2. **Use Row Level Security**
   - All tables have RLS enabled
   - Players can only see their own data

3. **Service Role Key**
   - Only use in Edge Functions (server-side)
   - Never expose to client

4. **Rate Limiting**
   - Consider adding Vercel's rate limiting
   - Supabase has built-in rate limits

## 📈 Scaling Considerations

### Free Tier Limits

**Supabase Free Tier**:
- 500 MB database
- 2 GB bandwidth/month
- 50,000 monthly active users
- Edge Functions: 500,000 invocations/month

**Vercel Free Tier**:
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL

### When to Upgrade

Upgrade when you exceed:
- 10,000 monthly active players
- 100 GB database size
- Need 99.9% SLA
- Require dedicated support

## 🎉 Success!

Your Telefon Domino game is now live! Share the URL with friends and enjoy playing!

**Need Help?**
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**Happy Gaming! 🎲**



