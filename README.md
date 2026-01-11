# Facebook Auto Poster

Sistem posting otomatis ke 10 Fanspage Facebook menggunakan:
- **Admin Panel**: Next.js + Vercel
- **Worker**: Python Flask + Cloud Run
- **Storage**: Google Drive
- **Database**: Firestore
- **Scheduler**: Cloud Scheduler

## Features
- ✅ Upload gambar batch (max 10)
- ✅ AI Caption generation (Gemini 1.5 Vision)
- ✅ Preview & edit caption
- ✅ Kill Switch (Emergency stop)
- ✅ Anti-double post (Lock system)
- ✅ Error classification

## Quick Start

### Development
```bash
# Admin Panel
npm install
npm run dev

# Worker (optional)
cd backend-worker
pip install -r requirements.txt
python app.py
```

### Production
See [DEPLOY.md](./DEPLOY.md)

## Config

| Parameter | Value |
|-----------|-------|
| Fanpages | 10 |
| Interval | Every 6 minutes |
| Hours | 05:00 - 22:00 WIB |
| Posts/FP/Day | 17 |

## Structure
```
fb-auto-poster/
├── app/                    # Next.js pages & API
├── lib/                    # Utilities
├── backend-worker/         # Cloud Run (Python)
└── DEPLOY.md              # Deployment guide
```
