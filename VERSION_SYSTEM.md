# 🔄 Automatic Version Check System

## Overview

This system automatically detects when new code is deployed and prompts users to refresh their browser, preventing cache-related sync issues.

---

## How It Works

### 1. **Version API** (`app/api/version/route.ts`)
- Serves the current app version number
- Returns: `{ version: "1.0.0", timestamp: ... }`
- **No caching** - always returns fresh data

### 2. **Version Check Hook** (`hooks/useVersionCheck.ts`)
- Runs on every page load
- Checks server version every **30 seconds**
- Compares with stored version in `localStorage`
- Triggers callback when version mismatch detected

### 3. **Version Check Modal** (`components/VersionCheckModal.tsx`)
- Beautiful UI to notify users of updates
- Two options:
  - **"Refresh Now"** - Hard reload immediately
  - **"Later"** - Dismiss and continue (not recommended)
- Shows keyboard shortcut hint (Ctrl+Shift+R)

### 4. **Integration** (Both pages)
- **Home Page** (`app/page.tsx`)
- **Game Page** (`app/play/[code]/page.tsx`)
- Both pages automatically show modal when update detected

---

## How to Update Version

### When You Make Code Changes:

1. **Open** `app/api/version/route.ts`

2. **Update the version number:**
   ```typescript
   // Before
   const APP_VERSION = '1.0.0';
   
   // After (increment based on change type)
   const APP_VERSION = '1.0.1';  // Bug fix
   // or
   const APP_VERSION = '1.1.0';  // New feature
   // or
   const APP_VERSION = '2.0.0';  // Major change
   ```

3. **Save and deploy**

4. **Result:**
   - All connected players see modal within 30 seconds
   - They click "Refresh Now" → Get latest code
   - No more cache sync issues! ✅

---

## Version Numbering Guide

Use **Semantic Versioning** (MAJOR.MINOR.PATCH):

| Type | Example | When to Use |
|------|---------|-------------|
| **MAJOR** | `1.0.0` → `2.0.0` | Breaking changes, major refactors |
| **MINOR** | `1.0.0` → `1.1.0` | New features, enhancements |
| **PATCH** | `1.0.0` → `1.0.1` | Bug fixes, small tweaks |

### Examples:

```typescript
// Bug fix - incrementPATCH
'1.0.0' → '1.0.1'  // Fixed scoring calculation
'1.0.1' → '1.0.2'  // Fixed board rendering

// New feature - increment MINOR
'1.0.2' → '1.1.0'  // Added 4-way domino system
'1.1.0' → '1.2.0'  // Added chat feature

// Breaking change - increment MAJOR
'1.2.0' → '2.0.0'  // Complete UI redesign
'2.0.0' → '3.0.0'  // New game engine
```

---

## Testing

### Test the System:

1. **Open the app in two browsers** (Cavid & Yusif)

2. **Update version** in `app/api/version/route.ts`:
   ```typescript
   const APP_VERSION = '1.0.1'; // Changed from 1.0.0
   ```

3. **Save and wait 30 seconds** (or reload the dev server)

4. **Both browsers should show the modal:**
   ```
   ┌─────────────────────────────────┐
   │ 🔄 New Version Available        │
   │                                 │
   │ A new version of the game has   │
   │ been deployed with updates...   │
   │                                 │
   │ [Refresh Now]      [Later]      │
   └─────────────────────────────────┘
   ```

5. **Click "Refresh Now"** → Browser hard reloads → Fresh code loaded! ✅

---

## Technical Details

### Check Interval
```typescript
const CHECK_INTERVAL = 30000; // 30 seconds
```

### Storage Key
```typescript
const VERSION_KEY = 'app_version'; // localStorage key
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens App                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  useVersionCheck Hook Starts                                │
│  • Fetch /api/version (server version)                      │
│  • Load localStorage (stored version)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │ Version Match?│
                    └───────────────┘
                     /             \
                   YES              NO
                    ↓               ↓
            ┌───────────┐   ┌─────────────┐
            │ Continue  │   │ Show Modal  │
            │ Playing   │   │ "Refresh?"  │
            └───────────┘   └─────────────┘
                                    ↓
                            User clicks "Refresh"
                                    ↓
                            window.location.reload()
                                    ↓
                            ┌───────────────┐
                            │ Fresh Code    │
                            │ Loaded! ✅    │
                            └───────────────┘
```

---

## Benefits

✅ **No More Cache Issues** - Players always have latest code  
✅ **Automatic Detection** - No manual checking needed  
✅ **User-Friendly** - Clear prompt to refresh  
✅ **Prevents Sync Bugs** - Everyone on same version  
✅ **Simple to Use** - Just update one number  

---

## Current Version

**App Version:** `1.0.0`

**Last Updated:** Implementation of automatic version check system

**Next Version:** Update to `1.0.1` when you make your next change!

---

## Notes

- The modal checks every **30 seconds** while the page is open
- Version is stored in **localStorage** per browser
- Hard reload (**Ctrl+Shift+R**) also works manually
- If users dismiss the modal, they can still play but may encounter sync issues
- On refresh, the version is updated automatically

---

## Quick Reference

| File | Purpose |
|------|---------|
| `app/api/version/route.ts` | **UPDATE THIS** when you make changes |
| `hooks/useVersionCheck.ts` | Automatic checking logic |
| `components/VersionCheckModal.tsx` | UI for the refresh prompt |
| `app/page.tsx` | Home page integration |
| `app/play/[code]/page.tsx` | Game page integration |

**Remember:** Every time you update code, increment the version in `app/api/version/route.ts`! 🎯

