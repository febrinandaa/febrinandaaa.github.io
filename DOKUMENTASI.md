# 📘 FB Auto Poster - Dokumentasi Lengkap

Dokumentasi step-by-step untuk setup dan konfigurasi aplikasi FB Auto Poster.

---

## 📋 Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Prasyarat](#3-prasyarat)
4. [Setup Supabase Database](#4-setup-supabase-database)
5. [Setup Cloudinary](#5-setup-cloudinary)
6. [Setup Facebook App](#6-setup-facebook-app)
7. [Setup Groq API](#7-setup-groq-api)
8. [Konfigurasi Environment Variables](#8-konfigurasi-environment-variables)
9. [Menambahkan Fanpage Baru](#9-menambahkan-fanpage-baru)
10. [Generate Facebook Page Token](#10-generate-facebook-page-token)
11. [Deploy ke Vercel](#11-deploy-ke-vercel)
12. [Setup Vercel Cron](#12-setup-vercel-cron)
13. [Upload Konten](#13-upload-konten)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Gambaran Umum

FB Auto Poster adalah aplikasi untuk posting otomatis ke multiple Facebook Pages dengan fitur:

- ✅ **Multi-Fanpage Support** - Kelola hingga 10+ halaman Facebook
- ✅ **Auto Caption Generation** - Generate caption menggunakan AI (Groq)
- ✅ **Scheduled Posting** - Post otomatis setiap 6 menit (05:00-22:00 WIB)
- ✅ **Content Management** - Upload dan kelola konten via dashboard
- ✅ **Post to Feed** - Postingan muncul di Feed utama (bukan hanya tab Photos)

---

## 2. Arsitektur Sistem

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Vercel Cron    │────▶│  Next.js API    │────▶│  Facebook API   │
│  (every 6 min)  │     │  /api/cron      │     │  Graph v19.0    │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │ Supabase  │ │Cloudinary │ │  Groq AI  │
            │ Database  │ │  Storage  │ │  Caption  │
            └───────────┘ └───────────┘ └───────────┘
```

### Komponen Utama:

| Komponen | Fungsi |
|----------|--------|
| **Vercel** | Hosting Next.js app + Cron scheduler |
| **Supabase** | Database (pages, content, logs) |
| **Cloudinary** | Penyimpanan gambar |
| **Groq** | AI untuk generate caption |
| **Facebook Graph API** | Posting ke Facebook Pages |

---

## 3. Prasyarat

Pastikan Anda memiliki akun di:

- [ ] [Vercel](https://vercel.com) - Hosting
- [ ] [Supabase](https://supabase.com) - Database
- [ ] [Cloudinary](https://cloudinary.com) - Image storage
- [ ] [Groq](https://console.groq.com) - AI API
- [ ] [Facebook Developer](https://developers.facebook.com) - Facebook App

---

## 4. Setup Supabase Database

### 4.1 Buat Project Baru

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Klik **"New Project"**
3. Isi:
   - Name: `fb-auto-poster`
   - Database Password: (simpan dengan aman!)
   - Region: Singapore (terdekat)
4. Klik **"Create new project"**

### 4.2 Buat Tabel Database

Buka **SQL Editor** dan jalankan query berikut:

```sql
-- Tabel Pages (konfigurasi fanpage)
CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fb_page_id TEXT,
    access_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Content (konten yang akan dipost)
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT REFERENCES pages(id),
    file_name TEXT NOT NULL,
    cloudinary_url TEXT,
    cloudinary_public_id TEXT,
    base_caption TEXT,
    used_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Posting Logs (history posting)
CREATE TABLE posting_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT,
    content_id UUID,
    success BOOLEAN,
    post_id TEXT,
    error_message TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Cron Runs (idempotency)
CREATE TABLE cron_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_key TEXT UNIQUE NOT NULL,
    page_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Settings (konfigurasi sistem)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('systemEnabled', '{"enabled": true}'),
('stock_config', '{"FP_1": 100, "FP_2": 100, "FP_3": 100, "FP_4": 100, "FP_5": 100, "FP_6": 100}');

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for service role
CREATE POLICY "Service role full access" ON pages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON content FOR ALL USING (true);
CREATE POLICY "Service role full access" ON posting_logs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON cron_runs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON settings FOR ALL USING (true);
```

### 4.3 Dapatkan Credentials

1. Buka **Settings** → **API**
2. Catat:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **PENTING**: Gunakan `service_role` key, BUKAN `anon` key!

---

## 5. Setup Cloudinary

### 5.1 Buat Akun

1. Daftar di [Cloudinary](https://cloudinary.com/users/register_free)
2. Verifikasi email

### 5.2 Dapatkan Credentials

1. Login ke Dashboard
2. Di halaman utama, catat:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### 5.3 Buat Folder

1. Buka **Media Library**
2. Klik **Create Folder**
3. Buat folder per fanpage: `FP_1`, `FP_2`, dst.

---

## 6. Setup Facebook App

### 6.1 Buat Facebook App

1. Buka [Facebook Developers](https://developers.facebook.com)
2. Klik **"My Apps"** → **"Create App"**
3. Pilih **"Other"** → **"Business"**
4. Isi:
   - App Name: `Poster Auto` (atau nama lain)
   - Contact Email: (email Anda)
5. Klik **Create App**

### 6.2 Tambahkan Facebook Login for Business

1. Di Dashboard app, klik **"Add Product"**
2. Pilih **"Facebook Login for Business"** → **Set Up**
3. Pilih **Web**
4. Site URL: `https://your-app.vercel.app`

### 6.3 Set Permissions

1. Buka **App Review** → **Permissions and Features**
2. Request permissions:
   - `pages_manage_posts` ✅
   - `pages_read_engagement` ✅
   - `pages_show_list` ✅
   - `business_management` ✅

### 6.4 Publish App

1. Buka **Settings** → **Basic**
2. Isi:
   - Privacy Policy URL: `https://your-app.vercel.app/privacy`
   - Terms of Service URL: `https://your-app.vercel.app/terms`
   - Category: `Business and Pages`
3. Klik **Save Changes**
4. Klik **Publish** di sidebar → Klik **Publish**

> ⚠️ App HARUS dipublish agar postingan terlihat oleh publik!

---

## 7. Setup Groq API

### 7.1 Dapatkan API Key

1. Buka [Groq Console](https://console.groq.com)
2. Login dengan Google/GitHub
3. Buka **API Keys**
4. Klik **Create API Key**
5. Copy key → `GROQ_API_KEY`

### 7.2 (Opsional) Key Rotation

Untuk mencegah rate limiting, buat 2 API keys:
- `GROQ_API_KEY` - Key utama
- `GROQ_API_KEY_2` - Key backup

Aplikasi akan otomatis rotate jika satu key kena rate limit.

---

## 8. Konfigurasi Environment Variables

### 8.1 File `.env.local` (Development)

Buat file `.env.local` di root project:

```env
# ============ SUPABASE ============
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============ CLOUDINARY ============
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz

# ============ GROQ AI ============
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY_2=gsk_yyyyyyyyyyyyyyyyyyyyyyyy

# ============ CRON SECRET ============
# Generate dengan: openssl rand -hex 32
CRON_SECRET=your-random-secret-key

# ============ GEMINI (Optional) ============
GEMINI_API_KEY=your-gemini-key
```

### 8.2 Vercel Environment Variables

1. Buka Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Tambahkan semua variabel di atas
3. Pastikan scope: **Production**, **Preview**, dan **Development**

---

## 9. Menambahkan Fanpage Baru

### 9.1 Edit `lib/config.ts`

```typescript
export const FANPAGES: Fanpage[] = [
    { id: 'FP_1', name: 'Logika Rasa', fbPageId: '123456789' },
    { id: 'FP_2', name: 'Goresan Tinta', fbPageId: '987654321' },
    // Tambah fanpage baru di sini:
    { id: 'FP_7', name: 'Nama Fanpage Baru', fbPageId: 'PAGE_ID_BARU' },
];
```

### 9.2 Insert ke Supabase

```sql
INSERT INTO pages (id, name, fb_page_id, access_token) VALUES
('FP_7', 'Nama Fanpage Baru', 'PAGE_ID_BARU', 'ACCESS_TOKEN_HERE');
```

### 9.3 Buat Folder di Cloudinary

Buat folder `FP_7` di Cloudinary Media Library.

---

## 10. Generate Facebook Page Token

### Metode 1: Graph API Explorer (Cepat, Token 60 hari)

1. Buka [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Pilih app Anda
3. Klik **"Get User Access Token"**
4. Centang permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Klik **Generate Access Token**
6. Call endpoint untuk exchange ke Page Token:
   ```
   GET /me/accounts?access_token=USER_TOKEN
   ```
7. Copy `access_token` untuk page yang diinginkan

### Metode 2: System User (Rekomendasi, Token Tidak Expire)

1. Buka [Meta Business Suite](https://business.facebook.com)
2. Pilih Business Portfolio Anda
3. Buka **Settings** → **Users** → **System Users**
4. Klik **Add** → Buat System User baru:
   - Name: `FB Poster Bot`
   - Role: **Admin**
5. Klik **Add Assets**:
   - Pilih **Pages** → Pilih semua fanpage
   - Set **Full Control**
6. Klik **Generate New Token**:
   - Pilih app Anda
   - Permissions: `pages_manage_posts`, `pages_read_engagement`
   - Token Expiration: **Never**
7. Copy token → Update di Supabase

### Update Token di Supabase

```sql
UPDATE pages 
SET access_token = 'NEW_TOKEN_HERE' 
WHERE id = 'FP_1';
```

---

## 11. Deploy ke Vercel

### 11.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 11.2 Deploy

```bash
cd fb-auto-poster
vercel
```

Ikuti prompt:
- Link to existing project? → No
- Project name? → `fb-auto-poster`
- Framework? → Next.js (auto-detected)

### 11.3 Set Environment Variables

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add GROQ_API_KEY
vercel env add CRON_SECRET
```

### 11.4 Deploy ke Production

```bash
vercel --prod
```

---

## 12. Setup Vercel Cron

### 12.1 Buat File `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/6 5-21 * * *"
    }
  ]
}
```

### Penjelasan Schedule:

| Part | Value | Meaning |
|------|-------|---------|
| `*/6` | Setiap 6 menit | 0, 6, 12, 18, 24, 30, 36, 42, 48, 54 |
| `5-21` | Jam 05:00-21:59 | Operating hours |
| `* * *` | Setiap hari | All days |

### 12.2 Pastikan CRON_SECRET Terpasang

Cron endpoint memerlukan `Authorization: Bearer CRON_SECRET` header.

Vercel otomatis mengirim header ini jika env var `CRON_SECRET` terpasang.

---

## 13. Upload Konten

### 13.1 Via Dashboard

1. Buka `https://your-app.vercel.app`
2. Login dengan email yang terdaftar
3. Klik salah satu fanpage
4. Klik **"Upload Images"**
5. Pilih gambar (max 100 per batch)
6. Caption akan di-generate otomatis oleh AI
7. Klik **"Save All"**

### 13.2 Flow Upload

```
Upload Gambar → Generate Caption (Groq) → Upload ke Cloudinary → Simpan ke Supabase
```

---

## 14. Troubleshooting

### Post Tidak Muncul di Feed

**Penyebab**: Facebook App masih dalam mode Development.

**Solusi**: Publish app di Facebook Developers → Settings → Basic → Publish.

---

### Error "No access token"

**Penyebab**: Token belum disimpan di Supabase.

**Solusi**: 
```sql
UPDATE pages SET access_token = 'TOKEN' WHERE id = 'FP_1';
```

---

### Error "Rate Limit" dari Groq

**Penyebab**: Terlalu banyak request ke Groq API.

**Solusi**: 
1. Tambahkan `GROQ_API_KEY_2` sebagai backup
2. Kurangi jumlah upload per batch

---

### Cron Tidak Berjalan

**Penyebab**: 
1. `CRON_SECRET` tidak terpasang di Vercel
2. Vercel Pro plan required untuk custom cron

**Solusi**:
1. Pastikan env var `CRON_SECRET` terpasang
2. Cek Vercel plan (Hobby plan: max 2 cron jobs)

---

### Token Expired

**Gejala**: Error `OAuthException` atau `Error validating access token`

**Solusi**: 
1. Generate token baru via Graph API Explorer
2. Atau gunakan System User token (never expires)

---

## 📝 Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `GROQ_API_KEY` | ✅ | Groq API key untuk caption |
| `GROQ_API_KEY_2` | ⭕ | Backup Groq API key |
| `CRON_SECRET` | ✅ | Secret untuk auth cron |
| `GEMINI_API_KEY` | ⭕ | Google Gemini API (optional) |

---

## 🔗 Links Penting

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- [Cloudinary Console](https://console.cloudinary.com)
- [Groq Console](https://console.groq.com)
- [Facebook Developers](https://developers.facebook.com)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Meta Business Suite](https://business.facebook.com)

---

*Dokumentasi terakhir diperbarui: 25 Januari 2026*
