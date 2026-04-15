[README.md](https://github.com/user-attachments/files/26734638/README.md)
# UGR StormTarget Pro — Deployment Guide

## What This Is
A PIN-protected Progressive Web App (PWA) for storm restoration targeting.
Runs on your phone like a native app. No App Store needed.

---

## Step 1 — Change Your PINs (IMPORTANT — Do This First)

Open `src/PinLock.jsx` and find this line at the top:

```js
const VALID_PINS = ['1234', '5678']
```

Change `1234` to your PIN and `5678` to your partner's PIN.
Use any 4-digit numbers you want. Save the file.

---

## Step 2 — Deploy to Vercel (Free, Takes 2 Minutes)

### Option A — Drag and Drop (Easiest)
1. Go to **vercel.com** → Sign up with GitHub (free)
2. Click **"Add New Project"**
3. Drag this entire `ugr-app` folder into Vercel
4. Vercel auto-detects Vite → click **Deploy**
5. You get a live URL like `https://ugr-stormtarget.vercel.app`

### Option B — GitHub Deploy (Best for Updates)
1. Create a free GitHub account at github.com
2. Create a new repository called `ugr-app`
3. Upload all files from this folder to the repo
4. Go to vercel.com → Import from GitHub → Select your repo → Deploy
5. Any future changes you push to GitHub auto-redeploy

---

## Step 3 — Install on Your Phone

### iPhone (Safari Only — Chrome Won't Work for PWA)
1. Open Safari on your iPhone
2. Go to your Vercel URL
3. Tap the **Share button** (box with arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Name it "StormTarget" → tap Add
6. It appears on your home screen with the UGR icon

### Android (Chrome)
1. Open Chrome
2. Go to your Vercel URL
3. Tap the three dots menu → "Add to Home Screen"
4. Tap Add
5. Done — it's on your home screen

---

## Step 4 — Add Your Realtor.com API Key (One Time)

1. Go to **rapidapi.com** → Sign up free
2. Search **"realty-in-us"** → Subscribe to Basic (free — 500 searches/month)
3. Copy your API key
4. Open the app → tap **⚙ API** in the top right → paste your key → Save
5. Key is saved on your device — you only do this once per phone

---

## Features Summary

| Tab | What It Does |
|-----|-------------|
| 🧮 Calc | Job financial calculator — ACV, depreciation, deductible, your revenue |
| 📋 Supp | Supplement gap estimator — find missing line items on carrier estimates |
| 📄 Dec | AI reads declaration pages — auto-fills calculator |
| ⛈️ Storms | NOAA storm data — hail, wind, tornado events for NJ & PA |
| 🏘️ Search | Realtor.com property search filtered by age, price, year built |
| 📸 AI Roof | Camera analysis — estimates roof age and damage potential |

---

## Security

- PIN lock with 12-hour session (auto-locks after 12 hours)
- 5 failed attempts triggers 30-second lockout
- API key stored locally on each device
- No data sent to any server except the APIs you use

---

## Updating the App

If you ever want to change the PINs or add features:
1. Edit the files
2. Push to GitHub (if using Option B)
3. Vercel auto-redeploys in ~60 seconds
4. Refresh the app on your phone

---

## Cost Summary

| Item | Cost |
|------|------|
| Vercel hosting | Free forever |
| Storm data (NOAA) | Free forever |
| AI features | Free (built into app) |
| Property search | Free (500/month RapidAPI) |
| Custom domain (optional) | ~$12/year |
| **Total to start** | **$0** |
