# ⚡ VectorForge — SVG Engineering Studio for Developers & Designers

> **Fast, privacy-first SVG toolkit where files are processed 100% locally in your browser.**
> *No file uploads. No server queues. No subscriptions.*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Framework: Astro](https://img.shields.io/badge/Astro-5.x-orange.svg)](https://astro.build)
[![UI: React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![Styling: TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com)
[![Privacy: Client--Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-10b981.svg)](#privacy--security-promise)

---

## 🌟 Core Features (7 MVP Tools)

1. **⚡ SVG Optimizer (SVGO Browser Engine):** Strip bloatware metadata, comments, unused IDs, and round coordinate precision with live percentage savings calculation (`-68%`).
2. **⚛️ SVG → React / JSX:** Convert raw SVG to production-ready React JSX or TypeScript (`.tsx`) components with proper `camelCase` attributes, `forwardRef`, and React Native support.
3. **💙 SVG → Flutter (Dart):** Generate null-safe Flutter widgets supporting `flutter_svg` (`SvgPicture.string`) and native `CustomPainter` canvas rendering.
4. **🍎 SVG → SwiftUI:** Export clean Swift 5/6 structs conforming to SwiftUI `View` and `Shape` protocols with dynamic light/dark mode support.
5. **🤖 SVG → Android VectorDrawable XML:** Convert SVG geometry and colors into valid Android Vector XML for `res/drawable/` and Jetpack Compose.
6. **🖼️ SVG → High-Resolution PNG:** Client-side HTML5 Canvas rasterization at 1x, 2x (Retina), 3x, 4x, and 8K Ultra HD with transparent or solid background.
7. **🌐 SVG → WebP:** Export next-generation WebP images with interactive quality slider (10% - 100%) and instant file size calculation.

---

## 🔒 Privacy & Security Promise

- **Zero Cloud Uploads:** All processing executes locally inside the client's browser memory via the HTML5 `FileReader` and `OffscreenCanvas` APIs.
- **XSS & Injection Protection:** Strict SVG sanitization pipeline strips `<script>`, inline event handlers (`onclick`, `onload`), and suspicious external entities before DOM rendering.
- **Enterprise Safe:** Safe for proprietary brand assets and unreleased UI designs.

---

## 📁 Project Architecture & Routes

```text
/
├── /                      -> Main Interactive Studio & Universal Workspace
├── /svg-optimizer         -> Dedicated SVG Optimizer & Minifier tool
├── /svg-to-react          -> Dedicated SVG to React / TSX converter
├── /svg-to-flutter        -> Dedicated SVG to Flutter Dart converter
├── /svg-to-swiftui        -> Dedicated SVG to SwiftUI Shape/View converter
├── /svg-to-android-vector -> Dedicated SVG to Android XML converter
├── /svg-to-png            -> Dedicated SVG to PNG rasterizer (1x-8x)
├── /svg-to-webp           -> Dedicated SVG to WebP modern image exporter
├── /docs                  -> Technical documentation & architecture guide
├── /sitemap-index.xml     -> Auto-generated SEO sitemap
└── /robots.txt            -> Search crawler instructions
```

---

## 🛠️ Tech Stack

- **SSG Framework:** [Astro 5](https://astro.build/) (Static-First for 100/100 Core Web Vitals)
- **Interactive UI:** React 19 + TypeScript
- **Icons:** Lucide React
- **Styling:** Tailwind CSS v4
- **SVG Engine:** SVGO (Browser bundle)
- **Testing:** Vitest + JSDOM

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```

### 3. Start Local Dev Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

### 4. Build Production Static Assets
```bash
npm run build
```
The output will be generated inside the `/dist` folder.

---

## 🌐 Deployment Instructions

### Deploy to Cloudflare Pages (Recommended - 100% Free with Unlimited Bandwidth)
1. Link your GitHub repository to Cloudflare Pages.
2. Build Settings:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment Variables:** `NODE_VERSION=22`

### Deploy to Vercel
1. Import your GitHub repository in the Vercel dashboard.
2. Framework preset will automatically detect `Astro`.
3. Click **Deploy**.

---

## 📄 License

MIT License — Feel free to use in your personal, commercial, or enterprise workflows.
