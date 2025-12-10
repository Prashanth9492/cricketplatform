# Vercel Deployment Guide for Backend

## Issue: Database Not Connecting on Vercel

### Steps to Fix:

## 1. **Set Environment Variables in Vercel Dashboard**

Go to your Vercel project settings and add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yourdbname?retryWrites=true&w=majority
PORT=5001
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
```

**Important:**
- Go to: https://vercel.com/[your-username]/[project-name]/settings/environment-variables
- Add each variable for **Production**, **Preview**, and **Development** environments
- Click "Save" after each variable

## 2. **MongoDB Atlas Network Access**

Your MongoDB Atlas cluster needs to allow Vercel's IP addresses:

1. Go to MongoDB Atlas Dashboard
2. Click "Network Access" in the left sidebar
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Or** add Vercel's IP ranges if you want more security
5. Click "Confirm"

## 3. **Verify MongoDB Connection String**

Make sure your `MONGODB_URI` includes:
- Correct username and password (URL-encoded if special characters)
- Database name in the path: `/yourdbname`
- Query parameters: `?retryWrites=true&w=majority`

Example:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/cricket?retryWrites=true&w=majority
```

## 4. **Deploy Backend Separately**

Since you have a separate backend folder, deploy it as a separate Vercel project:

### Option A: Deploy from Backend Folder
```bash
cd backend
vercel
```

### Option B: Deploy via Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your repository
3. Set "Root Directory" to `backend`
4. Add environment variables
5. Deploy

## 5. **Update Frontend API URLs**

After deploying backend, update your frontend to use the Vercel backend URL:

In `src/lib/secureApi.ts` or wherever you define API base URL:
```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-backend.vercel.app';
```

Then add to your frontend `.env`:
```
VITE_API_URL=https://your-backend.vercel.app
```

## 6. **Common Issues**

### Issue: "Cannot find module"
**Solution:** Make sure `package.json` in backend has all dependencies

### Issue: "Function timeout"
**Solution:** Vercel free tier has 10s timeout for serverless functions. For Socket.IO, you might need a different hosting solution (Railway, Render, etc.)

### Issue: "CORS errors"
**Solution:** Update CORS in `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## 7. **Alternative: Deploy Backend to Railway/Render**

Since your app uses Socket.IO (real-time connections), Vercel serverless functions have limitations. Consider:

### Railway (Recommended for Socket.IO):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway up
```

### Render:
1. Go to https://render.com
2. Create new "Web Service"
3. Connect your GitHub repo
4. Set root directory to `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables

## 8. **Vercel Logs**

Check deployment logs:
```bash
vercel logs [deployment-url]
```

Or in Vercel Dashboard:
- Go to your project
- Click "Deployments"
- Click on latest deployment
- View "Function Logs" or "Build Logs"

## Quick Checklist:

- [ ] Environment variables added to Vercel
- [ ] MongoDB Atlas allows connections from 0.0.0.0/0
- [ ] MongoDB URI includes database name and query params
- [ ] Backend deployed as separate Vercel project (or Railway/Render)
- [ ] Frontend updated with production backend URL
- [ ] CORS configured with frontend domain
- [ ] Checked Vercel deployment logs for errors

---

**Note:** For production apps with Socket.IO, Railway or Render are better choices than Vercel's serverless functions.
