# IP Intelligence Lookup 🔍

> Real-time IP & Domain intelligence, threat detection, and interactive network mapping built for the cybersecurity community by **weanonymous.in**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tools.bugwrite.com-lime?style=for-the-badge&logo=vercel)](https://tools.bugwrite.com)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 🌟 Overview

**IP Intelligence Lookup** is a zero-friction, privacy-first cybersecurity tool that provides instant network visibility for any IP address or domain name. Designed with a sleek dark aesthetic (`#080808` background & `#111111` elevated cards), it features real-time geolocation, ISP and ASN inspection, threat flag detection (VPN/Proxy/Datacenter/Mobile), and an interactive dark-themed map.

### 🌐 Live Application
- **Main Tool**: [https://tools.bugwrite.com](https://tools.bugwrite.com)
- **About Tool**: [https://tools.bugwrite.com/about](https://tools.bugwrite.com/about)
- **Terms & Policies**: [https://tools.bugwrite.com/about/terms](https://tools.bugwrite.com/terms)

---

## ✨ Key Features

- 🎯 **Dual Mode Intelligence (IP & Domain)**
  - **IP Search**: Geolocation, ISP, ASN, Timezone, City, Country, ZIP & Currency.
  - **Domain Search**: Automatic domain name resolution (`google.com` → `142.251.10.100`), Reverse DNS hostname inspection, and registered Organization details.
- 🛡️ **Instant Threat Flags**
  - Detects **Proxy / VPN** exit nodes.
  - Highlights **Hosting / Datacenter** ranges.
  - Flags **Mobile Connection** network endpoints.
- 🗺️ **Interactive Dark Map**
  - Powered by **Leaflet.js** and **CartoDB Dark Matter** tiles.
  - Custom animated glowing marker pin indicating target coordinates.
- 🌓 **Dark & Light Theme System**
  - Dark mode by default (`#080808` / `#111111`) with smooth theme toggle.
  - High-contrast typography optimized for security analysts.
- ⚡ **Stateless Serverless Proxy & RAM Caching**
  - Prevents CORS / HTTPS mixed-content issues.
  - Auto-extracts real caller IP via `x-forwarded-for` headers for "Check my own IP".
  - In-memory 5-minute TTL cache to respect upstream rate limits.
- 📱 **Fully Responsive & SEO Optimized**
  - Built with Next.js 16 App Router, OpenGraph cards, and semantic HTML structure.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) | Serverless React framework with TypeScript |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe code base |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + Vanilla CSS Tokens | Design system with custom dark mode variables |
| **Mapping** | [Leaflet.js](https://leafletjs.com/) + OpenStreetMap | Interactive dark-themed map canvas |
| **Data Provider** | [ip-api.com](https://ip-api.com) | Real-time IP geolocation & threat intelligence |
| **Deployment** | [Vercel](https://vercel.com) | Edge-optimized serverless hosting |

---

## 📁 Project Structure

```
ip-lookup/
├── app/
│   ├── about/
│   │   └── page.tsx           # /about page (Mission, Features, Privacy)
│   ├── terms/
│   │   └── page.tsx           # /terms page (Terms of Service, Privacy Policy)
│   ├── api/
│   │   └── lookup/
│   │       └── route.ts       # Serverless proxy route with header extraction & caching
│   ├── globals.css            # Core design system & theme variables (#080808 / #111111)
│   ├── layout.tsx             # Root layout, metadata, SEO, & Leaflet CSS injection
│   └── page.tsx               # Main IP & Domain lookup application
├── components/
│   ├── IPMap.tsx              # Dynamically imported Leaflet map component
│   ├── ResultCard.tsx         # Data grid card component
│   ├── ThemeToggle.tsx        # Persistent theme switcher (Dark / Light)
│   └── ThreatBadges.tsx       # Threat flag indicator badges
├── public/                    # Static assets & icons
├── package.json               # Dependencies & build scripts
└── tsconfig.json              # TypeScript configuration
```

---

## ⚡ Getting Started Locally

### Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm** or **pnpm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/weanonymous01/ip-lookup.git
cd ip-lookup
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Build & Deployment

### Build for Production
To test the production build locally:
```bash
npm run build
npm run start
```

### Deploying on Vercel
1. Push your repository to GitHub.
2. Import the project on [Vercel Dashboard](https://vercel.com/new).
3. Vercel will automatically detect Next.js and build the project.
4. Add your custom domain under **Vercel Project Settings → Domains**.

---

## 🔒 Privacy & Security Policy

- **Stateless Proxying**: We do not store, log, or track searched IP addresses or domain queries.
- **No User Tracking**: No cookies, session tracking, or external analytics scripts are used.
- **Fair Use**: API endpoints include built-in rate-limiting protection to ensure continuous service availability.

---

## 🤝 Community & Credits

Built with ❤️ for the cybersecurity community by **[weanonymous.in](https://weanonymous.in)**.
