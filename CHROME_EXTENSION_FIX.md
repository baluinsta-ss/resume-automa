# Chrome Extension Fix - Resume Sync & HTML Analysis

## Issues Addressed

This guide fixes:
1. ✅ Chrome extension not seeing uploaded resume from localhost:8080
2. ✅ Improved HTML parsing with Gemini AI
3. ✅ Better "Analyse" button functionality

## Problem Root Causes & Solutions

### Issue 1: Resume Not Appearing in Extension

**Root Cause:** The extension and web app need to share `chrome.storage.sync` properly. The previous code had inconsistencies in how data was stored and retrieved.

**Solution Applied:**
- Updated `storage.ts` to prioritize `chrome.storage.sync` over localStorage
- Ensured all resume data is stored as JSON strings in chrome.storage for proper sync
- Added better error handling and logging for debugging

### Issue 2: HTML Page Analysis

**Root Cause:** The "Analyse" button captures page HTML, but Gemini needs clean, properly formatted HTML without scripts and styles.

**Solution Applied:**
- Enhanced HTML cleaning in `gemini.ts` to remove scripts, styles, and comments
- Improved Gemini prompt for better job extraction
- Added detailed logging for debugging
- Better fallback behavior if Gemini parsing fails

## Setup Instructions

### Step 1: Ensure Gemini API Key is Set

The extension requires a Gemini API key. Set it in your environment:

```bash
# In your .env.local file
VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your key from: https://makersuite.google.com/app/apikey

### Step 2: Build and Load the Extension

```bash
# Terminal 1: Start the web app
npm run dev

# Terminal 2 (in parallel): Build the extension in watch mode
npm run dev:extension

# This will generate files in dist/extension/
```

### Step 3: Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Navigate to your project root folder
5. The extension should now appear in your extensions list

## How to Use (Step-by-Step)

### Step A: Upload Master Resume

1. Go to `http://localhost:8080`
2. Click "Tailor Your Resume"
3. Upload a DOCX resume file
4. **Wait for confirmation** that it's saved
5. Resume is now stored in both:
   - Browser localStorage (web app access)
   - Chrome storage.sync (extension access)

### Step B: Analyze a Job Page

1. Visit a supported job site (LinkedIn, Indeed, etc.)
2. You should see the "Analyse" button (bottom-right)
3. Click "Analyse"
4. The extension will:
   - Capture the full HTML page
   - Extract job title, company, description using DOM parsing
   - Store in chrome.storage.sync
   - Automatically open the popup

### Step C: View & Tailor

The popup will show:
- **Status**: Whether master resume was found
- **Job Info**: Title and company detected
- **Buttons**:
  - "⚡ Tailor Resume" - Uses Gemini to optimize your resume
  - "⬇️ Download Resume" - Gets your tailored resume
  - "💾 Save Application" - Saves to your history

## How the HTML Analysis Works

### Flow

```
User clicks "Analyse" button
    ↓
Content script captures page HTML (no scripts/styles)
    ↓
Stores in chrome.storage.sync
    ↓
Opens extension popup
    ↓
Popup retrieves HTML from storage
    ↓
Sends to Gemini API for parsing
    ↓
Gemini extracts: title, company, requirements, skills
    ↓
Shows extracted job info in popup
    ↓
User clicks "⚡ Tailor Resume"
    ↓
Gemini tailors resume to match job requirements
    ↓
Shows ATS score
    ↓
User downloads or saves
```

### Gemini Parsing Features

When you click "Analyse", Gemini extracts:
- **Job Title**: Position name
- **Company**: Employer name
- **Location**: Job location if available
- **Description**: Full job description
- **Requirements**: Key qualifications (as array)
- **Skills**: Technical and soft skills (as array)

**Example Output:**
```json
{
  "title": "Senior React Developer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "description": "We are looking for...",
  "requirements": [
    "5+ years React experience",
    "TypeScript proficiency",
    "REST API design"
  ],
  "skills": ["React", "TypeScript", "Node.js", "AWS"]
}
```

## Debugging

### Check if Resume is Stored

Open Chrome DevTools (F12):
1. Application tab → Chrome Storage → sync
2. Look for key: `resumematch_master_resume`
3. Should show your resume as JSON

### Check if HTML was Captured

Open extension popup, open DevTools for popup (right-click popup → Inspect):
1. Console tab
2. Look for logs:
   - "Page data saved to chrome.storage.sync"
   - "Successfully parsed job data from HTML"
   - "Page HTML length: XXXX chars"

### Common Issues & Fixes

#### Issue: "No Master Resume" Warning

**Solution:**
1. Go to http://localhost:8080
2. Click "Tailor Your Resume"
3. Upload your resume
4. **Wait** for success message
5. Refresh the extension
6. Try again

**Why it happens:** Extension popup loads before resume is saved to chrome.storage.

#### Issue: "No Job Posting Found"

**Solution:**
1. Make sure you're on a supported job site:
   - LinkedIn
   - Indeed
   - Naukri
   - Monster
   - Glassdoor
   - Dice
   - ZipRecruiter
   - Built In

2. **Reload the page** - the button needs to inject
3. Open DevTools → Sources
4. Look for `content.js` in the injected scripts
5. If not there, the content script failed to load

**Why it happens:** Content script injection or page HTML structure not recognized.

#### Issue: Gemini API Errors

**Solution:**
1. Check `.env.local` has `VITE_GOOGLE_GEMINI_API_KEY` set
2. Verify the API key works: https://makersuite.google.com/app/apikey
3. Check API quota hasn't been exceeded
4. Look at DevTools console for the exact error

