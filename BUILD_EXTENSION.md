# Build & Load Chrome Extension - Complete Guide

## Step 1: Build the Extension

```bash
# Build ONLY the extension
npm run build:extension

# OR build everything (web + server + extension)
npm run build
```

This will create: **`dist/extension/`** with:

- ✅ `manifest.json`
- ✅ `background.js`
- ✅ `content.js`
- ✅ `popup.js`
- ✅ `popup.html`
- ✅ `favicon.ico`

## Step 2: Load in Chrome

### 2A. Open Chrome Extensions Page

```
chrome://extensions/
```

### 2B. Enable Developer Mode

- Look for **"Developer mode"** toggle in top-right corner
- Click to turn it **ON** (should be blue)

### 2C. Load the Extension

1. Click **"Load unpacked"** button
2. Navigate to your project folder
3. **Select `dist/extension/` folder** (NOT `client/extension`)
4. Click **"Select Folder"**

## Step 3: Verify Extension Loaded

You should see:

- ✅ "ResumeMatch Pro" extension in your list
- ✅ Extension icon in Chrome toolbar (top-right)
- ✅ No errors in the extension details page

## Step 4: Test the Extension

1. Go to a job site:
   - LinkedIn (linkedin.com)
   - Indeed (indeed.com)
   - Glassdoor (glassdoor.com)
   - Naukri (naukri.com)

2. Click the ResumeMatch Pro icon in toolbar

3. You should see the popup with:
   - Job information
   - "⚡ Tailor Resume" button
   - "⬇️ Download Resume" button

## Troubleshooting

### "Manifest file is missing"

**Problem:** You selected the wrong folder
**Solution:** Select `dist/extension/` (not `dist/`, not `client/`, not `public/`)

### Extension doesn't appear

**Solution:**

1. Run `npm run build:extension` again
2. Go to `chrome://extensions/`
3. Click refresh button on the extension card
4. Reload job site page (Ctrl+R)

### Changes not showing

**Solution:**

1. Rebuild: `npm run build:extension`
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on ResumeMatch Pro card
4. Reload job site (Ctrl+R)

### Scripts show as red/error

**Problem:** Check popup.js and other files are actually in `dist/extension/`
**Solution:**

```bash
# Verify files exist:
ls -la dist/extension/

# Should show:
# manifest.json
# background.js
# content.js
# popup.js
# popup.html
# favicon.ico
```

## Build Structure

```
dist/extension/
├── manifest.json      ← Chrome reads this
├── background.js      ← Service worker
├── content.js         ← Content script
├── popup.js          ← Popup script
├── popup.html        ← Popup UI
└── favicon.ico       ← Icon

Ready to load in chrome://extensions/ ✅
```

## Development Workflow

### While Developing:

```bash
# Terminal 1: Watch for extension changes
npm run dev:extension

# Terminal 2: Run dev server (if needed)
npm run dev
```

### After Making Changes:

1. Run `npm run build:extension`
2. Go to `chrome://extensions/`
3. Click refresh icon on ResumeMatch Pro
4. Reload page to see changes

## Production Build

```bash
# Build all (web, server, and extension)
npm run build

# Outputs:
# dist/spa/        → Web app
# dist/server/     → Express server
# dist/extension/  → Chrome extension
```

Then load `dist/extension/` in Chrome!

## Quick Commands Reference

```bash
# Build extension only
npm run build:extension

# Watch extension changes (auto-rebuild)
npm run dev:extension

# Build everything
npm run build

# Run dev server
npm run dev

# Build specific targets
npm run build:client    # Web app
npm run build:server    # Express server
npm run build:extension # Chrome extension
```

## Common Mistakes

❌ **Wrong:** Selecting `client/extension` folder
✅ **Right:** Selecting `dist/extension` folder

❌ **Wrong:** Not running `npm run build:extension` after code changes
✅ **Right:** Always rebuild before reloading in Chrome

❌ **Wrong:** Forgetting to click refresh icon after rebuild
✅ **Right:** Rebuild → Click refresh → Reload page

---

**Ready?**

```bash
npm run build:extension
# Then load dist/extension/ in chrome://extensions/
```
