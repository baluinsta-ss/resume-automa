# ResumeMatch Pro - Development & Troubleshooting Guide

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:8080)
pnpm dev

# In another terminal, start backend (optional)
cd /root/app/code
pnpm run build:server && pnpm start

# Run tests
pnpm test

# Type check
pnpm typecheck

# Build for production
pnpm build
```

---

## 🔴 Current Known Issues & Fixes

### Issue: "TypeError: Failed to fetch" in UploadResume
**Location**: `client/pages/UploadResume.tsx:45:23`  
**Cause**: Backend API endpoint not running or unreachable  
**Error Path**: 
```
UploadResume.handleUploadSuccess() 
  → saveResume() in mongodb.ts
  → fetch(/api/users/:id/resume)
  → FAILS (no server)
```

**Quick Fixes** (pick one):

#### Option 1: Make API calls optional (Recommended)
```typescript
// In client/pages/UploadResume.tsx
const handleUploadSuccess = async (uploadedResume: ResumeData) => {
  setIsLoading(true);
  
  try {
    const userId = `user_${Date.now()}`;
    await setUserId(userId);
    await setMasterResume(uploadedResume);
    
    // Try to save to API, but don't fail if it doesn't work
    try {
      await saveResume(userId, uploadedResume);
    } catch (apiError) {
      console.warn("API unavailable, using local storage", apiError);
    }
    
    setResume(uploadedResume);
  } catch (err) {
    setError("Failed to save resume. Please try again.");
    console.error("Error saving resume:", err);
  } finally {
    setIsLoading(false);
  }
};
```

#### Option 2: Disable API calls completely
```typescript
// In client/services/mongodb.ts
// Comment out or remove all fetch calls
export async function saveResume(userId: string, resume: ResumeData): Promise<ResumeData> {
  // Just return the resume, don't call API
  return resume;
}
```

#### Option 3: Start the backend server
```bash
# Build server
cd /root/app/code
pnpm run build:server

# Start it
pnpm start

# Now all API calls will work
```

---

## 🔧 Component Architecture Issues

### Component Communication Flow
```
App.tsx (router)
├── Dashboard.tsx
│   └── Calls: getMasterResume(), getApplicationHistory()
├── UploadResume.tsx
│   ├── Uses: ResumeUpload component
│   └── Calls: parseDocxFile(), saveResume(), setMasterResume()
└── History.tsx
    ├── Uses: ApplicationList component
    └── Calls: getApplicationHistory(), updateApplicationStatus()
```

### State Management Issues
- No Redux/Context - Using local storage + API
- Each page loads data independently
- No shared state between pages
- Solution: Consider Context API if complex state needed

---

## 📝 Common Modifications

### Change API Base URL
```typescript
// client/services/mongodb.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
// Update to your API URL
```

### Modify ATS Scoring Weights
```typescript
// client/utils/atsOptimizer.ts
// In calculateATSScore():
- Contact Information: 10 points (change here)
- Summary: 5 points (change here)
- Skills: 15 points (change here)
- Experience: 30 points (change here)
- Education: 15 points (change here)
- Keyword Matching: 25 points (change here)
```

### Add New Supported Job Sites
```typescript
// client/utils/jobExtractor.ts
// In extractJobDescriptionFromDOM():
// Add new site selectors in if-else chain
// Example:
const ziprecruiterTitle = document.querySelector("h1.job-title");
if (ziprecruiterTitle) {
  return {
    title: ziprecruiterTitle.textContent || "Unknown",
    // ...
  };
}
```

### Customize Resume Template
```typescript
// client/services/resumeGenerator.ts
// In generateResumeDocx():
// Modify Paragraph/TextRun properties for fonts, sizes, spacing
// Example:
new Paragraph({
  text: resume.contact.name,
  bold: true,
  size: 28,  // Change font size
  spacing: { after: 200 }  // Change spacing
})
```

### Update Theme Colors
```css
/* client/global.css */
:root {
  --primary: 262 80% 50%;      /* Change this */
  --secondary: 218 92% 50%;    /* Change this */
  --accent: 16 100% 60%;       /* Change this */
}
```

---

## 🐛 Debugging Techniques

### Enable Console Logging
```typescript
// Add to any function to trace execution
console.log("Starting function X", { input1, input2 });

