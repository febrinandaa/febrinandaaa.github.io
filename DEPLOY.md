# Facebook Auto Poster - Deployment Guide

## Prerequisites
- [Vercel Account](https://vercel.com)
- [Google Cloud Account](https://console.cloud.google.com)
- [Facebook Developer Account](https://developers.facebook.com)

---

## Step 1: Setup Google Cloud Project

### 1.1 Create Project
```bash
gcloud projects create fb-auto-poster --name="FB Auto Poster"
gcloud config set project fb-auto-poster
```

### 1.2 Enable APIs
```bash
gcloud services enable \
  drive.googleapis.com \
  firestore.googleapis.com \
  run.googleapis.com \
  cloudscheduler.googleapis.com
```

### 1.3 Create Service Account
```bash
gcloud iam service-accounts create poster-bot \
  --display-name="FB Auto Poster Bot"

gcloud iam service-accounts keys create ./service-account.json \
  --iam-account=poster-bot@fb-auto-poster.iam.gserviceaccount.com
```

### 1.4 Setup Firestore
```bash
gcloud firestore databases create --location=asia-southeast2
```

---

## Step 2: Deploy Admin Panel (Vercel)

### 2.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 2.2 Deploy
```bash
cd fb-auto-poster
vercel
```

### 2.3 Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Contents of `service-account.json` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Contents of `service-account.json` |
| `GOOGLE_DRIVE_FOLDER_ID` | Your Drive folder ID |
| `API_SECRET` | Generate: `openssl rand -hex 32` |

### 2.4 Redeploy
```bash
vercel --prod
```

---

## Step 3: Deploy Cloud Run Worker

### 3.1 Build & Push
```bash
cd backend-worker

gcloud builds submit --tag gcr.io/fb-auto-poster/worker

gcloud run deploy fb-poster-worker \
  --image gcr.io/fb-auto-poster/worker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="VERCEL_API_URL=https://your-app.vercel.app,API_SECRET=your-secret" \
  --set-env-vars="GOOGLE_SERVICE_ACCOUNT_KEY=$(cat ../service-account.json | jq -c)"
```

---

## Step 4: Setup Cloud Scheduler

```bash
gcloud scheduler jobs create http fb-poster-trigger \
  --location=us-central1 \
  --schedule="*/6 5-21 * * *" \
  --time-zone="Asia/Jakarta" \
  --uri="https://fb-poster-worker-xxxxx-uc.a.run.app/trigger" \
  --http-method=POST \
  --headers="Content-Type=application/json"
```

---

## Step 5: Share Drive Folder

1. Create folder `AI_POST_CONTENT` in your Drive
2. Share with: `poster-bot@fb-auto-poster.iam.gserviceaccount.com`
3. Give "Editor" access
4. Copy folder ID from URL

---

## Step 6: Setup Facebook Pages

For each fanpage in Firestore `pages` collection:
```json
{
  "id": "FP_1",
  "name": "Fanpage 1",
  "fb_page_id": "123456789",
  "access_token": "EAAG..."
}
```

Get Page Access Token:
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Get User Token with `pages_manage_posts`, `pages_read_engagement`
4. Exchange for Long-Lived Token

---

## Verification

### Test Worker
```bash
curl -X POST https://fb-poster-worker-xxxxx-uc.a.run.app/trigger
```

### Check Logs
```bash
gcloud logs read --service fb-poster-worker
```