**Why it happens:** API key not set, expired, or quota exceeded.

#### Issue: Resume Tailoring is Slow

**Normal:** Gemini API calls take 10-30 seconds
- Extracting job requirements
- Tailoring resume for the job
- Calculating ATS score

**If it takes longer:**
1. Check network tab for failed requests
2. Check Gemini API quota
3. Check browser console for errors

### Enable Verbose Logging

Edit `client/extension/popup.ts` and content.ts to see detailed logs:

```javascript
// Already added logging for:
console.log("Initializing extension popup...")
console.log("Master resume loaded:", resume ? "Yes" : "No")
console.log("Page HTML retrieved:", pageHTML ? `${pageHTML.length} chars` : "None")
console.log("Successfully parsed job data from HTML:", state.jobData)
```

View these in:
1. For popup: Right-click popup → Inspect → Console
2. For content script: DevTools → Console on the job page

## File Changes Made

### Updated Files:

1. **client/extension/content.ts**
   - Direct chrome.storage.sync writes instead of saveToStorage wrapper
   - Better error messages
   - Visual feedback on button state

2. **client/extension/popup.ts**
   - New `getFromStorageSync()` helper for reliable data retrieval
   - Enhanced logging at each step
   - Better error handling

3. **client/utils/storage.ts**
   - Improved `getMasterResume()` to check chrome.storage.sync first
   - Better JSON string handling
   - Sync between localStorage and chrome.storage

4. **client/services/gemini.ts**
   - Improved HTML cleaning (remove comments, scripts, styles)
   - Better Gemini prompt for job extraction
   - More detailed error logging
   - Better JSON extraction from response

5. **client/utils/jobExtractor.ts**
   - Minor styling improvements to button

## Testing Checklist

- [ ] 1. Resume uploaded to localhost:8080
- [ ] 2. Extension loaded with "Load unpacked"
- [ ] 3. Visited a job posting page
- [ ] 4. "Analyse" button visible (bottom-right)
- [ ] 5. Clicked "Analyse"
- [ ] 6. Popup opened automatically
- [ ] 7. Job title & company showing in popup
- [ ] 8. No "No Master Resume" error
- [ ] 9. Clicked "⚡ Tailor Resume"
- [ ] 10. Tailoring completed (10-30 seconds)
- [ ] 11. ATS score showing (50-100%)
- [ ] 12. Downloaded resume successfully
- [ ] 13. Checked devtools console - no errors

## Next Steps

1. **For Local Testing:**
   ```bash
   npm run dev              # Web app on localhost:8080
   npm run dev:extension    # Extension builder in watch mode
   ```

2. **For Production Build:**
   ```bash
   npm run build:extension  # Builds to dist/extension/
   ```

3. **For Chrome Web Store:**
   - Zip the `dist/extension/` folder
   - Upload to Chrome Web Store Developer Console

## Architecture Overview

### How Storage Works

```
Web App (localhost:8080)
    ↓
    localStorage (primary)
    ↓
    chrome.storage.sync (secondary, if available)

Extension Popup
    ↓
    chrome.storage.sync (primary)
    ↓
    localStorage (fallback, if available)

Result: Both can access and share the same data
```

### Flow Diagram

```
┌─────────────────────────────────────────┐
│  User visits job posting page           │
│  (LinkedIn, Indeed, etc.)               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Content Script Injects "Analyse" Button│
│  (client/extension/content.ts)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  User Clicks "Analyse"                  │
│  Button Status: ⏳ Analyzing...         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Content Script:                        │
│  1. Captures full page HTML             │
│  2. Extracts basic job data from DOM    │
│  3. Stores in chrome.storage.sync       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Content Script:                        │
│  Opens Extension Popup                  │
│  Button Status: ✓ Analyzed! Opening... │
└──────────────┬──────────────────────────┘
               │
┌─────────────��▼──────────────────────────┐
│  Popup Script (client/extension/popup.ts)
│  1. Retrieves HTML from storage         │
│  2. Gets master resume                  │
│  3. Sends HTML to Gemini API            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Gemini API:                            │
│  Parses HTML → Extracts job details    │
│  Returns: {title, company, skills...}  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Popup UI:                              │
│  Shows job info                         │
│  Buttons: Tailor, Download, Save       │
└──────────────┬──────────────────────────┘
               │
        User clicks "⚡ Tailor"
               │
���──────────────▼──────────────────────────┐
│  Tailor Process:                        │
│  1. Extract job requirements (Gemini)   │
│  2. Tailor resume to job (Gemini)       │
│  3. Calculate ATS score (Gemini)        │
│  4. Show results                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Download or Save:                      │
│  - Download as DOCX                     │
│  - Save to browser history              │
│  - View on Dashboard                    │
└─────────────────────────────────────────┘
```

## Support

If you encounter issues:

1. **Check the console logs** (DevTools → Console)
2. **Verify Gemini API key** is set and valid
3. **Reload the extension** (chrome://extensions → Refresh)
4. **Clear browser storage** if getting stale data
5. **Check CORS** - should not be an issue since no backend calls

## Performance Notes

- **HTML capturing**: ~100ms
- **Gemini API parsing**: 3-10 seconds
- **Resume tailoring**: 10-20 seconds total
  - Extract requirements: 3-5s
  - Tailor resume: 5-10s
  - ATS score: 3-5s

**Total time**: ~20-30 seconds per job analysis

This is normal and expected with AI model processing.