// In services/mongodb.ts
export async function saveResume(userId: string, resume: ResumeData) {
  console.log("saveResume called with:", { userId, resumeLength: JSON.stringify(resume).length });
  try {
    const response = await fetch(`${API_URL}/users/${userId}/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume),
    });
    console.log("API response status:", response.status);
    if (!response.ok) throw new Error("Failed to save resume");
    const data = await response.json();
    console.log("Saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw error;
  }
}
```

### Check Browser Storage
```javascript
// In browser console
// View localStorage
localStorage.getItem("resumematch_user_id")
localStorage.getItem("resumematch_master_resume")

// View all stored data
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key));
});

// Clear storage
localStorage.clear()
```

### Network Debugging
```javascript
// In browser DevTools:
1. Open Network tab
2. Filter by "Fetch/XHR"
3. Look for failed requests
4. Check response status (200 = OK, 4xx = Client error, 5xx = Server error)
5. Check response body for error details
```

### React Component Debugging
```typescript
// Add useEffect logging
useEffect(() => {
  console.log("Component mounted with props:", { prop1, prop2 });
  return () => console.log("Component unmounted");
}, []);

// Log state changes
useEffect(() => {
  console.log("State changed:", { resume, isLoading, error });
}, [resume, isLoading, error]);
```

---

## 🔌 Integration Points

### Google Gemini API
```typescript
// Required: VITE_GOOGLE_GEMINI_API_KEY in .env.local
// Used in: client/services/gemini.ts
// Rate limit: 60 requests/minute (free tier)
// Cost: Free for testing

// To add new AI feature:
1. Create function in gemini.ts
2. Use GoogleGenerativeAI client
3. Create prompt template
4. Call model.generateContent(prompt)
5. Parse response
6. Return typed result
```

### Resume Parsing Library
```typescript
// Library: mammoth.js
// Used in: client/services/resumeParser.ts

// If parsing fails:
1. Try re-saving resume in Word
2. Check for unusual formatting
3. Enable debug logging in parseDocxFile()
4. Check mammoth.js documentation
```

### Document Generation Library
```typescript
// Library: docx.js
// Used in: client/services/resumeGenerator.ts

// If DOCX generation fails:
1. Check all required fields exist
2. Ensure all text is strings
3. Check docx.js documentation for Paragraph properties
4. Verify font names are valid
```

---

## 📊 State Management Pattern

### Current Pattern (localStorage + API)
```typescript
// 1. Load from localStorage
const resume = await getMasterResume();  // From Chrome/localStorage

// 2. Optionally sync with API
try {
  const fromApi = await getUserResume(userId);  // From backend
  if (fromApi) {
    await setMasterResume(fromApi);  // Update local
  }
} catch (e) {
  // Use local copy if API fails
}

// 3. Use local data
return resume;
```

### If You Want to Migrate to Context API
```typescript
// Create client/context/ResumeContext.tsx
import React, { createContext, useContext, useState } from "react";
import { ResumeData } from "@/types";

const ResumeContext = createContext<{
  resume: ResumeData | null;
  setResume: (resume: ResumeData) => void;
} | null>(null);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resume, setResume] = useState<ResumeData | null>(null);
  
  return (
    <ResumeContext.Provider value={{ resume, setResume }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) throw new Error("useResume must be used within ResumeProvider");
  return context;
}

// Usage in App.tsx
function App() {
  return (
    <ResumeProvider>
      <BrowserRouter>
        {/* routes */}
      </BrowserRouter>
    </ResumeProvider>
  );
}

// Usage in component
function MyComponent() {
  const { resume, setResume } = useResume();
  // ...
}
```

---

## 🎯 Performance Optimization Tips

### Lazy Load Heavy Components
```typescript
import { lazy, Suspense } from "react";

const UploadResume = lazy(() => import("./pages/UploadResume"));

// In router:
<Suspense fallback={<div>Loading...</div>}>
  <Route path="/upload" element={<UploadResume />} />
</Suspense>
```

### Memoize Components
```typescript
import { memo } from "react";

// Before
export const ApplicationList = ({ applications }: Props) => {
  // ...
};

// After
export const ApplicationList = memo(({ applications }: Props) => {
  // Only re-renders if applications prop changes
});
```

### Optimize API Calls
```typescript
// Don't call API on every render
// Use useEffect with dependency array
useEffect(() => {
  loadApplications();  // Called once on mount
}, []);  // Empty dependency = only on mount

// Cache API responses
const [cache, setCache] = useState<Map<string, any>>(new Map());
```

---

## 🔐 Security Checklist

- [ ] API keys not hardcoded (use .env)
- [ ] HTTPS enforced on production
- [ ] No sensitive data logged to console
- [ ] Input validation on resume upload
- [ ] API rate limiting implemented
- [ ] CORS properly configured
- [ ] No PII exposed in error messages
- [ ] Chrome extension permissions minimized

---

## 📋 Testing Checklist

### Manual Testing Steps
- [ ] Upload resume with various formats
- [ ] Extract job descriptions from major job sites
- [ ] Tailor resume for sample job
- [ ] Verify ATS score calculation
- [ ] Download tailored resume
- [ ] Track application status
- [ ] Export application history
- [ ] Test on mobile viewport
- [ ] Test dark mode
- [ ] Test error scenarios

### Browser Compatibility
- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+

---

## 💡 Tips for Claude/AI Assistants

When working with Claude on this project:

1. **Provide context**: Share relevant file paths and code snippets
2. **Be specific**: "Fix the fetch error in UploadResume.tsx" vs "Something's broken"
3. **Include error messages**: Full stack traces help AI understand issues
4. **Ask for explanations**: "Explain how the ATS scoring works"
5. **Request minimal changes**: "Add error handling to saveResume()" not "Rewrite the entire service"

### Example Prompt for Claude:
```
"In the file client/pages/UploadResume.tsx, the handleUploadSuccess function 
is calling saveResume() which makes an API call that fails with 'Failed to fetch'. 
The user has no backend server running. 

Can you modify the code to gracefully handle this error by:
1. Logging the error
2. Showing a user-friendly message
3. Still saving the resume to localStorage
4. Not blocking the user from continuing

Here's the current code: [paste code]"
```

---

## 🚦 Deployment Checklist

Before deploying to production:

- [ ] Set environment variables
- [ ] Build production bundle: `pnpm build`
- [ ] Test production build locally
- [ ] Configure CORS for API domain
- [ ] Set up HTTPS certificate
- [ ] Configure CDN if needed
- [ ] Set up error logging (Sentry, etc.)
- [ ] Set up analytics if needed
- [ ] Configure API rate limiting
- [ ] Backup database
- [ ] Create deployment runbook
- [ ] Set up monitoring/alerts

---

## 📞 When to Ask for Help

Escalate to human developer if:
- Need to set up production database
- Need to deploy to new infrastructure
- Need to configure CI/CD pipeline
- Security audit needed
- Performance optimization for 1000+ users
- Need to integrate with third-party service

---

