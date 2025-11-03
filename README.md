# 🎯 ResumeMatch Pro - AI-Powered Resume Tailoring

ResumeMatch Pro is a Chrome extension and web application that automatically tailors your resume for job applications, optimizes for ATS (Applicant Tracking System), and provides real-time matching scores.

## ✨ Features

- **🤖 AI-Powered Resume Tailoring**: Uses Google Gemini API to intelligently tailor your resume for each job
- **📊 ATS Optimization**: Get real-time ATS compatibility scores and actionable improvement suggestions
- **🔄 Resume Parsing**: Automatically parse and extract resume content from DOCX files
- **📥 One-Click Download**: Generate and download professionally formatted DOCX resumes
- **📋 Application Tracking**: Track all your applications with status updates and match scores
- **🎨 Dark Mode Support**: Beautiful interface with full dark mode support
- **💾 Cloud Sync**: Sync your resume across devices using MongoDB
- **🔌 Chrome Extension**: Inject a button on job posting pages to quickly extract job descriptions

## 🏗️ Tech Stack

- **Frontend**: React 18 + React Router 6 (SPA) + TypeScript + Vite
- **Styling**: Tailwind CSS 3 + Radix UI components
- **AI**: Google Gemini API for resume analysis and tailoring
- **Database**: MongoDB Atlas with Realm Web SDK
- **Document Generation**: docx.js for professional DOCX creation
- **Resume Parsing**: mammoth.js for DOCX parsing
- **Chrome Extension**: Manifest V3 with content scripts and background service worker
- **Backend**: Express.js (optional API endpoints)

## 📦 Installation

### Prerequisites

- Node.js 16+ and pnpm
- Chrome browser
- Google Gemini API key (free tier available)
- MongoDB Atlas account (free tier available)

### Setup Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd resumematch-pro
   pnpm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   # Google Gemini API (get from https://makersuite.google.com/app/apikey)
   VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key

   # MongoDB Atlas (optional, for cloud storage)
   VITE_MONGODB_REALM_APP_ID=your_mongodb_realm_app_id

   # Development API URL
   VITE_API_URL=http://localhost:8080/api
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:8080` in your browser

4. **Build for Production**
   ```bash
   pnpm build
   ```

5. **Build Chrome Extension** (optional)
   ```bash
   pnpm build:extension
   ```

## 🚀 Usage

### Web Application

1. **Upload Master Resume**
   - Navigate to `/upload`
   - Upload your resume as a DOCX file
   - The app parses and stores your resume

2. **Tailor Resume**
   - Find a job posting
   - Navigate to `/upload`
   - Input the job description or URL
   - Click "Tailor Resume"
   - Review ATS score and matches
   - Download the tailored resume

3. **Track Applications**
   - Navigate to `/history`
   - View all your applications
   - Filter by status (Applied, Interview, Offer, Rejected)
   - Export history as CSV

### Chrome Extension

1. **Install Extension**
   - Build the extension: `pnpm build:extension`
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/extension` folder

2. **Use Extension**
   - Navigate to a job posting (LinkedIn, Indeed, Naukri, etc.)
   - Click the "📄 Match & Download Resume" button
   - The extension extracts the job description
   - Click "Tailor Resume" to get AI suggestions
   - Download the optimized resume with one click

## 📁 Project Structure

```
resumematch-pro/
├── client/
│   ├── components/          # React components
│   │   ├── ResumeUpload.tsx
│   │   ├── ATSScore.tsx
│   │   └── ApplicationList.tsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── UploadResume.tsx
│   │   └── History.tsx
│   ├── services/            # API integrations
│   │   ├── mongodb.ts
│   │   ├── gemini.ts
│   │   ├── resumeParser.ts
│   │   └── resumeGenerator.ts
│   ├── utils/               # Utility functions
│   │   ├── jobExtractor.ts
│   │   ├── atsOptimizer.ts
│   │   └── storage.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── extension/           # Chrome extension files
│   │   ├── content.ts       # Content script
│   │   ├── background.ts    # Service worker
│   │   ├── popup.ts         # Popup logic
│   │   └── popup.html       # Popup UI
│   ├── App.tsx              # Main app component
│   └��─ global.css           # Global styles
├── server/
│   ├── index.ts             # Express server
│   └── routes/              # API routes
├── public/
│   └── manifest.json        # Chrome extension manifest
├── shared/
│   └── api.ts               # Shared API types
├── vite.config.ts           # Web app config
├── vite.config.extension.ts # Extension config
├── vite.config.server.ts    # Server build config
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
└── README.md               # This file
```

