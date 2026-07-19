# IP Intelligence Lookup & OSINT Investigation Tool

> Real-time IP & Domain intelligence, threat detection, and automated OSINT investigations built for the cybersecurity community by **weanonymous.in**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tools.bugwrite.com-lime?style=for-the-badge&logo=vercel)](https://tools.bugwrite.com)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## Overview

**IP Intelligence Lookup** is a zero-friction, privacy-first cybersecurity tool that provides instant network visibility for any IP address or domain name. Designed with a sleek dark aesthetic (`#080808` background & `#111111` elevated cards), it features real-time geolocation, ISP and ASN inspection, threat flag detection (VPN/Proxy/Datacenter/Mobile), and an interactive dark-themed map.

Our newest addition is the **OSINT Investigation Tool** (`/investigate`), which acts as an automated cyber intelligence analyst. By inputting an IP, Domain, Email, or Username, the tool automatically routes your query through 6 specialized APIs, correlates the findings, and leverages NVIDIA NIM (LLaMA 3.1 70B) to write a professional executive summary of the target's risk profile.

### Live Application
- **Main Tool**: [https://tools.bugwrite.com](https://tools.bugwrite.com)
- **Deep Investigation**: [https://tools.bugwrite.com/investigate](https://tools.bugwrite.com/investigate)
- **About Tool**: [https://tools.bugwrite.com/about](https://tools.bugwrite.com/about)
- **Terms & Policies**: [https://tools.bugwrite.com/terms](https://tools.bugwrite.com/terms)

---

## Key Features

- **Automated OSINT Investigation (/investigate)**
  - Auto-detects input type (Email, IP, Domain, Username).
  - Fetches data from 6 simultaneous OSINT APIs (IP Geo, Reputation, DNS, Reverse DNS, Email Breach, Username lookup, Shodan).
  - **Correlation Engine**: Automatically connects the dots between IPs, domains, MX records, and breach data to build an interconnected relationship graph.
  - **AI Executive Report**: Streams a real-time, professional investigation report powered by NVIDIA NIM (LLaMA 3.1 70B), complete with risk scoring.
- **Dual Mode Intelligence (IP & Domain)**
  - **IP Search**: Geolocation, ISP, ASN, Timezone, City, Country, ZIP & Currency.
  - **Domain Search**: Automatic domain name resolution (`google.com` -> `142.251.10.100`), Reverse DNS hostname inspection, and registered Organization details.
- **Instant Threat Flags**
  - Detects **Proxy / VPN** exit nodes.
  - Highlights **Hosting / Datacenter** ranges.
  - Flags **Mobile Connection** network endpoints.
- **Interactive Dark Map**
  - Powered by **Leaflet.js** and **CartoDB Dark Matter** tiles.
  - Available on both the standard lookup dashboard and the deep investigation report.
  - Custom animated glowing marker pin indicating target coordinates.
- **Dark & Light Theme System**
  - Dark mode by default (`#080808` / `#111111`) with smooth theme toggle.
  - High-contrast typography optimized for security analysts.
- **Stateless Serverless Proxy & RAM Caching**
  - Prevents CORS / HTTPS mixed-content issues.
  - Auto-extracts real caller IP via `x-forwarded-for` headers for "Check my own IP".
  - In-memory 5-minute TTL cache to respect upstream rate limits.
- **Fully Responsive & SEO Optimized**
  - Built with Next.js 16 App Router, OpenGraph cards, and semantic HTML structure.

---

## Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) | Serverless React framework with TypeScript |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe code base |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + Vanilla CSS Tokens | Design system with custom dark mode variables |
| **Mapping** | [Leaflet.js](https://leafletjs.com/) + OpenStreetMap | Interactive dark-themed map canvas |
| **Data Provider** | [ip-api.com](https://ip-api.com) + 6 OSINT APIs | Real-time IP geolocation & threat intelligence |
| **AI Engine** | [NVIDIA NIM](https://build.nvidia.com) | Streaming LLaMA 3.1 70B AI investigation reports |
| **Deployment** | [Vercel](https://vercel.com) | Edge-optimized serverless hosting |

---

## Project Structure

```
ip-lookup/
├── app/
│   ├── about/
│   │   └── page.tsx           # /about page (Mission, Features, Privacy)
│   ├── terms/
│   │   └── page.tsx           # /terms page (Terms of Service, Privacy Policy)
│   ├── investigate/
│   │   └── page.tsx           # Automated OSINT investigation UI with AI streaming
│   ├── api/
│   │   ├── lookup/            # Basic IP/Domain intelligence proxy
│   │   └── investigate/       # 6 OSINT API routes & AI report generation route
│   ├── globals.css            # Core design system & theme variables (#080808 / #111111)
│   ├── layout.tsx             # Root layout, metadata, SEO, & Leaflet CSS injection
│   └── page.tsx               # Main IP & Domain lookup application
├── components/
│   ├── IPMap.tsx              # Dynamically imported Leaflet map component
│   ├── ResultCard.tsx         # Data grid card component
│   ├── ThemeToggle.tsx        # Persistent theme switcher (Dark / Light)
│   └── ThreatBadges.tsx       # Threat flag indicator badges
├── lib/
│   ├── correlationEngine.ts   # Connects IPs, Domains, and Emails into a node graph
│   └── reportGenerator.ts     # Structures investigation findings for AI consumption
├── public/                    # Static assets & icons
├── package.json               # Dependencies & build scripts
└── tsconfig.json              # TypeScript configuration
```

---

## Getting Started Locally

### Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm** or **pnpm** or **yarn**
- **NVIDIA NIM API Key** (for AI Reports)

### 1. Clone the repository
```bash
git clone https://github.com/weanonymous01/ip-lookup.git
cd ip-lookup
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your NVIDIA API key:
```env
NVIDIA_NIM_API_KEY=your_nvidia_api_key_here
```

### 3. Install dependencies
```bash
npm install
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Build & Deployment

### Build for Production
To test the production build locally:
```bash
npm run build
npm run start
```

### Deploying on Vercel
1. Push your repository to GitHub.
2. Import the project on [Vercel Dashboard](https://vercel.com/new).
3. Under **Environment Variables**, add `NVIDIA_NIM_API_KEY`.
4. Vercel will automatically detect Next.js and build the project.
5. Add your custom domain under **Vercel Project Settings -> Domains**.

---

## Privacy & Security Policy

- **Stateless Proxying**: We do not store, log, or track searched IP addresses or domain queries.
- **No User Tracking**: No cookies, session tracking, or external analytics scripts are used.
- **Fair Use**: API endpoints include built-in rate-limiting protection to ensure continuous service availability.

---

## Community & Credits

Built for the cybersecurity community by **[weanonymous.in](https://weanonymous.in)**.
