# 💪 RepMax Tracker

> Track your bodyweight max reps daily — push-ups, pull-ups, sit-ups, and squats — with Duolingo-style streaks, XP, and progress charts.

![RepMax Tracker](https://img.shields.io/badge/PWA-Ready-22C55E?style=for-the-badge)
![No Build Required](https://img.shields.io/badge/No_Build-Required-3B82F6?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-A855F7?style=for-the-badge)

---

## 🤔 What is RepMax Tracker?

**RepMax Tracker** is a gamified bodyweight fitness tracker that turns your daily exercise habit into a progression game. Every day you log your max reps for four exercises — push-ups, pull-ups, sit-ups, and squats — and the app rewards you with XP, levels, streaks, and achievement badges.

There is **no account or sign-up required** for the core app: everything runs directly in your browser and your data is saved locally on your device. You can optionally connect the included backend to enable cloud sync and authentication across devices.

**How to open the app:**
- **Quickest way:** Download `index.html` and open it directly in any modern web browser (Chrome, Firefox, Safari, Edge).
- **Hosted version:** Deploy to GitHub Pages (see the deployment section below) and visit the URL — no installation needed.
- **With backend:** Start the backend server (`cd backend && npm install && npm start`), then open `index.html` in your browser.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔥 **Daily Streaks** | Consecutive day tracking — don't break the chain! |
| ⚡ **XP & Levels** | Earn XP every session. Beat PRs for bonus points. |
| 🏆 **12 Achievements** | Unlock badges as you hit milestones |
| 📈 **Progress Charts** | Line charts showing your rep growth over time |
| 💾 **Local Storage** | Data persists between sessions, no account needed |
| 🔔 **Daily Notifications** | Browser notifications to remind you each day |
| 📱 **PWA Installable** | Add to home screen on iOS/Android |
| 🌙 **Dark Mode** | Easy on the eyes, all the time |

---

## 🚀 Deploy to GitHub Pages (3 steps)

### Option A — Drag & Drop (Easiest)

1. Create a new GitHub repository
2. Upload `index.html` to the root of the repo
3. Go to **Settings → Pages → Source → Deploy from branch → main → / (root)**
4. Click **Save** — your app is live at `https://yourusername.github.io/your-repo-name`

### Option B — GitHub CLI

```bash
# 1. Create and clone your repo
gh repo create repmax-tracker --public
git clone https://github.com/yourusername/repmax-tracker
cd repmax-tracker

# 2. Copy index.html into the folder
cp /path/to/index.html .

# 3. Push
git add index.html
git commit -m "🚀 Initial commit"
git push origin main

# 4. Enable GitHub Pages
gh api repos/yourusername/repmax-tracker/pages \
  --method POST \
  -f source[branch]=main \
  -f source[path]=/
```

### Option C — GitHub Actions (Auto-deploy on push)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 📱 Install as a Mobile App (PWA)

### iOS (Safari)
1. Open your GitHub Pages URL in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Done — it works like a native app!

### Android (Chrome)
1. Open your GitHub Pages URL in Chrome
2. Tap the **⋮ menu** → **Add to Home Screen**

---

## 🎮 Gamification System

### XP Breakdown
| Action | XP Earned |
|---|---|
| Completing a session | +100 XP |
| Beating a PR (per exercise) | +30 XP each |
| Active streak bonus | +25 XP |

### Level Thresholds
| Level | XP Required |
|---|---|
| 1 | 0 |
| 2 | 500 |
| 3 | 1,200 |
| 4 | 2,000 |
| 5 | 3,000 |
| 6 | 4,500 |
| 7+ | Scales up |

### Achievements
- **First Step** — Log your first session
- **On Fire** — 3-day streak
- **Week Warrior** — 7-day streak
- **Monthly Hero** — 30-day streak
- **Half Century** — 50 push-ups in one session
- **Iron Arms** — 20 pull-ups in one session
- **Core King** — 100 sit-ups in one session
- **Leg Legend** — 100 squats in one session
- **Century Club** — 100 push-ups in one session
- **Consistent** — 10 logged sessions
- **Dedicated** — 30 logged sessions
- **Legend** — 100 logged sessions

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI rendering |
| **Recharts** | Progress charts |
| **Babel Standalone** | JSX in browser (no build) |
| **LocalStorage API** | Data persistence |
| **Notifications API** | Daily reminders |

> No build tools, no node_modules, no package.json required.

---

## 🔧 Customization

Open `index.html` and find these sections to customize:

**Change exercises** — Edit the `EXES` array:
```js
const EXES = [
  { id:"pushups", label:"Push Ups", ... },
  // Add or remove exercises here
];
```

**Adjust XP values** — Edit the `handleLog` function:
```js
let xp = 100;           // Base XP per session
xp += 30;               // Bonus per new PR
xp += 25;               // Streak bonus
```

**Add achievements** — Extend the `ACHS` array:
```js
{ id:"new_ach", label:"My Achievement", desc:"...", Icon:Ic.Star, xp:200,
  check:(logs, streak) => logs.some(l => l.pushups >= 75) }
```

---

## 📄 License

MIT — use it, fork it, make it yours.

---

*Made with React. Deployed with GitHub Pages. No excuses — just reps.*
