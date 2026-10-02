# 🧠 DailyBrain

> **Five minutes. One brain. Every day.**

A premium-feeling daily puzzle website — **Daily Word**, **Daily Number** and **Daily Trivia** — built as **one self-contained `index.html`** (HTML + CSS + vanilla JS, zero frameworks, zero external images). Every puzzle is deterministic by date, so the whole world plays the same puzzle each day.

| File | Purpose |
|---|---|
| `index.html` | The entire application (~170 KB, single file) |
| `sitemap.xml` | Ready-to-serve sitemap (replace `dailybrain.example` with your domain) |
| `robots.txt` | Ready-to-serve robots file (replace domain) |
| `ads.txt` | AdSense seller declaration (replace `pub-XXXXXXXXXXXXXXXX`) |
| `vercel.json` | Security headers for Vercel |

---

## 🚀 Vercel deployment guide

### 1. Push to GitHub
This repository already contains everything. If starting fresh:
```bash
git init && git add . && git commit -m "DailyBrain v1"
git remote add origin https://github.com/YOU/dailybrain.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the GitHub repository.
3. Framework preset: **Other** — no build command, no output directory needed (it is a static site; Vercel serves `index.html` from the root automatically).
4. Click **Deploy**. You get `https://your-project.vercel.app` in ~20 seconds.

### 3. Custom domain
1. Vercel dashboard → your project → **Settings → Domains → Add**.
2. Enter `dailybrain.yourdomain.com` (or an apex domain) and follow the DNS instructions (CNAME to `cname.vercel-dns.com`, or A record `76.76.21.21`).
3. HTTPS is provisioned automatically.
4. **Find & replace** `dailybrain.example` with your real domain in `index.html` (3 meta/JSON-LD spots + share text), `sitemap.xml` and `robots.txt`.