## 🔌 API Integrations

### Google Gemini API

Used for:
- Extracting job requirements from job descriptions
- Tailoring resume content for specific jobs
- Calculating ATS scores
- Generating improvement suggestions

**Setup:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local` as `VITE_GOOGLE_GEMINI_API_KEY`

**Rate Limits:** 60 requests per minute (free tier)

### MongoDB Atlas

Used for:
- Storing user master resumes
- Tracking application history
- Storing tailored resumes

**Setup:**
1. Create [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Set up Realm Web SDK
4. Add App ID to `.env.local` as `VITE_MONGODB_REALM_APP_ID`

## 🛠️ Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build web app for production
pnpm build

# Build Chrome extension
pnpm build:extension

# Run tests
pnpm test

# Type check
pnpm typecheck

# Format code
pnpm format.fix
```

### Adding New Features

1. **Add a new page**: Create a component in `client/pages/`
2. **Add a new service**: Create in `client/services/`
3. **Add utilities**: Create in `client/utils/`
4. **Update types**: Modify `client/types/index.ts`

## 📊 Key Algorithms

### ATS Score Calculation

- Contact Information: 10 points
- Professional Summary: 5 points
- Skills Section: 15 points
- Experience: 30 points
- Education: 15 points
- Keyword Matching: 25 points

**Total: 100 points**

### Resume Tailoring

1. Extract job requirements using Gemini API
2. Analyze master resume content
3. Match skills with job requirements
4. Rewrite experience descriptions to highlight relevant achievements
5. Add missing keywords naturally
6. Maintain professional formatting

### Job Description Extraction

Supports multiple job sites:
- LinkedIn
- Indeed
- Naukri
- Monster
- Glassdoor

Uses DOM parsing with fallback to Gemini API for complex layouts.

## 🔒 Security & Privacy

- **Local Storage**: Master resume stored locally in Chrome storage (not synced by default)
- **API Keys**: Stored in Chrome secure storage, never exposed to servers
- **HTTPS Only**: All external API calls use HTTPS
- **No Tracking**: No analytics or tracking pixels
- **Data Encryption**: Optional MongoDB storage with encryption

## 📈 Performance Tips

1. Keep your master resume updated
2. Use clear section headers in your resume
3. Include quantifiable achievements
4. Add relevant keywords from job descriptions
5. Review ATS score recommendations

## 🚀 Deployment

### Web App

**Netlify:**
```bash
pnpm build
# Upload dist/spa to Netlify
```

**Vercel:**
```bash
pnpm build
# Deploy with Vercel CLI
```

### Chrome Extension

1. Build: `pnpm build:extension`
2. Create ZIP of `dist/extension`
3. Submit to [Chrome Web Store](https://developer.chrome.com/docs/webstore/)

## 🐛 Troubleshooting

### "API key not configured"
- Check `.env.local` has `VITE_GOOGLE_GEMINI_API_KEY`
- Ensure key is valid and not expired
- Check rate limits haven't been exceeded

### "MongoDB connection failed"
- Verify `VITE_MONGODB_REALM_APP_ID` is correct
- Check MongoDB Atlas network access settings
- Ensure app is deployed on allowed domain

### Extension not injecting button
- Check manifest permissions in Chrome DevTools
- Verify content script matches job site domains
- Try refreshing the job posting page

### Resume parsing errors
- Ensure DOCX file is valid and not corrupted
- Try re-saving with Word or LibreOffice
- Check for special characters or unusual formatting

## 📝 Notes

- Gemini API has a free tier with 60 requests/minute
- MongoDB Atlas free tier includes 512MB storage
- Chrome extension development requires Developer Mode enabled
- Tests are run with Vitest
- Code follows TypeScript strict mode

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial use.

## 🆘 Support

For issues and questions:
1. Check the [troubleshooting section](#-troubleshooting)
2. Review [Google Gemini documentation](https://ai.google.dev/)
3. Check [MongoDB documentation](https://docs.mongodb.com/)
4. Open an issue on GitHub

---

Built with ❤️ using React, TypeScript, and AI