### 4. Google Search Console
1. Open [search.google.com/search-console](https://search.google.com/search-console) → **Add property** → Domain.
2. Verify via the DNS TXT record (your registrar or Vercel DNS).
3. Submit `https://yourdomain.com/sitemap.xml` under **Sitemaps**.
4. Request indexing of the homepage via **URL Inspection**.

### 5. Apply for Google AdSense
1. Sign up at [adsense.google.com](https://adsense.google.com) with your live domain (sites typically need to be live with real content — this site ships with 2,500+ words of original articles, policies and FAQs for that reason).
2. Once approved, copy your publisher ID (`ca-pub-1234…`).
3. Replace **every** `ca-pub-XXXXXXXXXXXXXXXX` in `index.html` and `pub-XXXXXXXXXXXXXXXX` in `ads.txt`.
4. Create 4 display ad units in AdSense and replace the four `data-ad-slot="XXXXXXXXXX"` values.
5. Redeploy (`git push` — Vercel auto-deploys). Ads load **only after a visitor clicks "Accept"** on the consent banner.

---

## ✅ Final self-review checklist

### Brand & Spark
- [x] Name "DailyBrain", tagline "Five minutes. One brain. Every day." in hero tag, share card & meta
- [x] Spark neuron-orb in inline SVG: glowing core + 7 synapse lines ending in dots — no images
- [x] Spark lives in header logo, home hero (160 px), streak strip, footer, and all three result screens
- [x] Streak evolution: Day 0 dim grey-violet slow pulse → 1–2 violet + 2 rings → 3–6 mint + 3 rings + twinkling dots → 7–13 amber orbit sparks → 14–29 double orbit + brighter bloom → 30+ Supernova rotating halo with star particles
- [x] Reactions: win = core pulse + synapse flash; loss = wobble + desaturated dimming (motion only, no eyes)
- [x] `prefers-reduced-motion` ⇒ all Spark/route/confetti animation disabled, static glow remains

### Design system
- [x] Full dark + light themes via CSS variables with the exact specified palette; default dark, follows system, manual override in Settings
- [x] Space Grotesk (headings/tiles) + Inter (body) with `ui-sans-serif, system-ui` fallbacks, fluid `clamp()` sizes
- [x] Glassmorphism cards (blur, 1 px translucent border, inner highlight, 20 px radius, layered shadows)
- [x] Dotted-grid background, scroll-following radial violet glow, film grain via inline SVG `feTurbulence`
- [x] 8 px spacing scale; 560 px game width / 1100 px home width; pill gradient buttons, scale(.97) press, 3 px mint focus rings

### Micro-interactions
- [x] 3D sequential tile flips (80 ms stagger), mint inner glow on correct tiles
- [x] Invalid word ⇒ row shake + "Not in word list" toast
- [x] Win ⇒ Spark pulse + canvas confetti of 60 neuron dots/synapse lines with auto-cleanup + count-up score
- [x] Springy keyboard keys with smooth recolor; haptics (`navigator.vibrate`) toggleable; WebAudio blips OFF by default, toggleable
- [x] 180 ms fade + 8 px slide route transitions; 250 ms skeleton shimmer on first game open
- [x] Streak flame badge bounces on increase; countdown uses tabular numbers + thin SVG progress ring

### Games (all seeded with mulberry32 from local YYYY-MM-DD)
- [x] **Word**: 400 answers + 3,975-word guess dictionary embedded as compact strings; correct duplicate-letter logic (verified by unit test); on-screen + physical keyboard; hard mode; colorblind blue/orange toggle; optional pre-finish first-letter hint, tracked in stats
- [x] **Number**: 5 numbers + target; generator builds target from the numbers via random valid ops ⇒ solvability guaranteed (unit-tested across 500 dates, zero fallbacks); tap-to-build UI with live preview, undo, clear; exact = 100, −5/distance otherwise; optimal solution revealed after finishing
- [x] **Trivia**: 150 original, fact-checked, family-friendly questions across science/geography/history/pop culture/nature; 5 per day via seeded shuffle; 15 s ring timer; instant feedback + "Did you know?" facts; ranks Rookie/Thinker/Sharp Mind/Genius
- [x] **Stats**: 12-week GitHub-style heat map, current/best streak, win rate, animated guess-distribution bars, total solved, Daily Trio badge

### Home page
- [x] Hero with large Spark, "Wake your brain up.", subline, primary CTA + live countdown
- [x] Three glass game cards with CSS-built preview art, hover lift, live status chips ("Play now"/"Done ✓ 3/6")
- [x] Streak strip with Spark stage + "N more days to unlock …" copy; Why DailyBrain (3 SVG icons); How it works; 6-question FAQ; footer with legal links + tiny Spark

### Sharing
- [x] 1080×1350 canvas share card: dark gradient, Spark at current stage, game name, date, grid/score, streak, site name
- [x] Web Share API with image file when supported, "Copy text", "Download image"; text format `DailyBrain Word #641 4/6 🔥12` + emoji grid (colorblind-aware 🟦🟧)

### Monetization
- [x] AdSense placeholders (`ca-pub-XXXXXXXXXXXXXXXX` / `data-ad-slot="XXXXXXXXXX"`): home ×2 (under hero, between sections), one per game page **below** the play area, one under results — never above/over gameplay
- [x] Each unit in a labelled "ADVERTISEMENT" card with 280 px reserved min-height (zero CLS), rounded corners, surface color
- [x] No pop-ups/interstitials/autoplay; AdSense script loads **only after consent**; Accept/Reject/Manage banner, choice stored in localStorage, revisitable via footer & Settings

### Content, SEO & PWA
- [x] Per-game: 250+ word how-to article, 150+ word tips section, 5-question FAQ — original and genuinely helpful
- [x] About, Contact (form + mailto), Privacy Policy (cookies, ads, vendors, GDPR/CCPA rights), Terms, Cookie Policy
- [x] Per-route unique `<title>`, meta description, H1, OG + Twitter tags updated on hashchange, canonical tag; WebSite + FAQPage JSON-LD
- [x] `sitemap.xml`, `robots.txt`, `ads.txt` provided as separate files; inline SVG Spark favicon; `theme-color`; data-URI web app manifest (installable)

### Accessibility & performance
- [x] WCAG AA palette, full keyboard play, `aria-live` announcements for guesses/results/questions, semantic HTML, visible focus, reduced-motion + color-scheme respected
- [x] Every localStorage access wrapped in try/catch with in-memory fallback — fully playable with storage disabled
- [x] Single file ≈ 170 KB, zero external JS libraries
- [x] Edge cases: midnight rollover while open (1 s watcher re-initializes everything + toast), timezone changes, refresh-resume of half-finished games, strict one-play-per-day

---

## 🧪 Local development

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step. Edit `index.html`, refresh, done.
